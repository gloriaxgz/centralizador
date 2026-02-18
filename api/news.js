import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const GNEWS_KEY = process.env.GNEWS_KEY;
  const q = '"Artificial Intelligence" OR "Generative AI" OR "NVIDIA" -india -indian';
  const forceUpdate = req.query.force === 'true';

  try {
    // 1. Controle do Ciclo de 15 dias
    const agora = Date.now();
    const cicloMs = 15 * 24 * 60 * 60 * 1000; // 15 dias
    let dataInicioCiclo = await kv.get('ciclo_inicio_timestamp');

    // Se o ciclo venceu ou é a primeira vez, limpamos o histórico
    if (!dataInicioCiclo || (agora - dataInicioCiclo > cicloMs)) {
      console.log("Reiniciando ciclo de 15 dias...");
      await kv.set('noticias_globais', []); // Esvazia o banco
      await kv.set('ciclo_inicio_timestamp', agora); // Marca o novo início
      dataInicioCiclo = agora;
    }

    // 2. Busca o histórico atual (que pode estar vazio se acabou de resetar)
    let history = await kv.get('noticias_globais') || [];

    // 3. Busca novas notícias no GNews (se for force ou se o banco resetou agora)
    if (forceUpdate || history.length === 0) {
      const response = await fetch(`https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&max=20&sortby=publishedAt&token=${GNEWS_KEY}`);
      const data = await response.json();

      if (data.articles && data.articles.length > 0) {
        // Filtra duplicados (segurança extra)
        const novasNoticias = data.articles.filter(nova => 
          !history.some(antiga => antiga.url === nova.url)
        );

        // Junta com o que já existia no ciclo atual
        history = [...novasNoticias, ...history];

        // Salva o histórico acumulado
        await kv.set('noticias_globais', history);
      }
    }

    return res.status(200).json(history);
    
  } catch (error) {
    console.error("Erro:", error);
    return res.status(500).json({ error: 'Erro no sistema de 15 dias.' });
  }
}
