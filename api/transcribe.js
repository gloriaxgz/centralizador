export default async function handler(req, res) {
  // Isso garante que apenas requisições POST funcionem
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.DEEPGRAM_API_KEY;
  const { audioUrl } = req.body;

  if (!audioUrl) {
    return res.status(400).json({ error: 'URL do áudio é obrigatória' });
  }

  try {
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=pt-BR&smart_format=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: audioUrl })
    });

    const data = await response.json();
    const transcript = data.results?.channels[0]?.alternatives[0]?.transcript || "";
    
    return res.status(200).json({ transcript });

  } catch (error) {
    return res.status(500).json({ error: 'Falha na transcrição.' });
  }
}