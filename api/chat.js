export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const { messages, context } = req.body;
    const filtered = messages.filter(m => m.role === 'user' || m.role === 'assistant');

    const systemPrompt = `Du bist ein hilfreicher KI-Steuerberater für deutsche Kleinunternehmer und Etsy-Verkäufer. Antworte in der Sprache des Nutzers (Deutsch oder Englisch). Kleinunternehmerregelung ab 2025: 25.000€ Vorjahr, 100.000€ laufendes Jahr. Weise bei wichtigen Entscheidungen auf einen Steuerberater hin.${context ? '\n\n' + context : ''}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: systemPrompt,
        messages: filtered
      })
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
}
