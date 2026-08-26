/**
 * Ponte — proxy opcional para a API do Gemini (Cloudflare Workers, plano grátis).
 *
 * Para que serve: sem ele, cada celular precisa ter a chave da API colada nas
 * configurações. Com ele, a chave fica guardada só aqui no servidor e os
 * celulares apontam para esta URL — ninguém digita chave nenhuma.
 *
 * Publicar:
 *   npm i -g wrangler
 *   wrangler login
 *   wrangler secret put GEMINI_API_KEY      # cola a chave quando pedir
 *   wrangler deploy
 *
 * Depois é só colar a URL resultante no campo "Servidor intermediário" do app.
 */

const UPSTREAM = 'https://generativelanguage.googleapis.com/v1beta';

// Só estes caminhos são aceitos — o proxy não é um túnel aberto para o Google.
const PERMITIDOS = [
  /^\/models$/,
  /^\/models\/[A-Za-z0-9._-]+:generateContent$/
];

export default {
  async fetch(req, env) {
    const cors = montarCors(req, env);

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const u = new URL(req.url);
    if (!PERMITIDOS.some(p => p.test(u.pathname))) {
      return json({ error: 'caminho não permitido' }, 404, cors);
    }
    if (!env.GEMINI_API_KEY) {
      return json({ error: 'GEMINI_API_KEY não configurada — rode: wrangler secret put GEMINI_API_KEY' }, 500, cors);
    }

    // Trava simples de tamanho: um turno de fala de 30 s em WAV 16 kHz base64
    // fica perto de 1,3 MB. Acima de 8 MB é uso indevido.
    const tamanho = Number(req.headers.get('content-length') || 0);
    if (tamanho > 8 * 1024 * 1024) return json({ error: 'corpo grande demais' }, 413, cors);

    // Repassa os parâmetros da chamada, menos qualquer key vinda do cliente.
    const alvo = new URL(UPSTREAM + u.pathname);
    for (const [k, v] of u.searchParams) if (k !== 'key') alvo.searchParams.set(k, v);

    let r;
    try {
      r = await fetch(alvo.toString(), {
        method: req.method,
        headers: {
          'Content-Type': req.headers.get('content-type') || 'application/json',
          // Cabeçalho em vez de ?key=: é o que o Google recomenda, e as chaves
          // no formato novo (AQ.…) são recusadas por alguns endpoints quando
          // vão na query.
          'x-goog-api-key': env.GEMINI_API_KEY
        },
        body: req.method === 'GET' ? undefined : req.body
      });
    } catch (e) {
      return json({ error: 'upstream inacessível: ' + e.message }, 502, cors);
    }

    const h = new Headers(cors);
    h.set('Content-Type', r.headers.get('content-type') || 'application/json');
    return new Response(r.body, { status: r.status, headers: h });
  }
};

/**
 * Libera só as origens listadas em ALLOWED_ORIGINS (separadas por vírgula).
 * Sem essa variável, libera qualquer origem — cômodo para testar, mas então
 * qualquer pessoa com a URL gasta a sua cota. Configure antes de usar de verdade.
 */
function montarCors(req, env) {
  const origem = req.headers.get('Origin') || '';
  const lista = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const permitida = lista.length === 0 ? '*' : (lista.includes(origem) ? origem : lista[0]);
  return {
    'Access-Control-Allow-Origin': permitida,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function json(obj, status, cors) {
  const h = new Headers(cors);
  h.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(obj), { status, headers: h });
}
