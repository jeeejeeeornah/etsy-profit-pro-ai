module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.ETSY_API_KEY;
  const redirectUri = 'https://etsy-profit-pro-ai.vercel.app/api/etsy-callback';
  const scopes = 'transactions_r listings_r';
  const state = req.query.userId || 'unknown';

  const authUrl = `https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&client_id=${apiKey}&state=${state}&code_challenge_method=S256&code_challenge=`;

  // Generate PKCE code verifier and challenge
  const crypto = require('crypto');
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  const finalUrl = `https://www.etsy.com/oauth/connect?response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&client_id=${apiKey}&state=${state}&code_challenge_method=S256&code_challenge=${codeChallenge}`;

  res.setHeader('Set-Cookie', `code_verifier=${codeVerifier}; Path=/; HttpOnly; SameSite=Lax`);
  return res.redirect(302, finalUrl);
};
