// Apple Small Business Program: 15% commission applied automatically — no action required.
// Stripe external checkout is permitted for SaaS apps under Apple guideline 3.1.1 reader exception.
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

    const { priceId, email, trial_period_days } = req.body;

    // Look up (or create) ONE Stripe customer for this user, so we never
    // spawn duplicate customers across checkouts.
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', userId)
      .single();

    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: email || profile?.email });
      customerId = customer.id;
      await supabase.from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);
    }

    // Block a second subscription: if the customer already has an active or
    // trialing sub, send them to the billing portal to change plan instead.
    const existing = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10,
    });
    const hasActive = existing.data.some(s =>
      ['active', 'trialing', 'past_due', 'unpaid'].includes(s.status)
    );
    if (hasActive) {
      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: 'https://klarergewinn.de/subscription-return',
      });
      return res.status(200).json({ url: portal.url, redirected_to_portal: true });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer: customerId,
      metadata: { userId },
      subscription_data: trial_period_days ? { trial_period_days } : undefined,
      success_url: 'https://klarergewinn.de/success',
      cancel_url: 'https://klarergewinn.de/cancel',
    });
    res.status(200).json({ url: session.url });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
