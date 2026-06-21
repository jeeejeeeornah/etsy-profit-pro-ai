const { getUserId } = require('./_auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const auth = await getUserId(req);
    if (auth.error) return res.status(auth.status).json({ error: auth.error });
    const userId = auth.userId;
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', userId)
      .single();
    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: profile?.email });
      customerId = customer.id;
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId);
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: 'https://klarergewinn.de/subscription-return',
    });
    res.status(200).json({ url: session.url });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
