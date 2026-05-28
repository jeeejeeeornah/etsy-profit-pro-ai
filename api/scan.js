module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const supaRes = await fetch('https://dajqkdztttavidnpijda.supabase.co/storage/v1/object/list/receipts', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_KEY, 'apikey': process.env.SUPABASE_SERVICE_KEY }, body: JSON.stringify({ limit: 1, offset: 0, sortBy: { column: 'created_at', order: 'desc' } }) });
    const files = await supaRes.json();
    if (!Array.isArray(files) || files.length === 0) return res.status(400).json({ error: 'No files', debug: files });
    const imageUrl = 'https://dajqkdztttavidnpijda.supabase.co/storage/v1/object/public/receipts/' + files[0].name;
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 500, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'url', url: imageUrl } }, { type: 'text', text: 'Extract receipt data. Respond ONLY with valid JSON: {"amount": <number>, "category": "<Food|Transport|Office Supplies|Software|Marketing|Equipment|Utilities|Other>", "note": "<vendor and description>", "date": "<YYYY-MM-DD or null>"}' }] }] }) });
    const aiData = await aiRes.json();
