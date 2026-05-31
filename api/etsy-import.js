const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dajqkdztttavidnpijda.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    // Get token from Supabase
    const { data: tokenRow } = await supabase
      .from('etsy_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!tokenRow) return res.status(400).json({ error: 'Etsy not connected' });

    // Get Etsy shop
    const shopRes = await fetch('https://openapi.etsy.com/v3/application/users/me/shops', {
      headers: {
        'x-api-key': process.env.ETSY_API_KEY,
        'Authorization': `Bearer ${tokenRow.access_token}`
      }
    });
    const shopData = await shopRes.json();
    const shopId = shopData.shop_id;
    if (!shopId) return res.status(400).json({ error: 'No shop found', shopData });

    // Get receipts (orders)
    const ordersRes = await fetch(`https://openapi.etsy.com/v3/application/shops/${shopId}/receipts?limit=100&was_paid=true`, {
      headers: {
        'x-api-key': process.env.ETSY_API_KEY,
        'Authorization': `Bearer ${tokenRow.access_token}`
      }
    });
    const ordersData = await ordersRes.json();
    const receipts = ordersData.results || [];

    // Import each order as income
    let imported = 0;
    for (const receipt of receipts) {
      const amount = receipt.grandtotal?.amount / receipt.grandtotal?.divisor || 0;
      const date = new Date(receipt.create_timestamp * 1000).toISOString();
      const note = `Etsy Order #${receipt.receipt_id}`;

      const { error } = await supabase.from('income').upsert({
        user_id: userId,
        amount,
        source: 'Etsy',
        note,
        date
      }, { onConflict: 'note,user_id' });

      if (!error) imported++;
    }

    return res.status(200).json({ success: true, imported, total: receipts.length });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
