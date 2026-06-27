export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const SUPA = 'https://dajqkdztttavidnpijda.supabase.co';
  const SROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const LIMITS = { free: 10, pro: 100, business: 100 };

  // --- auth: require a valid Supabase JWT ---
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'auth required' });

  let userId = null;
  try {
    const ar = await fetch(SUPA + '/auth/v1/user', {
      headers: { 'Authorization': 'Bearer ' + token, 'apikey': process.env.SUPABASE_ANON_KEY }
    });
    if (!ar.ok) return res.status(401).json({ error: 'invalid token' });
    const user = await ar.json();
    if (!user || !user.id) return res.status(401).json({ error: 'invalid token' });
    userId = user.id;
  } catch (e) {
    return res.status(401).json({ error: 'auth check failed' });
  }
  // --- end auth ---

  // --- usage cap (fail-OPEN: any error here lets the call through) ---
  const ym = new Date().toISOString().slice(0, 7); // "YYYY-MM"
  let currentCount = 0;
  let capActive = false;
  try {
    // tier
    let tier = 'free';
    try {
      const pr = await fetch(SUPA + '/rest/v1/profiles?id=eq.' + userId + '&select=subscription_tier', {
        headers: { 'apikey': SROLE, 'Authorization': 'Bearer ' + SROLE }
      });
      if (pr.ok) {
        const rows = await pr.json();
        if (rows[0] && rows[0].subscription_tier) tier = rows[0].subscription_tier;
      }
    } catch (e) { /* default free */ }

    const limit = LIMITS[tier] != null ? LIMITS[tier] : 100;

    // current usage
    try {
      const ur = await fetch(SUPA + '/rest/v1/ki_usage?user_id=eq.' + userId + '&year_month=eq.' + ym + '&select=count', {
        headers: { 'apikey': SROLE, 'Authorization': 'Bearer ' + SROLE }
      });
      if (ur.ok) {
        const rows = await ur.json();
        if (rows[0] && typeof rows[0].count === 'number') currentCount = rows[0].count;
      }
    } catch (e) { /* treat as 0 */ }

    capActive = true;
    if (currentCount >= limit) {
      return res.status(429).json({ error: 'limit_reached', tier: tier, limit: limit });
    }
  } catch (e) {
    capActive = false; // fail open
  }
  // --- end usage cap ---

  try {
    const { messages, system } = req.body;
    const filtered = (messages || []).filter(m => m.role === 'user' || m.role === 'assistant');
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: system || 'Du bist ein hilfreicher KI-Assistent für deutsche Kleinunternehmer.',
        messages: filtered
      })
    });
    const data = await response.json();

    // increment AFTER success (best-effort, upsert via REST)
    if (capActive) {
      try {
        await fetch(SUPA + '/rest/v1/ki_usage', {
          method: 'POST',
          headers: {
            'apikey': SROLE,
            'Authorization': 'Bearer ' + SROLE,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({ user_id: userId, year_month: ym, count: currentCount + 1, updated_at: new Date().toISOString() })
        });
      } catch (e) { /* ignore */ }
    }

    res.status(200).json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
