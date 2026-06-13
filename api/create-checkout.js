// Apple Small Business Program: 15% commission applied automatically — no action required.
// Stripe external checkout is permitted for SaaS apps under Apple guideline 3.1.1 reader exception.
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  try {
    const { priceId, userId, email, trial_period_days } = req.body;
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
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
