// /api/scan must enforce the Pro tier SERVER-side (defense in depth — the app
// gates it with requirePro, but the server must not trust the client), and
// refuse BEFORE any storage read or model call so a refused request is free.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import scan from '../api/scan.js';
import { fakeReq, fakeRes, installFetch, setEnv } from './_harness.mjs';

setEnv();
const users = { 'free-tok': 'u-free', 'pro-tok': 'u-pro', 'biz-tok': 'u-biz', 'none-tok': 'u-none' };
const tiers = { 'u-free': 'free', 'u-pro': 'pro', 'u-biz': 'business' }; // u-none: no profile row

const costly = (calls) => calls.filter((c) => c.url.includes('storage') || c.url.includes('anthropic'));

async function run(req, world = {}) {
  const calls = installFetch({ users, tiers, ...world });
  const res = fakeRes();
  await scan(req, res);
  return { res, calls };
}

test('free user → 403 upgrade_required, no storage read, no model call', async () => {
  const { res, calls } = await run(fakeReq({ token: 'free-tok' }));
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: 'upgrade_required', required: 'pro', tier: 'free' });
  assert.deepEqual(costly(calls), []);
});

test('no profile row → treated as free → 403', async () => {
  const { res, calls } = await run(fakeReq({ token: 'none-tok' }));
  assert.equal(res.statusCode, 403);
  assert.deepEqual(costly(calls), []);
});

test('legacy no-token path (body.userId) cannot bypass the tier gate', async () => {
  const { res, calls } = await run(fakeReq({ token: null, body: { userId: 'u-free' } }));
  assert.equal(res.statusCode, 403);
  assert.deepEqual(costly(calls), []);
});

test('tier lookup fails → 503 (fail closed), no model call', async () => {
  const { res, calls } = await run(fakeReq({ token: 'pro-tok' }), { tierStatus: 500 });
  assert.equal(res.statusCode, 503);
  assert.deepEqual(costly(calls), []);
});

test('Pro user → 200 with the parsed receipt', async () => {
  const { res, calls } = await run(fakeReq({ token: 'pro-tok' }));
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.amount, 12.5);
  assert.equal(calls.filter((c) => c.url.includes('anthropic')).length, 1);
});

test('Business user → 200', async () => {
  const { res } = await run(fakeReq({ token: 'biz-tok' }));
  assert.equal(res.statusCode, 200);
});

test('bad token → 401, nothing else called', async () => {
  const { res, calls } = await run(fakeReq({ token: 'nope' }));
  assert.equal(res.statusCode, 401);
  assert.deepEqual(costly(calls), []);
});
