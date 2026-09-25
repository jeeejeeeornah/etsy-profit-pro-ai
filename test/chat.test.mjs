// /api/chat usage: GET returns the per-account count the app's "X/Y" counter
// shows; POST enforces Free 10 / Pro 100 / Business 100 (Business is NOT
// unlimited — cost cap).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import chat from '../api/chat.js';
import { fakeReq, fakeRes, installFetch, setEnv } from './_harness.mjs';

setEnv();
const users = { 'free-tok': 'u-free', 'pro-tok': 'u-pro', 'biz-tok': 'u-biz' };
const tiers = { 'u-free': 'free', 'u-pro': 'pro', 'u-biz': 'business' };

async function run(req, kiCount) {
  const calls = installFetch({ users, tiers, kiCount });
  const res = fakeRes();
  await chat(req, res);
  return { res, calls };
}
const modelCalls = (calls) => calls.filter((c) => c.url.includes('anthropic'));
const usageWrites = (calls) => calls.filter((c) => c.url.includes('ki_usage') && c.init.method === 'POST');

test('GET → this month\'s server count; no model call, nothing counted', async () => {
  const { res, calls } = await run(fakeReq({ method: 'GET', token: 'biz-tok' }), 42);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { tier: 'business', used: 42, limit: 100 });
  assert.deepEqual(modelCalls(calls), []);
  assert.deepEqual(usageWrites(calls), []);
});

test('GET limits: free 10, pro 100', async () => {
  assert.equal((await run(fakeReq({ method: 'GET', token: 'free-tok' }), 0)).res.body.limit, 10);
  assert.equal((await run(fakeReq({ method: 'GET', token: 'pro-tok' }), 0)).res.body.limit, 100);
});

test('GET without auth → 401', async () => {
  const { res } = await run(fakeReq({ method: 'GET', token: null }), 0);
  assert.equal(res.statusCode, 401);
});

test('Business at 100 → 429 with tier/limit/used; no model call', async () => {
  const { res, calls } = await run(fakeReq({ token: 'biz-tok', body: { messages: [{ role: 'user', content: 'hi' }] } }), 100);
  assert.equal(res.statusCode, 429);
  assert.deepEqual(res.body, { error: 'limit_reached', tier: 'business', limit: 100, used: 100 });
  assert.deepEqual(modelCalls(calls), []);
});

test('Pro at 99 → answered and counted (99 → 100)', async () => {
  const { res, calls } = await run(fakeReq({ token: 'pro-tok', body: { messages: [{ role: 'user', content: 'hi' }] } }), 99);
  assert.equal(res.statusCode, 200);
  assert.equal(modelCalls(calls).length, 1);
  const w = usageWrites(calls);
  assert.equal(w.length, 1);
  assert.equal(JSON.parse(w[0].init.body).count, 100);
});
