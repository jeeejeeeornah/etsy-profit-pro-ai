module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // --- auth: require a valid Supabase JWT, capture the user's email ---
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return res.status(401).json({ error: 'auth required' });
  let userEmail;
  try {
    const ar = await fetch('https://dajqkdztttavidnpijda.supabase.co/auth/v1/user', {
      headers: { 'Authorization': 'Bearer ' + token, 'apikey': process.env.SUPABASE_ANON_KEY }
    });
    if (!ar.ok) return res.status(401).json({ error: 'invalid token' });
    const user = await ar.json();
    if (!user || !user.id || !user.email) return res.status(401).json({ error: 'invalid token' });
    userEmail = user.email;
  } catch (e) {
    return res.status(401).json({ error: 'auth check failed' });
  }
  // --- end auth ---

  try {
    const { subject, htmlBody, pdfBase64, filename } = req.body;
    // recipient is ALWAYS the authenticated user's own email — never trust req.body.email
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: 'Klarer Gewinn', email: 'hello@klarergewinn.de' },
        to: [{ email: userEmail }],
        subject: subject,
        htmlContent: htmlBody,
        attachment: pdfBase64 ? [{
          name: filename || 'EUR-Bericht.pdf',
          content: pdfBase64,
        }] : undefined
      })
    });
    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: data });
    res.status(200).json({ success: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
