export default async function handler(req, res) {
  // Log para depuração no console do Vercel
  console.log("Método recebido:", req.method);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: `Método ${req.method} não permitido. Use POST.` });
  }

  const apiKey = process.env.DEEPGRAM_API_KEY;
  const { audioUrl } = req.body;

  console.log("URL do áudio recebida:", audioUrl);

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

    if (!response.ok) {
      console.error("Erro Deepgram:", data);
      return res.status(response.status).json({ error: data.err_msg || 'Erro na API Deepgram' });
    }

    const transcript = data.results?.channels[0]?.alternatives[0]?.transcript || "";
    return res.status(200).json({ transcript });

  } catch (error) {
    console.error("Erro interno:", error);
    return res.status(500).json({ error: 'Erro interno no servidor de transcrição.' });
  }
}