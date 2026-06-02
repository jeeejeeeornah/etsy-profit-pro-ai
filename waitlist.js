const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://dajqkdztttavidnpijda.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    const { error } = await supabase
      .from('waitlist')
      .insert({ email: email.toLowerCase().trim() });

    if (error) {
      if (error.code === '23505') {
        return res.status(200).json({ success: true, message: 'Already on the list' });
      }
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });

  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
};
