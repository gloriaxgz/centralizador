export default async function handler(req, res) {
  const apiKey = process.env.DEEPGRAM_KEY;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { audioUrl } = req.body;
  if (!audioUrl) return res.status(400).json({ error: 'URL do áudio é obrigatória' });

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
    
    // Se der erro no Deepgram
    if (data.error) throw new Error(data.error);

    // Simplifica a resposta para o HTML
    const transcript = data.results?.channels[0]?.alternatives[0]?.transcript || "";
    
    res.status(200).json({ transcript });

  } catch (error) {
    console.error("Deepgram Error:", error);
    res.status(500).json({ error: 'Falha na transcrição.' });
  }
}