export default async function handler(req, res) {
  const GNEWS_KEY = process.env.GNEWS_KEY; // Configure isso no Vercel

  // Pega a query do frontend ou usa a padrão
  const q = req.query.q || '"Artificial Intelligence" OR "Generative AI" OR "NVIDIA"';
  
  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&max=20&sortby=publishedAt&token=${GNEWS_KEY}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar notícias' });
  }
}