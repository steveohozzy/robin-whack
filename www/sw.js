const CACHE_NAME = "robin-whack-v4";

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
    "./assets/icon-1024.png",

    "./assets/sounds/hit.mp3",
    "./assets/sounds/fast.mp3",
    "./assets/sounds/golden.mp3",
    "./assets/sounds/combo.mp3",
    "./assets/sounds/start.mp3",
    "./assets/sounds/gameover.mp3",
    "./assets/sounds/countdown.mp3",
    "./assets/sounds/bonus.mp3"
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