export default async function handler(req, res) {
  // 1. Removemos a trava estrita de POST para teste
  // 2. Pegamos os dados de qualquer lugar (body ou query)
  const audioUrl = req.body?.audioUrl || req.query?.audioUrl;
  const apiKey = process.env.DEEPGRAM_API_KEY;

  console.log("Recebido URL:", audioUrl);
  console.log("Método da requisição:", req.method);

  if (!audioUrl) {
    return res.status(400).json({ error: 'URL do áudio não foi recebida pelo servidor.' });
  }

  try {
    const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=pt-BR&smart_format=true', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: audioUrl })
    });

    const data = await response.json();
    
    if (!response.ok) {
        return res.status(response.status).json({ error: 'Erro na Deepgram: ' + (data.err_msg || 'Falha na chave') });
    }

    return res.status(200).json({ transcript: data.results.channels[0].alternatives[0].transcript });

  } catch (error) {
    return res.status(500).json({ error: 'Erro interno: ' + error.message });
  }
}