const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// RevenueCat entitlement identifier -> our tier.
// Highest tier wins if a user somehow has both active.
function tierFromEntitlements(entitlementIds) {
  if (!Array.isArray(entitlementIds)) return null;
  if (entitlementIds.includes('business')) return 'business';
  if (entitlementIds.includes('pro')) return 'pro';
  return null;
}

// Event types that GRANT access (set the paid tier).
const GRANT_TYPES = [
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
  'PRODUCT_CHANGE',
  'NON_RENEWING_PURCHASE',
  'SUBSCRIPTION_EXTENDED',
];
// Event types that REVOKE access (drop to free).
const REVOKE_TYPES = ['EXPIRATION', 'SUBSCRIPTION_PAUSED'];
// NOTE: CANCELLATION is deliberately NOT in REVOKE_TYPES. On CANCELLATION the
// user has opted out of auto-renew but keeps access until EXPIRATION, so we do
// nothing and let the later EXPIRATION event drop them to free.
// The ONE exception is a refund, which RevenueCat also reports as CANCELLATION:
// there the purchase was reversed, so access ends immediately.
const REFUND_CANCEL_REASONS = ['CUSTOMER_SUPPORT', 'DEVELOPER_INITIATED'];

// Timing-safe string compare, so the shared secret can't be recovered by
// measuring how long a mismatch takes.
function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function msToIso(v) {
  if (v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? new Date(n).toISOString() : null;
}

// Records the delivery and reports whether we have seen this event id before.
//
// Returns 'new', 'duplicate', or 'unavailable'. 'unavailable' means the
// revenuecat_events table does not exist yet (or is unreadable): we log and
// carry on rather than failing the webhook, so audit/idempotency light up
// automatically once the migration is applied, and subscription syncing keeps
// working until then.
async function recordEvent(event, action, resultingTier, appUserId) {
  const row = {
    event_id: String(event.id),
    event_type: event.type,
    app_user_id: appUserId || null,
    original_app_user_id: event.original_app_user_id || null,
    resolved_user_id: appUserId || null,
    product_id: event.product_id || null,
    entitlement_ids: Array.isArray(event.entitlement_ids) ? event.entitlement_ids : null,
    period_type: event.period_type || null,
    environment: event.environment || null,
    store: event.store || null,
    cancel_reason: event.cancel_reason || null,
    purchased_at: msToIso(event.purchased_at_ms),
    expiration_at: msToIso(event.expiration_at_ms),
    event_timestamp: msToIso(event.event_timestamp_ms),
    action: action,
    resulting_tier: resultingTier,
    applied: false,
    raw: { event: event },
  };

  const { error } = await supabase.from('revenuecat_events').insert(row);
  if (!error) return 'new';

  // 23505 = unique_violation on event_id -> RevenueCat redelivered this event.
  if (error.code === '23505') return 'duplicate';

  // 42P01 = undefined_table, PGRST205 = not in PostgREST's schema cache.
  if (error.code === '42P01' || error.code === 'PGRST205') {
    console.warn(
      'RevenueCat webhook: revenuecat_events table not present — ' +
        'continuing without audit/idempotency (' + event.type + ')'
    );
    return 'unavailable';
  }

  console.error('RevenueCat webhook: could not record event:', error.message);
  return 'unavailable';
}

async function markApplied(eventId) {
  const { error } = await supabase
    .from('revenuecat_events')
    .update({ applied: true })
    .eq('event_id', String(eventId));
  if (error && error.code !== '42P01' && error.code !== 'PGRST205') {
    console.error('RevenueCat webhook: could not mark applied:', error.message);
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Auth: shared secret set in the RevenueCat dashboard Authorization header.
  const expected = process.env.REVENUECAT_WEBHOOK_SECRET;
  const got = req.headers['authorization'];
  if (!expected || !safeEqual(got || '', expected)) {
    console.error('RevenueCat webhook: unauthorized');
    return res.status(401).json({ error: 'unauthorized' });
  }

  const event = req.body && req.body.event;
  if (!event) {
    console.error('RevenueCat webhook: missing event');
    return res.status(400).json({ error: 'missing event' });
  }

  const type = event.type;
  const appUserId = event.app_user_id;
  const entitlementIds = event.entitlement_ids;

  // Ignore anonymous users — we can only sync ones tied to a Supabase id.
  if (!appUserId || appUserId.startsWith('$RCAnonymousID:')) {
    console.log('RevenueCat webhook: anonymous or missing app_user_id, skipping (' + type + ')');
    return res.status(200).json({ received: true, skipped: 'anonymous' });
  }

  let newTier;
  let action;
  if (GRANT_TYPES.includes(type)) {
    newTier = tierFromEntitlements(entitlementIds);
    if (!newTier) {
      console.error('RevenueCat webhook: grant event with unknown entitlements:', JSON.stringify(entitlementIds));
      return res.status(200).json({ received: true, skipped: 'unknown_entitlement' });
    }
    action = 'upgrade';
  } else if (REVOKE_TYPES.includes(type)) {
    newTier = 'free';
    action = 'downgrade';
  } else if (type === 'CANCELLATION' && REFUND_CANCEL_REASONS.includes(event.cancel_reason)) {
    // Refunded, not merely unsubscribed — the purchase is reversed, so access
    // ends now instead of at the end of the paid period.
    newTier = 'free';
    action = 'downgrade';
    console.log('RevenueCat webhook: refund (' + event.cancel_reason + ') — revoking immediately');
  } else {
    // CANCELLATION without a refund reason, BILLING_ISSUE, TRANSFER,
    // SUBSCRIBER_ALIAS, TEST, etc. — acknowledge, do nothing.
    console.log('RevenueCat webhook: no-op event type ' + type);
    return res.status(200).json({ received: true, ignored: type });
  }

  // Record before applying, so every tier change has a traceable cause and a
  // redelivered event is not applied twice.
  let seen = 'unavailable';
  if (event.id) {
    try {
      seen = await recordEvent(event, action, newTier, appUserId);
    } catch (err) {
      console.error('RevenueCat webhook: recordEvent threw:', err.message);
    }
    if (seen === 'duplicate') {
      console.log('RevenueCat webhook: duplicate delivery of event ' + event.id + ' — ignored');
      return res.status(200).json({ received: true, duplicate: true });
    }
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ subscription_tier: newTier })
      .eq('id', appUserId)
      .select('id');

    if (error) {
      console.error('RevenueCat webhook: Supabase update failed:', error.message);
      return res.status(500).json({ error: error.message });
    }
    if (!data || data.length === 0) {
      console.error('RevenueCat webhook: no profile matched id ' + appUserId + ' (' + type + ')');
      return res.status(200).json({ received: true, no_match: true });
    }

    if (seen === 'new') await markApplied(event.id);

    console.log('RevenueCat webhook: set user ' + appUserId + ' to ' + newTier + ' (' + type + ')');
    return res.status(200).json({ received: true, tier: newTier });
  } catch (err) {
    console.error('RevenueCat webhook: handler error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
