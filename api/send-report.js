const nodemailer = require('nodemailer');

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { email, subject, htmlBody, pdfBase64, filename } = req.body;

    const transporter = nodemailer.createTransporter({
      host: process.env.BREVO_SMTP_HOST,
      port: parseInt(process.env.BREVO_SMTP_PORT),
      auth: {
        user: process.env.BREVO_SMTP_LOGIN,
        pass: process.env.BREVO_SMTP_PASSWORD,
      }
    });

    await transporter.sendMail({
      from: 'berichte@klarergewinn.de',
      to: email,
      subject: subject,
      html: htmlBody,
      attachments: pdfBase64 ? [{
        filename: filename || 'EUR-Bericht.pdf',
        content: Buffer.from(pdfBase64, 'base64'),
        contentType: 'application/pdf'
      }] : []
    });

    res.status(200).json({ success: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
