// Remate Volley instalado (PC o móvil): al abrirlo se carga siempre la última versión publicada;
// sin conexión se usa la última que se guardó. Solo guarda el juego, sus letras y la librería de red.
const CACHE = 'rv-59';
const CORE = ['./', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('rv-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const timeout = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('lento')), ms))]);
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (r.mode === 'navigate') { // la página del juego: primero la red (versión nueva), si no hay red, la guardada
    e.respondWith(timeout(fetch(r), 6000).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put('./', cp)); } return res; })
      .catch(() => caches.match('./').then(m => m || caches.match(r))));
    return;
  }
  if (u.origin === location.origin || /(^|\.)fonts\.(googleapis|gstatic)\.com$|^unpkg\.com$/.test(u.hostname)) { // lo demás: la copia guardada y se refresca por detrás
    e.respondWith(caches.match(r).then(m => {
      const net = fetch(r).then(res => { if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; }).catch(() => m);
      return m || net;
    }));
  }
});
