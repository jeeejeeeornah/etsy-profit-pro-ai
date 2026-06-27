import { createClient } from '@supabase/supabase-js';

const SUPA_URL = 'https://dajqkdztttavidnpijda.supabase.co';

// Monthly KI message limits per tier. Unknown tier => generous (treated as paid).
const LIMITS = { free: 10, pro: 100, business: 100 };

function yearMonth() {
  const d = new Date();
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // --- auth: require a valid Supabase JWT ---
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'auth required' });

  let userId = null;
  try {
    const ar = await fetch(SUPA_URL + '/auth/v1/user', {
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
  let usageRow = null;
  let admin = null;
  try {
    admin = createClient(SUPA_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // tier
    let tier = 'free';
    try {
      const { data: prof } = await admin
        .from('profiles').select('subscription_tier').eq('id', userId).single();
      if (prof && prof.subscription_tier) tier = prof.subscription_tier;
    } catch (e) { /* tier lookup failed -> default free limit, still fail-open below */ }

    const limit = LIMITS[tier] != null ? LIMITS[tier] : 100;
    const ym = yearMonth();

    // current count
    let count = 0;
    try {
      const { data: row } = await admin
        .from('ki_usage').select('count').eq('user_id', userId).eq('year_month', ym).single();
      if (row && typeof row.count === 'number') { count = row.count; usageRow = row; }
    } catch (e) { /* no row yet or lookup failed -> treat as 0 */ }

    if (count >= limit) {
      return res.status(429).json({ error: 'limit_reached', tier: tier, limit: limit });
    }
  } catch (e) {
    // Any unexpected failure in the cap block -> allow the call (fail-open).
    admin = null;
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

    // increment usage AFTER a successful call (best-effort, never blocks the response)
    if (admin) {
      try {
        const ym = yearMonth();
        await admin.from('ki_usage')
          .upsert({ user_id: userId, year_month: ym, count: (usageRow ? usageRow.count : 0) + 1, updated_at: new Date().toISOString() },
                  { onConflict: 'user_id,year_month' });
      } catch (e) { /* increment failed -> ignore, user keeps access */ }
    }

    res.status(200).json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
