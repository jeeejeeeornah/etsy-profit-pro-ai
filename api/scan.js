export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl, fileName } = req.body;
    const finalUrl = imageUrl || `https://dajqkdztttavidnpijda.supabase.co/storage/v1/object/public/receipts/${fileName}`;

    if (!finalUrl) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'url',
                url: finalUrl
              }
            },
            {
              type: 'text',
              text: 'This is a receipt or invoice. Extract the following and respond ONLY with valid JSON, no other text: {"amount": <number only, no currency symbol>, "category": "<best category from: Food, Transport, Office Supplies, Software, Marketing, Equipment, Utilities, Other>", "note": "<vendor name and brief description>", "date": "<date in YYYY-MM-DD format if visible, otherwise null>"}'
            }
          ]
        }]
      })
    });

    const data = await response.json();
    const text = data.content[0].text;
    const parsed = JSON.parse(text);

    return res.status(200).json(parsed);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
