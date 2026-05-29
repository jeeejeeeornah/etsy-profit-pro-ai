module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({error:'not allowed'});
  try {
    const r = await fetch('https://dajqkdztttavidnpijda.supabase.co/storage/v1/object/list/receipts', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+process.env.SUPABASE_SERVICE_KEY,'apikey':process.env.SUPABASE_SERVICE_KEY},body:'{"prefix":"","limit":1,"sortBy":{"column":"created_at","order":"desc"}}'});
    const f = await r.json();
    if (!Array.isArray(f)||!f.length) return res.status(400).json({error:'no files',debug:f});
    const url='https://dajqkdztttavidnpijda.supabase.co/storage/v1/object/public/receipts/'+f[0].name;
    const a = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-opus-4-5',max_tokens:500,messages:[{role:'user',content:[{type:'image',source:{type:'url',url}},{type:'text',text:'Extract receipt data. Respond ONLY with JSON: {"amount":<number>,"category":"<Food|Transport|Office Supplies|Software|Marketing|Equipment|Utilities|Other>","note":"<vendor>","date":"<YYYY-MM-DD or null>"}'}]}]})});
    const d = await a.json();
    return res.status(200).json(JSON.parse(d.content[0].text.replace(/```json|```/g,'').trim()));
  } catch(e) { return res.status(500).json({error:e.message}); }
};
