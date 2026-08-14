const CACHE_NAME = "robin-whack-v3";

const ASSETS = [
    "./",
    "./index.html",
    "./style.css",
    "./game.js",
    "./manifest.json",

    "./assets/robbin.png",
    "./assets/ground.png",

    "./assets/icon-192.png",
    "./assets/icon-512.png",
    "./assets/icon-1024.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    const request = event.request;

    event.respondWith(
        caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(request).catch(() => {
                return new Response("", {
                    status: 503,
                    statusText: "Offline"
                });
            });
        })
    );
});