module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { userId } = req.query;
  if (!userId) return res.status(400).json({error: 'userId required'});
  try {
    const r = await fetch(`https://dajqkdztttavidnpijda.supabase.co/rest/v1/user_totals?user_id=eq.${userId}&select=total_income,total_expenses,profit`, {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_KEY
      }
    });
    const data = await r.json();
    return res.status(200).json(data);
  } catch(e) {
    return res.status(500).json({error: e.message});
  }
};
