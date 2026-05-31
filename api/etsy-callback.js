const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dajqkdztttavidnpijda.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { code, state: userId } = req.query;
    if (!code) return res.status(400).send('No code received from Etsy');

    const cookies = req.headers.cookie || '';
    const codeVerifier = cookies.split(';').find(c => c.trim().startsWith('code_verifier='))?.split('=')[1];
    if (!codeVerifier) return res.status(400).send('Missing code verifier');

    // Exchange code for access token
    const tokenRes = await fetch('https://api.etsy.com/v3/public/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.ETSY_API_KEY,
        redirect_uri: 'https://etsy-profit-pro-ai.vercel.app/api/etsy-callback',
        code,
        code_verifier: codeVerifier
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return res.status(400).send('Token exchange failed: ' + JSON.stringify(tokenData));

    // Save token to Supabase
    await supabase.from('etsy_tokens').upsert({
      user_id: userId,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    });

    // Redirect back to app
    return res.redirect(302, 'https://etsy-profit-pro-1ee5vg.flutterflow.app?etsy=connected');

  } catch(e) {
    return res.status(500).send('Error: ' + e.message);
  }
};
