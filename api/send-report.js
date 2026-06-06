const { Resend } = require('resend');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { email, subject, htmlBody, pdfBase64, filename } = req.body;
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    await resend.emails.send({
      from: from: 'onboarding@resend.dev',
      to: email,
      subject: subject,
      html: htmlBody,
      attachments: pdfBase64 ? [{
        filename: filename || 'EÜR-Bericht.pdf',
        content: pdfBase64,
      }] : []
    });

    res.status(200).json({ success: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
