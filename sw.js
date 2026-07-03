/* =========================================================
   FACU FITNESS — Service Worker
   Estrategia network-first para el "shell" de la app (HTML/JS/CSS):
   siempre intenta traer la última versión de la red y cae al cache
   solo si no hay conexión. Así cada cambio publicado impacta apenas
   entrás, sin tener que reinstalar ni abrir Safari.
   ========================================================= */
const CACHE_NAME = "facufitness-v7";

// El shell de la app + logo/íconos. Las fotos de ejercicios (images/exercises/*)
// NO van acá para no hacer pesada la instalación: se cachean solas la primera
// vez que se ven (estrategia network-first de abajo) y quedan disponibles offline.
const CORE_FILES = [
  "./",
  "index.html",
  "style.css",
  "art.js",
  "app.js",
  "exercises.js",
  "exercise-media.js",
  "manifest.json",
  "icons/splash-logo.png",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_FILES))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// La página nos avisa cuando hay una versión nueva lista para tomar el control
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  // Solo manejamos requests de nuestro propio origen
  if (url.origin !== self.location.origin) return;

  // Network-first: siempre priorizamos la red y actualizamos el cache.
  // Si no hay red, servimos lo último que quedó cacheado.
  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return networkResponse;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || caches.match("index.html"))
      )
  );
});
