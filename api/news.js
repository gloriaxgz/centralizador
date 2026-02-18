import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const GNEWS_KEY = process.env.GNEWS_KEY;
  const q = '"Artificial Intelligence" OR "Generative AI" OR "NVIDIA"';

  try {
    // 1. Tenta buscar no banco de dados central (Upstash)
    const cachedNews = await kv.get('noticias_globais');

    // 2. Se não houver nada no banco, buscamos na API externa (GNews)
    if (!cachedNews) {
      console.log("Banco vazio. Buscando notícias na GNews...");
      const response = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&max=20&sortby=publishedAt&token=${GNEWS_KEY}`);
      const data = await response.json();

      if (data.articles && data.articles.length > 0) {
        // 3. SALVA NO BANCO por 1 hora (3600 segundos)
        await kv.set('noticias_globais', data.articles, { ex: 3600 });
        return res.status(200).json(data.articles);
      }
    }

    // 4. Se já tinha no banco, entrega o mesmo para todos
    console.log("Entregando notícias vindas do banco de dados.");
    return res.status(200).json(cachedNews || []);
    
  } catch (error) {
    console.error("Erro no KV:", error);
    return res.status(500).json({ error: 'Erro ao acessar banco de dados central.' });
  }
}