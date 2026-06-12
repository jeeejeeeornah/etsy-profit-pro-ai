const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const PRICE_TO_TIER = {
  'price_1TfgvMBHNCUGz5G4ZmzIx7z5': 'pro',       // Pro monthly €9.99
  'price_1ThEWjBHNCUGz5G4BrSB8x4l': 'pro',       // Pro annual €99
  'price_1TfgvMBHNCUGz5G4MLz7T7l2': 'business',  // Business monthly €27.99
  'price_1ThEW4BHNCUGz5G4dllF2JQZ': 'business',  // Business annual €279
};

module.exports.config = { api: { bodyParser: false } };

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  let event;
  try {
    const rawBody = await readRawBody(req);
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata && session.metadata.userId;

    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 1 });
      const priceId = lineItems.data[0] && lineItems.data[0].price && lineItems.data[0].price.id;
      const tier = PRICE_TO_TIER[priceId];

      if (!userId || !tier) {
        console.error('Missing userId or unknown price:', userId, priceId);
        return res.status(200).json({ received: true, skipped: true });
      }

      const { error } = await supabase
        .from('profiles')
        .update({ subscription_tier: tier })
        .eq('id', userId);

      if (error) {
        console.error('Supabase update failed:', error.message);
        return res.status(500).json({ error: error.message });
      }

      console.log('Upgraded user ' + userId + ' to ' + tier);
    } catch (err) {
      console.error('Handler error:', err.message);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(200).json({ received: true });
};
