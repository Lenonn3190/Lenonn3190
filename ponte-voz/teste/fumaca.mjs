/* Teste de fumaça do Ponte.
 *
 * Roda o index.html num Chromium de verdade e confere o que quebra calado:
 * erro de console na carga, a trava de tela que para de ser pedida depois da
 * primeira vez, as regras do prompt que impedem o intérprete de inventar
 * frase, e vazamento horizontal nas larguras de celular.
 *
 * Não substitui a validação contra a API real (essa precisa de chave e sai
 * cara); cobre o que dá para afirmar sem rede.
 *
 *   node teste/fumaca.mjs
 *
 * Precisa do playwright. Se não estiver no projeto, o teste procura o
 * instalado globalmente antes de desistir:  npm i -D playwright
 */
import { createRequire } from 'module';
import http from 'http'; import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';

const exigir = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = exigir('playwright')); }
catch (e) {
  console.error('playwright não encontrado. Instale com:  npm i -D playwright');
  process.exit(2);
}

const RAIZ = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const TIPO = { '.html':'text/html', '.json':'application/json',
               '.js':'text/javascript', '.png':'image/png' };

const falhas = [];
const ok  = m => console.log('  ✓ ' + m);
const nok = m => { falhas.push(m); console.log('  ✗ ' + m); };

const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(RAIZ, p);
  if (!f.startsWith(path.resolve(RAIZ)) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TIPO[path.extname(f)] || 'application/octet-stream' });
  r.end(fs.readFileSync(f));
});
await new Promise(r => srv.listen(8890, r));

const nav = await chromium.launch({
  args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']
});
const ctx = await nav.newContext({ permissions:['microphone'], viewport:{ width:390, height:844 } });
const pg = await ctx.newPage();

const erros = [];
pg.on('pageerror', e => erros.push('pageerror: ' + e.message));
pg.on('console', m => { if (m.type() === 'error') erros.push('console: ' + m.text()); });

// A trava de tela é instrumentada ANTES da carga: é a única forma de contar
// quantas vezes o app realmente pediu.
await pg.addInitScript(() => {
  window.__pedidosTrava = 0;
  const ouvintes = [];
  Object.defineProperty(navigator, 'wakeLock', { configurable:true, value:{
    request: async () => {
      window.__pedidosTrava++;
      const s = { released:false,
                  addEventListener:(t,f) => { if(t==='release') ouvintes.push(f); },
                  release: async () => {} };
      window.__soltarTrava = () => { s.released = true; ouvintes.forEach(f => f()); };
      return s;
    } } });
});

console.log('\n=== 1. Carga ===');
await pg.goto('http://localhost:8890/', { waitUntil:'networkidle' });
await pg.waitForTimeout(600);
await pg.evaluate(() => { try { localStorage.setItem('ponte.key','AQ.chave-de-teste'); } catch(e){} });
erros.length ? nok('erros na carga: ' + erros.join(' | ')) : ok('sem erro de console na carga');
await pg.locator('#micPT').isVisible() ? ok('botão de português na tela') : nok('botão de português ausente');
await pg.locator('#micJA').isVisible() ? ok('botão de japonês na tela')   : nok('botão de japonês ausente');

console.log('\n=== 2. Trava de tela sobrevive à tela apagando ===');
let n = await pg.evaluate(() => window.__pedidosTrava);
n === 1 ? ok('trava pedida na abertura') : nok('pedidos na abertura: ' + n);
// o navegador solta a trava sozinho quando a tela apaga; o app precisa pedir de novo
await pg.evaluate(() => { window.__soltarTrava(); document.dispatchEvent(new Event('visibilitychange')); });
await pg.waitForTimeout(200);
n = await pg.evaluate(() => window.__pedidosTrava);
n === 2 ? ok('trava pedida de novo depois de solta — a tela continua acesa')
        : nok('a trava não foi repedida (pedidos: ' + n + '); a tela passa a apagar sozinha');

console.log('\n=== 3. O intérprete não pode inventar frase ===');
const pr = await pg.evaluate(() => {
  S.gloss = GLOSSARIO_FABRICA.slice();
  S.contexto = 'Auditoria de processo na linha de montagem de motores.';
  return prompt('auto', null);
});
pr.includes('só transcreva se você realmente distinguir PALAVRAS')
  ? ok('regra que proíbe transcrever áudio sem palavras')
  : nok('regra anti-invenção ausente do prompt');
pr.includes('NUNCA invente, adivinhe nem componha uma frase plausível')
  ? ok('regra que proíbe completar a lacuna com o contexto')
  : nok('regra anti-completação ausente do prompt');
pr.includes('タクトタイム') ? ok('glossário de fábrica chega ao prompt') : nok('glossário fora do prompt');
pr.indexOf('Auditoria') < pr.indexOf('GLOSSÁRIO')
  ? ok('contexto vem antes do glossário') : nok('ordem do prompt trocada');

console.log('\n=== 4. Mãos livres não estoura ao desligar ===');
await pg.evaluate(() => { S.maosLivres = true; });
const antes = erros.length;
await pg.evaluate(async () => { await iniciarEscuta(() => {}); });
await pg.waitForTimeout(700);
await pg.evaluate(() => pararEscuta());
await pg.waitForTimeout(700);
erros.length === antes
  ? ok('abrir e fechar a escuta não deixa erro no console')
  : nok('erro ao parar a escuta: ' + erros.slice(antes).join(' | '));

console.log('\n=== 5. Sem vazamento horizontal ===');
for (const [nome, w] of [['Android pequeno', 360], ['iPhone 14', 390], ['iPhone Pro Max', 430]]) {
  await pg.setViewportSize({ width:w, height:844 }); await pg.waitForTimeout(250);
  const larg = await pg.evaluate(() => document.documentElement.scrollWidth);
  larg <= w ? ok(nome + ' (' + w + 'px): sem vazamento')
            : nok(nome + ' (' + w + 'px): layout com ' + larg + 'px');
}

await nav.close(); srv.close();
console.log('\n' + '='.repeat(56));
console.log(falhas.length ? '❌ FALHAS (' + falhas.length + '):\n  - ' + falhas.join('\n  - ')
                          : '✅ TESTE DE FUMAÇA PASSOU');
console.log('='.repeat(56));
process.exit(falhas.length ? 1 : 0);
