export default async function handler(req, res) {
  const apiKey = process.env.OPENAI_KEY;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { messages, temperature } = req.body;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        temperature: temperature || 0.5
      })
    });

    const data = await response.json();
    
    if (data.error) throw new Error(data.error.message);

    // Devolve só o texto da mensagem
    res.status(200).json({ content: data.choices[0].message.content });

  } catch (error) {
    console.error("OpenAI Error:", error);
    res.status(500).json({ error: 'Falha na IA.' });
  }
}