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
const GRANT_TYPES = ['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE'];
// Event types that REVOKE access (drop to free).
const REVOKE_TYPES = ['EXPIRATION'];
// NOTE: CANCELLATION is deliberately NOT here. On CANCELLATION the user has
// opted out of auto-renew but keeps access until EXPIRATION, so we do nothing
// and let the later EXPIRATION event drop them to free.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Auth: shared secret set in the RevenueCat dashboard Authorization header.
  const expected = process.env.REVENUECAT_WEBHOOK_SECRET;
  const got = req.headers['authorization'];
  if (!expected || got !== expected) {
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
  if (GRANT_TYPES.includes(type)) {
    newTier = tierFromEntitlements(entitlementIds);
    if (!newTier) {
      console.error('RevenueCat webhook: grant event with unknown entitlements:', JSON.stringify(entitlementIds));
      return res.status(200).json({ received: true, skipped: 'unknown_entitlement' });
    }
  } else if (REVOKE_TYPES.includes(type)) {
    newTier = 'free';
  } else {
    // CANCELLATION, BILLING_ISSUE, SUBSCRIBER_ALIAS, TEST, etc. — acknowledge, do nothing.
    console.log('RevenueCat webhook: no-op event type ' + type);
    return res.status(200).json({ received: true, ignored: type });
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

    console.log('RevenueCat webhook: set user ' + appUserId + ' to ' + newTier + ' (' + type + ')');
    return res.status(200).json({ received: true, tier: newTier });
  } catch (err) {
    console.error('RevenueCat webhook: handler error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
