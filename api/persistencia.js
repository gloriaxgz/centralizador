import { kv } from '@vercel/kv';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

const KEYS = {
  rows:    'newsboard_rows',
  legend:  'newsboard_legend',
  pending: 'newsboard_pending',
};

export default async function handler(req, res) {
  const { action } = req.query;

  try {
    // ─── PENDING (artigos vindos do Radar) ───────────────────────────────────
    if (action === 'pending') {

      // GET → retorna fila de pendentes
      if (req.method === 'GET') {
        const pending = await kv.get(KEYS.pending) || [];
        return res.status(200).json(pending);
      }

      // POST → adiciona artigos à fila (merge com existentes)
      if (req.method === 'POST') {
        const { articles = [] } = req.body;
        const existing = await kv.get(KEYS.pending) || [];
        // evita duplicatas por URL
        const merged = [
          ...existing,
          ...articles.filter(a => !existing.some(e => e.url === a.url && e.title === a.title)),
        ];
        await kv.set(KEYS.pending, merged);
        return res.status(200).json({ ok: true, count: merged.length });
      }

      // DELETE → limpa a fila após importar
      if (req.method === 'DELETE') {
        await kv.set(KEYS.pending, []);
        return res.status(200).json({ ok: true });
      }
    }

    // ─── ROWS + LEGEND (tabela principal) ────────────────────────────────────

    // GET → retorna estado completo da tabela
    if (req.method === 'GET') {
      const [rows, legend] = await Promise.all([
        kv.get(KEYS.rows),
        kv.get(KEYS.legend),
      ]);
      return res.status(200).json({
        rows:   rows   || [],
        legend: legend || {},
      });
    }

    // POST → salva estado completo da tabela
    if (req.method === 'POST') {
      const { rows, legend } = req.body;

      await Promise.all([
        rows   !== undefined ? kv.set(KEYS.rows,   rows)   : Promise.resolve(),
        legend !== undefined ? kv.set(KEYS.legend, legend) : Promise.resolve(),
      ]);

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });

  } catch (error) {
    console.error('Newsboard API error:', error);
    return res.status(500).json({ error: 'Erro no servidor do Newsboard.' });
  }
}