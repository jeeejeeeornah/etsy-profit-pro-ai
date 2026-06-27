export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // --- auth: require a valid Supabase JWT ---
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'DEBUG-1-no-token' });
  try {
    const ar = await fetch('https://dajqkdztttavidnpijda.supabase.co/auth/v1/user', {
      headers: { 'Authorization': 'Bearer ' + token, 'apikey': process.env.SUPABASE_ANON_KEY }
    });
    if (!ar.ok) {
      const errBody = await ar.text().catch(() => '');
      console.log('CHATDEBUG supabase rejected, status=' + ar.status + ' body=' + errBody);
      return res.status(401).json({ error: 'DEBUG-2-supabase-rejected', supastatus: ar.status });
    }
    const user = await ar.json();
    if (!user || !user.id) return res.status(401).json({ error: 'DEBUG-3-no-user-id' });
  } catch (e) {
    console.log('CHATDEBUG fetch threw: ' + String(e));
    return res.status(401).json({ error: 'DEBUG-4-fetch-threw', detail: String(e) });
  }
  // --- end auth ---

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
    res.status(200).json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
