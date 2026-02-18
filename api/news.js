import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const GNEWS_KEY = process.env.GNEWS_KEY;
  const q = '"Artificial Intelligence" OR "Generative AI" OR "NVIDIA"';
  
  // Captura se o parâmetro force=true foi enviado na URL
  const forceUpdate = req.query.force === 'true';

  try {
    // 1. Se NÃO for uma atualização forçada, tenta buscar no banco (Upstash)
    if (!forceUpdate) {
      const cachedNews = await kv.get('noticias_globais');
      if (cachedNews) {
        console.log("Entregando notícias vindas do banco de dados.");
        return res.status(200).json(cachedNews);
      }
    }

    // 2. Se for forceUpdate OU o banco estiver vazio, buscamos na API externa (GNews)
    console.log(forceUpdate ? "Atualização forçada solicitada. Buscando no GNews..." : "Banco vazio. Buscando notícias na GNews...");
    
    const response = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&max=20&sortby=publishedAt&token=${GNEWS_KEY}`);
    const data = await response.json();

    // Verificação de segurança para caso a API do GNews retorne erro ou limite excedido
    if (data.articles && data.articles.length > 0) {
      // 3. SALVA NO BANCO e renova o tempo de expiração para 1 hora (3600 segundos)
      await kv.set('noticias_globais', data.articles, { ex: 3600 });
      return res.status(200).json(data.articles);
    } else {
      // Se o GNews falhar mas tivermos algo no cache, entregamos o cache como fallback
      const fallback = await kv.get('noticias_globais');
      return res.status(200).json(fallback || []);
    }
    
  } catch (error) {
    console.error("Erro na API de notícias:", error);
    return res.status(500).json({ error: 'Erro ao processar notícias.' });
  }
}