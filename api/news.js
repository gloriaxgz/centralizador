export default async function handler(req, res) {
  // 1. O Cron do Vercel e as chamadas de busca comuns usam GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido. Use GET.' });
  }

  const GNEWS_KEY = process.env.GNEWS_KEY;

  // Verificação de segurança para a chave
  if (!GNEWS_KEY) {
    console.error("ERRO: GNEWS_KEY não configurada no Vercel.");
    return res.status(500).json({ error: 'Configuração de API ausente.' });
  }

  // 2. Define a query: prioridade para o que vem na URL, senão usa o padrão
  const q = req.query.q || '"Artificial Intelligence" OR "Generative AI" OR "NVIDIA"';
  
  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&max=20&sortby=publishedAt&token=${GNEWS_KEY}`;

  try {
    const response = await fetch(url);
    
    // Se a API do GNews retornar erro (ex: limite atingido)
    if (!response.ok) {
      const errorData = await response.json();
      console.error("GNews API Error:", errorData);
      return res.status(response.status).json({ error: 'Falha na API de notícias externa.' });
    }

    const data = await response.json();

    // 3. Opcional: Log para você confirmar no painel da Vercel que o Cron rodou
    console.log(`Notícias buscadas com sucesso para a query: ${q}`);

    res.status(200).json(data);
  } catch (error) {
    console.error("Erro interno no news.js:", error);
    res.status(500).json({ error: 'Erro ao processar busca de notícias' });
  }
}