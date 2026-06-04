module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({error:'not allowed'});
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({error: 'userId required'});
    const r = await fetch('https://dajqkdztttavidnpijda.supabase.co/storage/v1/object/list/receipts', {method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+process.env.SUPABASE_SERVICE_KEY,'apikey':process.env.SUPABASE_SERVICE_KEY},body:JSON.stringify({prefix:'',limit:1,sortBy:{column:'created_at',order:'desc'}})});
    const f = await r.json();
    console.log('Files:', JSON.stringify(f));
    if (!Array.isArray(f)||!f.length) return res.status(400).json({error:'no files',debug:f});
    const url='https://dajqkdztttavidnpijda.supabase.co/storage/v1/object/public/receipts/'+f[0].name;
    console.log('Image URL:', url);
    const imgRes = await fetch(url);
    const imgBuffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(imgBuffer).toString('base64');
    const a = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-sonnet-4-6',max_tokens:500,messages:[{role:'user',content:[{type:'image',source:{type:'base64',media_type:'image/jpeg',data:base64}},{type:'text',text:'Extract receipt data. Respond ONLY with JSON: {"amount":<number>,"category":"<Waren / Rohstoffe / Hilfsstoffe|Versandkosten|Etsy-Gebühren|Werbekosten / Marketing|Büromaterial / Arbeitsmittel|Telefon / Internet|Reisekosten / Fahrtkosten|Miete / Pacht|Versicherungen|Bankgebühren|Fortbildungskosten|Abschreibungen (AfA)|Sonstige Betriebsausgaben>","note":"<vendor name>","date":"<YYYY-MM-DD or null>"}'}]}]})});
    const d = await a.json();
    console.log('Anthropic:', JSON.stringify(d).substring(0,300));
    if (d.error) return res.status(400).json({error:d.error});
    return res.status(200).json(JSON.parse(d.content[0].text.replace(/```json|```/g,'').trim()));
  } catch(e) {
    console.log('Error:', e.message);
    return res.status(500).json({error:e.message});
  }
};
