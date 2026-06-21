// Shared auth: verify the Supabase JWT and return the real userId.
// Returns { userId } on success, or { error, status } on failure.
module.exports.getUserId = async function(req) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    // transitional fallback — REMOVE once all app builds send the token
    if (req.body && req.body.userId) return { userId: req.body.userId, legacy: true };
    return { error: 'auth required', status: 401 };
  }
  try {
    const r = await fetch('https://dajqkdztttavidnpijda.supabase.co/auth/v1/user', {
      headers: { 'Authorization': 'Bearer ' + token, 'apikey': process.env.SUPABASE_ANON_KEY }
    });
    if (!r.ok) return { error: 'invalid token', status: 401 };
    const user = await r.json();
    if (!user || !user.id) return { error: 'invalid token', status: 401 };
    return { userId: user.id };
  } catch (e) {
    return { error: 'auth check failed', status: 401 };
  }
};
