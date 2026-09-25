// Minimal harness for Vercel handlers: fake req/res and a routed fake fetch.
// No network, no dependencies — node:test only.

export function fakeRes() {
  return {
    statusCode: 200,
    body: undefined,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
    end() { return this; },
  };
}

export function fakeReq({ method = 'POST', token = 'good-token', body = {}, headers = {} } = {}) {
  return {
    method,
    body,
    headers: { ...(token ? { authorization: 'Bearer ' + token } : {}), ...headers },
  };
}

const json = (status, body) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json' },
});

/// Installs a fake global fetch. [world] describes the backend:
///   users:   token -> user id
///   tiers:   user id -> subscription_tier (missing = no profile row)
///   tierStatus: HTTP status for the profiles lookup (default 200)
///   kiCount: current ki_usage count for this month
/// Returns the list of { url, init } calls made.
export function installFetch(world) {
  const calls = [];
  globalThis.fetch = async (url, init = {}) => {
    const u = String(url);
    calls.push({ url: u, init });
    if (u.endsWith('/auth/v1/user')) {
      const tok = String((init.headers || {})['Authorization'] || '').replace(/^Bearer /, '');
      const id = (world.users || {})[tok];
      return id ? json(200, { id, email: id + '@example.de' }) : json(401, { msg: 'bad jwt' });
    }
    if (u.includes('/rest/v1/profiles')) {
      if (world.tierStatus && world.tierStatus !== 200) return json(world.tierStatus, { message: 'down' });
      const id = decodeURIComponent(u.match(/id=eq\.([^&]+)/)[1]);
      const t = (world.tiers || {})[id];
      return json(200, t === undefined ? [] : [{ subscription_tier: t }]);
    }
    if (u.includes('/rest/v1/ki_usage')) {
      if ((init.method || 'GET') === 'POST') return json(201, []);
      return json(200, world.kiCount == null ? [] : [{ count: world.kiCount }]);
    }
    if (u.includes('/storage/v1/object/list/receipts')) return json(200, [{ id: 'f1', name: 'r.jpg' }]);
    if (u.includes('/storage/v1/object/receipts/')) return new Response(new Uint8Array([1, 2, 3]));
    if (u.includes('api.anthropic.com')) {
      return json(200, {
        content: [{ type: 'text', text: '{"amount":12.5,"category":"Büromaterial / Arbeitsmittel","note":"Muster","date":"2026-09-01"}' }],
      });
    }
    throw new Error('unexpected fetch: ' + u);
  };
  return calls;
}

export function setEnv() {
  Object.assign(process.env, {
    SUPABASE_SERVICE_KEY: 'svc', SUPABASE_SERVICE_ROLE_KEY: 'svc',
    SUPABASE_ANON_KEY: 'anon', ANTHROPIC_API_KEY: 'sk-test',
  });
}
