/* Ponte — service worker.
   Guarda a casca do app para que ele abra sem internet (as frases essenciais
   continuam funcionando offline; a tradução por voz, claro, precisa de rede). */

const CACHE = 'ponte-v1';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;

  // Só a casca é cacheada. Chamadas de API nunca passam pelo cache.
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin !== self.location.origin) return;

  // Rede primeiro, cache como rede de segurança: assim uma correção publicada
  // chega no celular sem precisar reinstalar o app.
  e.respondWith(
    fetch(req)
      .then(r => {
        if (r && r.ok) {
          const copia = r.clone();
          caches.open(CACHE).then(c => c.put(req, copia)).catch(() => {});
        }
        return r;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
