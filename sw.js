const CACHE = "astro-v2";
const FONT_CACHE = CACHE + "-fonts";
const OFFLINE = "./offline.html";
const PRECACHE = [
  "./carrito.html",
  "./catalogo.html",
  "./checkout.html",
  "./contacto.html",
  "./index.html",
  "./marca.html",
  "./offline.html",
  "./producto.html",
  "./shop.html",
  "./manifest.webmanifest",
  "./css/styles.css",
  "./js/cart.js",
  "./js/i18n.js",
  "./js/main.js",
  "./js/products.js",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/maskable-512.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/favicon-32.png",
  "./assets/icons/favicon.svg",
  "./assets/img/abrigo-horizonte-1.jpg",
  "./assets/img/abrigo-horizonte-2.jpg",
  "./assets/img/americana-sombra-1.jpg",
  "./assets/img/americana-sombra-2.jpg",
  "./assets/img/atelier.jpg",
  "./assets/img/bolso-tierra-1.jpg",
  "./assets/img/bolso-tierra-2.jpg",
  "./assets/img/bufanda-niebla-1.jpg",
  "./assets/img/bufanda-niebla-2.jpg",
  "./assets/img/camisa-alba-1.jpg",
  "./assets/img/camisa-alba-2.jpg",
  "./assets/img/camisa-duna-1.jpg",
  "./assets/img/camisa-duna-2.jpg",
  "./assets/img/camisa-noche-1.jpg",
  "./assets/img/camisa-noche-2.jpg",
  "./assets/img/cardigan-umbral-1.jpg",
  "./assets/img/cardigan-umbral-2.jpg",
  "./assets/img/chaqueta-oliva-1.jpg",
  "./assets/img/chaqueta-oliva-2.jpg",
  "./assets/img/cinturon-orbita-1.jpg",
  "./assets/img/cinturon-orbita-2.jpg",
  "./assets/img/coleccion.jpg",
  "./assets/img/hero.jpg",
  "./assets/img/jersey-calma-1.jpg",
  "./assets/img/jersey-calma-2.jpg",
  "./assets/img/pantalon-cal-1.jpg",
  "./assets/img/pantalon-cal-2.jpg",
  "./assets/img/pantalon-eje-1.jpg",
  "./assets/img/pantalon-eje-2.jpg",
  "./assets/img/pantalon-trazo-1.jpg",
  "./assets/img/pantalon-trazo-2.jpg",
  "./assets/img/vestido-brisa-1.jpg",
  "./assets/img/vestido-brisa-2.jpg",
  "./assets/img/vestido-eclipse-1.jpg",
  "./assets/img/vestido-eclipse-2.jpg",
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache =>
    cache.addAll(PRECACHE.map(url => new Request(url, { cache: "reload" })))
  ));
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith("astro-") && key !== CACHE && key !== FONT_CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function navigate(request, url) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(CACHE);
    const page = url.pathname === new URL(self.registration.scope).pathname
      ? new URL("./index.html", self.registration.scope)
      : url;
    const saved = await cache.match(page, { ignoreSearch: true });
    if (saved) return saved;

    const offline = new URL(OFFLINE, self.registration.scope);
    const lang = url.searchParams.get("lang");
    if (lang === "en" || lang === "es") offline.searchParams.set("lang", lang);
    return Response.redirect(offline);
  }
}

function serveFont(event) {
  const cache = caches.open(FONT_CACHE);
  const update = fetch(event.request).then(async response => {
    if (response.ok || response.type === "opaque") {
      await (await cache).put(event.request, response.clone()).catch(() => {});
    }
    return response;
  });
  event.waitUntil(update.catch(() => {}));
  event.respondWith(cache.then(store => store.match(event.request)).then(saved => saved || update));
}

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    if (request.mode === "navigate") {
      event.respondWith(navigate(request, url));
    } else {
      event.respondWith(caches.open(CACHE).then(cache => cache.match(request))
        .then(saved => saved || fetch(request)));
    }
  } else if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    serveFont(event);
  }
});
