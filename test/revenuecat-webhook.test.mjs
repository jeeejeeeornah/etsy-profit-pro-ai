// /api/revenuecat-webhook: a purchase whose app_user_id matches no profile
// must NOT be acknowledged with 200 (RevenueCat treats only 200 as success
// and retries anything else), and the delivery must still be recorded in
// revenuecat_events with applied=false. A redelivery of that unapplied event
// must be processed again — not swallowed as a duplicate.
//
// The real @supabase/supabase-js client runs against a fake PostgREST held
// in memory (routed through a fake global fetch) — no network, no database.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { fakeRes } from './_harness.mjs';

Object.assign(process.env, {
  SUPABASE_URL: 'https://fake-project.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'svc',
  REVENUECAT_WEBHOOK_SECRET: 'rc-secret',
});

// ── in-memory PostgREST ──────────────────────────────────────────────────────
let events; // event_id -> row
let profiles; // id -> { subscription_tier }
let profileUpdates;

const json = (status, body) =>
  new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

globalThis.fetch = async (input, init = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url);
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers);
  const body = init.body ? JSON.parse(init.body) : undefined;
  const eq = (col) => {
    const v = url.searchParams.get(col);
    return v && v.startsWith('eq.') ? v.slice(3) : undefined;
  };

  if (url.pathname === '/rest/v1/revenuecat_events') {
    if (method === 'POST') {
      const row = Array.isArray(body) ? body[0] : body;
      if (events.has(row.event_id)) {
        return json(409, { code: '23505', message: 'duplicate key value violates unique constraint', details: null, hint: null });
      }
      events.set(row.event_id, { ...row });
      return json(201);
    }
    if (method === 'PATCH') {
      const r = events.get(eq('event_id'));
      if (r) Object.assign(r, body);
      return json(204);
    }
    if (method === 'GET') {
      const r = events.get(eq('event_id'));
      const rows = r ? [{ applied: r.applied }] : [];
      if ((headers.get('accept') || '').includes('vnd.pgrst.object')) {
        return rows.length ? json(200, rows[0]) : json(406, { code: 'PGRST116', message: '0 rows', details: null, hint: null });
      }
      return json(200, rows);
    }
  }
  if (url.pathname === '/rest/v1/profiles' && method === 'PATCH') {
    const id = eq('id');
    profileUpdates.push({ id, ...body });
    if (!profiles.has(id)) return json(200, []);
    Object.assign(profiles.get(id), body);
    return json(200, [{ id }]);
  }
  throw new Error('unexpected request: ' + method + ' ' + url);
};

// Imported AFTER env + fetch are in place: the handler builds its client at load.
const { default: webhook } = await import('../api/revenuecat-webhook.js');

const USER = '11111111-2222-3333-4444-555555555555';
const STRANGER = '99999999-8888-7777-6666-555555555555';

function delivery(eventId, appUserId, type = 'INITIAL_PURCHASE') {
  return {
    method: 'POST',
    headers: { authorization: 'rc-secret' },
    body: {
      event: {
        id: eventId, type, app_user_id: appUserId,
        entitlement_ids: ['pro'], product_id: 'kg_pro_monthly',
        environment: 'PRODUCTION', store: 'APP_STORE',
        event_timestamp_ms: Date.now(),
      },
    },
  };
}

async function send(req) {
  const res = fakeRes();
  await webhook(req, res);
  return res;
}

beforeEach(() => {
  events = new Map();
  profiles = new Map([[USER, { subscription_tier: 'free' }]]);
  profileUpdates = [];
});

test('no matching profile → non-200 (404), and the event is still recorded with applied=false', async () => {
  const res = await send(delivery('evt-1', STRANGER));

  assert.notEqual(res.statusCode, 200, 'RevenueCat must see a failure so it retries');
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.error, 'no_profile_match');

  const row = events.get('evt-1');
  assert.ok(row, 'the delivery must be logged in revenuecat_events');
  assert.equal(row.applied, false);
  assert.match(row.note, /^no_profile_match/);
  assert.equal(row.app_user_id, STRANGER);
  assert.equal(profiles.get(USER).subscription_tier, 'free', 'nobody else was touched');
});

test('the retry of that event is processed again, not swallowed as a duplicate', async () => {
  await send(delivery('evt-2', STRANGER));             // 404, applied=false
  profiles.set(STRANGER, { subscription_tier: 'free' }); // profile appears later
  const res = await send(delivery('evt-2', STRANGER));  // RevenueCat's retry

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.tier, 'pro');
  assert.equal(profiles.get(STRANGER).subscription_tier, 'pro');
  assert.equal(events.get('evt-2').applied, true);
  assert.equal(events.get('evt-2').note, 'applied on redelivery');
});

test('matching profile → 200, tier set, event marked applied', async () => {
  const res = await send(delivery('evt-3', USER));
  assert.equal(res.statusCode, 200);
  assert.equal(profiles.get(USER).subscription_tier, 'pro');
  assert.equal(events.get('evt-3').applied, true);
});

test('a true duplicate of an APPLIED event → 200 and no second profile update', async () => {
  await send(delivery('evt-4', USER));
  const before = profileUpdates.length;
  const res = await send(delivery('evt-4', USER));
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.duplicate, true);
  assert.equal(profileUpdates.length, before);
});
