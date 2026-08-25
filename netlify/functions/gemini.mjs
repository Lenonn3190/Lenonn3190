/**
 * Ponte — proxy opcional para a API do Gemini, rodando como Netlify Function.
 *
 * Para que serve: sem ele, cada celular precisa ter a chave da API colada nas
 * configurações. Com ele, a chave fica só nas variáveis de ambiente do site e
 * os celulares não guardam chave nenhuma.
 *
 * Configurar:
 *   1. No painel do Netlify: Site configuration → Environment variables
 *   2. Criar GEMINI_API_KEY com a chave do Google AI Studio
 *   3. Publicar o site
 *   4. No app, em ⚙ → "Servidor intermediário", colar:
 *        https://<seu-site>.netlify.app/api
 *      e deixar o campo da chave vazio.
 *
 * Como fica na mesma origem do site, não há CORS envolvido no uso normal.
 *
 * ATENÇÃO ao tempo limite: uma Netlify Function síncrona é cortada em 10 s por
 * padrão. Uma fala curta responde em 1-3 s, mas uma fala longa pode estourar
 * esse limite. Se isso acontecer com frequência, use o worker do Cloudflare em
 * ponte-voz/worker/ (que não tem esse teto) ou deixe a chave em cada aparelho.
 */

const UPSTREAM = 'https://generativelanguage.googleapis.com/v1beta';

// Só estes caminhos passam — o proxy não é um túnel aberto para o Google.
const PERMITIDOS = [
  /^\/models$/,
  /^\/models\/[A-Za-z0-9._-]+:generateContent$/
];

export default async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors() });
  }

  const chave = process.env.GEMINI_API_KEY;
  if (!chave) {
    return json({ error: 'GEMINI_API_KEY não configurada nas variáveis de ambiente do site' }, 500);
  }

  const u = new URL(req.url);
  const caminho = u.pathname.replace(/^\/api/, '') || '/';
  if (!PERMITIDOS.some(p => p.test(caminho))) {
    return json({ error: 'caminho não permitido: ' + caminho }, 404);
  }

  // Um turno de 30 s em WAV 16 kHz vira ~1,3 MB em base64. Acima de 8 MB
  // não é uso legítimo do app.
  const tamanho = Number(req.headers.get('content-length') || 0);
  if (tamanho > 8 * 1024 * 1024) return json({ error: 'corpo grande demais' }, 413);

  // Repassa os parâmetros da chamada, mas a chave é sempre a do servidor.
  const alvo = new URL(UPSTREAM + caminho);
  for (const [k, v] of u.searchParams) if (k !== 'key') alvo.searchParams.set(k, v);
  alvo.searchParams.set('key', chave);

  let r;
  try {
    r = await fetch(alvo.toString(), {
      method: req.method,
      headers: { 'Content-Type': req.headers.get('content-type') || 'application/json' },
      body: req.method === 'GET' ? undefined : await req.arrayBuffer()
    });
  } catch (e) {
    return json({ error: 'upstream inacessível: ' + e.message }, 502);
  }

  const h = cors();
  h['Content-Type'] = r.headers.get('content-type') || 'application/json';
  return new Response(await r.arrayBuffer(), { status: r.status, headers: h });
};

// O app roda na mesma origem, então CORS não entra em jogo no uso normal.
// Fica liberado para o caso de você hospedar a página em outro endereço.
function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

function json(obj, status) {
  const h = cors();
  h['Content-Type'] = 'application/json';
  return new Response(JSON.stringify(obj), { status, headers: h });
}

export const config = { path: '/api/*' };
