const { getUserId } = require('./_auth');

const SCAN_TIERS = ['pro', 'business'];

// profiles.subscription_tier for userId: 'free' when the row or column is
// empty, null when it could not be read at all.
async function readTier(userId) {
  try {
    const r = await fetch(
      'https://dajqkdztttavidnpijda.supabase.co/rest/v1/profiles?id=eq.' + encodeURIComponent(userId) + '&select=subscription_tier',
      { headers: { 'apikey': process.env.SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_KEY } }
    );
    if (!r.ok) return null;
    const rows = await r.json();
    return (rows[0] && rows[0].subscription_tier) || 'free';
  } catch (e) {
    return null;
  }
}

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({error:'not allowed'});
  try {
    const auth = await getUserId(req);
    if (auth.error) return res.status(auth.status).json({ error: auth.error });
    const userId = auth.userId;

    // Tier gate — the receipt scanner is Pro+ (the app gates it with
    // requirePro). Enforced here too so the server never trusts the client:
    // checked BEFORE any storage read or model call, so a refused request costs
    // nothing. Source is profiles.subscription_tier, maintained by the
    // RevenueCat webhook. Fails CLOSED with a retryable 503 if the tier can't
    // be read, rather than handing out a paid feature.
    const tier = await readTier(userId);
    if (tier === null) return res.status(503).json({ error: 'tier_unavailable' });
    if (!SCAN_TIERS.includes(tier)) {
      return res.status(403).json({ error: 'upgrade_required', required: 'pro', tier: tier });
    }

    const r = await fetch('https://dajqkdztttavidnpijda.supabase.co/storage/v1/object/list/receipts', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+process.env.SUPABASE_SERVICE_KEY,'apikey':process.env.SUPABASE_SERVICE_KEY},body:JSON.stringify({prefix:userId+'/',limit:100,sortBy:{column:'name',order:'desc'}})});
    const f = await r.json();
    const files = f.filter(item => item.id !== null);
    if (!files.length) return res.status(400).json({error:'no files'});

    const imgRes = await fetch('https://dajqkdztttavidnpijda.supabase.co/storage/v1/object/receipts/' + userId + '/' + files[0].name, {
      headers: { 'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_KEY, 'apikey': process.env.SUPABASE_SERVICE_KEY }
    });
    const imgBuffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(imgBuffer).toString('base64');
    const a = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:500,messages:[{role:'user',content:[{type:'image',source:{type:'base64',media_type:'image/jpeg',data:base64}},{type:'text',text:'Extract receipt data. Respond ONLY with JSON: {"amount":<number>,"category":"<Waren / Rohstoffe / Hilfsstoffe|Versandkosten|Etsy-Gebühren|Werbekosten / Marketing|Büromaterial / Arbeitsmittel|Telefon / Internet|Reisekosten / Fahrtkosten|Miete / Pacht|Versicherungen|Bankgebühren|Fortbildungskosten|Abschreibungen (AfA)|Sonstige Betriebsausgaben>","note":"<vendor name>","date":"<YYYY-MM-DD or null>"}'}]}]})});
    const d = await a.json();
    if (d.error) return res.status(400).json({error:d.error});
    return res.status(200).json(JSON.parse(d.content[0].text.replace(/```json|```/g,'').trim()));
  } catch(e) {
    return res.status(500).json({error:e.message});
  }
};
