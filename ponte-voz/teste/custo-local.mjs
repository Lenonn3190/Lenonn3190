/* Quanto do tempo de um turno é processamento LOCAL?
 *
 * É a única parte que um app nativo (APK) poderia acelerar: a chamada à
 * API e a inferência do modelo são idênticas nos dois casos. Mede o
 * caminho inteiro que roda no aparelho, com o código do próprio app, sobre
 * uma fala de 4 s a 48 kHz (o que o microfone de celular entrega).
 */
import { createRequire } from 'module';
import http from 'http'; import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const exigir = createRequire(import.meta.url);
const { chromium } = exigir('playwright');

const RAIZ = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const TIPO = { '.html':'text/html', '.json':'application/json', '.js':'text/javascript', '.png':'image/png' };
const srv = http.createServer((q,r)=>{
  let p = decodeURIComponent(q.url.split('?')[0]); if(p==='/')p='/index.html';
  const f = path.join(RAIZ,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end()}
  r.writeHead(200,{'Content-Type':TIPO[path.extname(f)]||'application/octet-stream'}); r.end(fs.readFileSync(f));
});
await new Promise(r=>srv.listen(8891,r));
const nav = await chromium.launch();
const pg = await (await nav.newContext()).newPage();
await pg.goto('http://localhost:8891/', { waitUntil:'networkidle' });

const r = await pg.evaluate(() => {
  // 4 s de "fala" a 48 kHz, em blocos de 4096 como o ScriptProcessorNode
  // entrega, com 0,4 s de silêncio em cada ponta.
  const TAXA = 48000, SEG = 4, BLOCO = 4096;
  const total = TAXA * SEG, pedacos = [];
  for (let o = 0; o < total; o += BLOCO) {
    const n = Math.min(BLOCO, total - o);
    const copia = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = (o + i) / TAXA;
      copia[i] = (t < 0.4 || t > SEG - 0.4) ? Math.random() * 0.002
               : Math.sin(2*Math.PI*130*t) * 0.35 * (1 + 0.4*Math.sin(2*Math.PI*3*t));
    }
    pedacos.push({ copia, taxa: TAXA });
  }

  const medir = (f, voltas) => {
    f(); // aquece o JIT
    const t = performance.now();
    for (let i = 0; i < voltas; i++) f();
    return (performance.now() - t) / voltas;
  };

  const msTudo = medir(() => trechoParaWav(pedacos), 20);
  const saida  = trechoParaWav(pedacos);

  return { msTudo, kb: (saida.b64.length * 3 / 4 / 1024).toFixed(0),
           seg: saida.segundos.toFixed(2),
           ua: navigator.userAgent.includes('Headless') ? 'Chromium (desktop deste servidor)' : navigator.userAgent };
});

await nav.close(); srv.close();

// Um celular mediano é bem mais lento que o processador deste servidor. O
// fator é uma estimativa deliberadamente pessimista, para não vender o
// resultado como melhor do que é.
const FATOR = 8;
const local = r.msTudo * FATOR;
const TURNO = 2000;  // mediana medida contra a API real, com crédito ativo

console.log('Processamento local de uma fala de 4 s (cortar silêncio, reamostrar');
console.log('para 16 kHz, montar o WAV, codificar em base64):\n');
console.log('  neste servidor        ' + r.msTudo.toFixed(1) + ' ms');
console.log('  celular mediano       ~' + local.toFixed(0) + ' ms  (estimado, ' + FATOR + '× mais lento)');
console.log('  payload               ' + r.kb + ' KB  (' + r.seg + ' s depois de cortar o silêncio)');
console.log('');
console.log('  turno completo medido 2000 ms (mediana, contra a API real)');
console.log('  fatia local           ' + (local / TURNO * 100).toFixed(1) + '%');
console.log('');
console.log('Um APK roda o MESMO JavaScript na mesma engine, então nem essa fatia');
console.log('encolhe. Mesmo um app nativo reescrito do zero, que zerasse os ' + local.toFixed(0) + ' ms,');
console.log('levaria o turno de 2000 ms para ' + (TURNO - local).toFixed(0) + ' ms.');
