module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const results = {};

  // Test Brevo
  try {
    const brevo = await fetch('https://api.brevo.com/v3/account', {
      headers: { 'api-key': process.env.BREVO_API_KEY }
    });
    results.brevo = brevo.ok ? 'ok' : 'error';
  } catch(e) { results.brevo = 'error'; }

  // Test Stripe
  try {
    const stripe = await fetch('https://api.stripe.com/v1/account', {
      headers: { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}` }
    });
    results.stripe = stripe.ok ? 'ok' : 'error';
  } catch(e) { results.stripe = 'error'; }

  res.status(200).json(results);
};
