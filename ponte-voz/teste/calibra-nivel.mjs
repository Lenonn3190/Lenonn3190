/* Calibração da barra de nível do microfone.
 *
 * A barra só serve se as faixas quiserem dizer alguma coisa. Alimenta o
 * Chromium com áudio em níveis conhecidos de RMS e confere onde cada um cai:
 *
 *   ~0,003  sala em silêncio          -> tem de ler "nada chegando"
 *   ~0,01   fala longe / mic errado   -> "fraco"
 *   ~0,08   fala normal, mic perto    -> "bom"      (o caso que importa)
 *   ~0,25   fala muito alta           -> "muito alto"
 */
import { createRequire } from 'module';
import http from 'http'; import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
const exigir = createRequire(import.meta.url);
const { chromium } = exigir('playwright');

const RAIZ = path.dirname(fileURLToPath(import.meta.url)) + '/..';
const AUDIO = process.argv[2];
if (!AUDIO) { console.error('uso: node teste/calibra-nivel.mjs <pasta-com-os-wav>'); process.exit(2); }

const TIPO = { '.html':'text/html', '.json':'application/json', '.js':'text/javascript', '.png':'image/png' };
const srv = http.createServer((q,r)=>{
  let p = decodeURIComponent(q.url.split('?')[0]); if(p==='/')p='/index.html';
  const f = path.join(RAIZ,p); if(!fs.existsSync(f)){r.writeHead(404);return r.end()}
  r.writeHead(200,{'Content-Type':TIPO[path.extname(f)]||'application/octet-stream'}); r.end(fs.readFileSync(f));
});
await new Promise(r=>srv.listen(8892,r));

const casos = [
  ['rms003.wav', 'sala em silêncio',        'Nada chegando'],
  ['rms01.wav',  'fala longe / mic errado', 'Fraco'],
  ['rms08.wav',  'fala normal, mic perto',  'Bom'],
  ['rms25.wav',  'fala muito alta',         'Muito alto']
];

let ruim = 0;
for (const [arq, desc, esperado] of casos) {
  const nav = await chromium.launch({ args:[
    '--use-fake-device-for-media-stream',
    '--use-fake-ui-for-media-stream',
    '--use-file-for-fake-audio-capture=' + path.join(AUDIO, arq)
  ]});
  const pg = await (await nav.newContext({ permissions:['microphone'] })).newPage();
  await pg.goto('http://localhost:8892/', { waitUntil:'networkidle' });
  await pg.click('#bCfg'); await pg.waitForTimeout(300);
  await pg.click('#bNivel'); await pg.waitForTimeout(2500);
  const { pico, txt } = await pg.evaluate(() => ({
    pico: medidor ? medidor.pico : -1,
    txt: (document.querySelector('#nivelEstado').textContent || '').trim()
  }));
  const bate = txt.startsWith(esperado);
  if (!bate) ruim++;
  console.log((bate ? '  ✓ ' : '  ✗ ') + desc.padEnd(26) +
              'pico ' + pico.toFixed(0).padStart(3) + '%   ' + txt.split('—')[0].trim());
  if (!bate) console.log('      esperado: ' + esperado);
  await nav.close();
}
srv.close();
console.log(ruim ? '\n❌ ' + ruim + ' faixa(s) fora de calibração' : '\n✅ faixas calibradas');
process.exit(ruim ? 1 : 0);
