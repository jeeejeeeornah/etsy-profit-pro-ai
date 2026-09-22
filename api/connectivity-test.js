module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const results = {};

  // TEMPORARY DIAGNOSTIC — remove once the Brevo failure is identified.
  // Surfaces the status code and error body Brevo returns, instead of a bare
  // boolean. Returned ONLY on a non-2xx: a successful /v3/account response
  // carries account details and this endpoint is public, so success stays 'ok'.
  results.diag = 'brevo-diag-v1';

  // Test Brevo
  try {
    const brevo = await fetch('https://api.brevo.com/v3/account', {
      headers: { 'api-key': process.env.BREVO_API_KEY }
    });
    results.brevo = brevo.ok ? 'ok' : 'error';
    if (!brevo.ok) {
      const raw = await brevo.text();
      results.brevoStatus = brevo.status;
      results.brevoBody = raw.slice(0, 500);
      console.error('[connectivity-test] Brevo ' + brevo.status + ': ' + raw.slice(0, 500));
    }
  } catch(e) {
    results.brevo = 'error';
    results.brevoStatus = 'fetch_threw';
    results.brevoBody = String(e && e.message).slice(0, 300);
  }

  // Test Stripe
  try {
    const stripe = await fetch('https://api.stripe.com/v1/account', {
      headers: { 'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}` }
    });
    results.stripe = stripe.ok ? 'ok' : 'error';
  } catch(e) { results.stripe = 'error'; }

  res.status(200).json(results);
};
