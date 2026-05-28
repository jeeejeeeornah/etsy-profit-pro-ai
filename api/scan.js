export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'No user ID provided' });
    }

    // List files in user's folder
    const listResponse = await fetch(
      `https://dajqkdztttavidnpijda.supabase.co/storage/v1/object/list/receipts/${userId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({ limit: 1, sortBy: { column: 'created_at', order: 'desc' } })
      }
    );

    const files = await listResponse.json();
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files found' });
    }

    const fileName = files[0].name;
    const imageUrl = `https://dajqkdztttavidnpijda.supabase.co/storage/v1/object/public/receipts/${userId}/${fileName}`;

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
              source: { type: 'url', url: imageUrl }
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
}            }
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
