/* Basalto · copia dell'app sul telefono, per aprirla anche senza rete (v1.52).
   Riguarda solo i file del sito (stesso indirizzo del player): Dropbox, MusicBrainz e Wikipedia passano dalla rete
   come sempre, senza copie. La musica scaricata non passa da qui (sta nell'archivio dei brani scaricati).
   - La pagina si chiede sempre alla rete: con la rete gli aggiornamenti arrivano come prima. Se la rete non risponde
     entro 3,5 s (o non c'è) apro la copia salvata; la rete intanto finisce e la copia si aggiorna per la volta dopo.
   - Gli altri file del sito (moduli audio, icone, ritmi): dalla copia se c'è, intanto la rinnovo.
   - version.json e questo file vanno sempre in rete (servono a capire se c'è una versione nuova).
   Per spegnerla in futuro basta pubblicare un sw.js che chiama self.registration.unregister(). */
const C = 'basalto-app-v1';
const SCOPE = self.registration.scope;
const CORE = ['./', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
const PAGE_WAIT = 3500;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('basalto-app-') && k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || !r.url.startsWith(SCOPE)) return;
  const path = new URL(r.url).pathname;
  if (/\/(version\.json|sw\.js)$/.test(path)) return;
  const nav = r.mode === 'navigate', key = nav ? SCOPE : r;
  const net = fetch(r);
  // la copia si aggiorna con la risposta della rete (clonata subito, prima che la pagina la legga)
  e.waitUntil(net.then(res => { if (!res.ok || res.type !== 'basic') return; const cp = res.clone(); return caches.open(C).then(c => c.put(key, cp)); }).catch(() => {}));
  e.respondWith(nav ? page(net) : asset(r, net));
});
async function page(net) {
  let res = null;
  try { res = await Promise.race([net, new Promise(ok => setTimeout(ok, PAGE_WAIT, null))]); } catch (err) {}
  if (res && (res.ok || res.type === 'opaqueredirect')) return res;
  const c = await caches.open(C), hit = await c.match(SCOPE);
  return hit || res || net;
}
async function asset(r, net) {
  const c = await caches.open(C), hit = await c.match(r);
  if (hit) return hit;
  try { return await net; } catch (err) { const any = await c.match(r, { ignoreSearch: true }); if (any) return any; throw err; }
}
