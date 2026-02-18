export default async function handler(req, res) {
  // 1. Monitoramento básico
  console.log("Método:", req.method);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  // 2. Captura de dados
  const { audioUrl } = req.body;
  const apiKey = process.env.DEEPGRAM_API_KEY;

  // 3. Validação rigorosa
  if (!audioUrl) return res.status(400).json({ error: 'URL do áudio é obrigatória' });
  
  if (!apiKey) {
    console.error("ERRO: DEEPGRAM_API_KEY não encontrada no process.env");
    return res.status(500).json({ error: 'Chave de API ausente no servidor.' });
  }

  try {
    // 4. Chamada para o Deepgram
    // Usamos um template literal garantindo o espaço após 'Token'
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
      console.error("Resposta de erro do Deepgram:", data);
      // Se der 401 aqui, a chave realmente é inválida ou expirou
      return res.status(response.status).json({ 
        error: `Deepgram diz: ${data.err_msg || 'Erro de autenticação'}` 
      });
    }

    const transcript = data.results?.channels[0]?.alternatives[0]?.transcript || "";
    return res.status(200).json({ transcript });

  } catch (error) {
    console.error("Erro na requisição:", error);
    return res.status(500).json({ error: 'Falha interna ao conectar com Deepgram.' });
  }
}