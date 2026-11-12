const fields = ['id', 'title', 'author', 'genre', 'price_rwf', 'quantity', 'preorder', 'cover'];

function csvCell(value) {
  return '"' + String(value ?? '').replaceAll('"', '""') + '"';
}

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, title, author, genre, price_rwf, quantity, preorder, cover FROM books ORDER BY rowid'
    ).all();
    const lines = results.map(book => fields.map(field => csvCell(book[field])).join(','));
    return new Response([fields.join(','), ...lines].join('\n'), {
      headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Cache-Control': 'no-store' }
    });
  } catch {
    return new Response('Inventory temporarily unavailable.', { status: 503 });
  }
}
