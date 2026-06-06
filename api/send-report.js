module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { email, subject, htmlBody, pdfBase64, filename } = req.body;

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: 'Klarer Gewinn', email: 'jeeejeeornah@gmail.com' },
        to: [{ email: email }],
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
