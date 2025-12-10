// sw.js (Final Corrected Version)

const APP_CACHE_NAME = 'softieaxin-app-v16'; // Incremented Version
const AUDIO_CACHE_NAME = 'softieaxin-audio-v16';

const APP_SHELL_URLS = [
    '/',
    'index.html',
    'library.json', 
    'style.css',
    'css/themes.css',
    'css/base.css',
    'css/components.css',
    'css/library.css',
    'css/player.css',
    'css/sidebar.css',
    'js/main.js',
    'js/config.js',
    'js/dom.js',
    'js/state.js',
    'js/ui.js',
    'js/player.js',
    'js/persistence.js',
    // --- EXTERNAL ASSETS ---
    // REMOVED vConsole
    'https://ik.imagekit.io/9llyyueko/STATIC%20IMAGES/blank.png?updatedAt=1745897165289',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-solid-900.woff2'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(APP_CACHE_NAME).then(async cache => {
            const promises = APP_SHELL_URLS.map(url => {
                const request = new Request(url, { credentials: 'omit' });
                return fetch(request).then(response => {
                    if (response.ok) return cache.put(request, response);
                    return Promise.reject(response);
                });
            });
            await Promise.all(promises);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== APP_CACHE_NAME && cacheName !== AUDIO_CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    if (url.origin === 'https://ik.imagekit.io' && /\.(mp3|ogg|wav|m4a)$/i.test(url.pathname)) {
        event.respondWith(
            caches.open(AUDIO_CACHE_NAME).then(async cache => {
                const cachedResponse = await cache.match(event.request.url);
                if (cachedResponse) return cachedResponse;

                const networkRequest = new Request(event.request.url, {
                    headers: event.request.headers,
                    mode: 'cors',
                    credentials: 'omit'
                });

                try {
                    const networkResponse = await fetch(networkRequest);
                    if (networkResponse.ok && networkResponse.status !== 206) {
                        await cache.put(event.request.url, networkResponse.clone());
                    }
                    return networkResponse;
                } catch (error) {
                    return new Response('Audio not found.', { status: 404 });
                }
            })
        );
    }
    else {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request);
            })
        );
    }
});

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CACHE_AUDIO_FILES') {
        const urlsToCache = event.data.urls;

        event.waitUntil((async () => {
            const cache = await caches.open(AUDIO_CACHE_NAME);
            const clients = await self.clients.matchAll();

            const postProgress = (message) => {
                clients.forEach(client => client.postMessage(message));
            };

            for (const url of urlsToCache) {
                try {
                    const request = new Request(url, { mode: 'cors', credentials: 'omit' });
                    const cachedResponse = await cache.match(request);
                    if (cachedResponse) {
                        postProgress({ type: 'AUDIO_CACHING_PROGRESS', url, status: 'cached' });
                        continue;
                    }
                    postProgress({ type: 'AUDIO_CACHING_PROGRESS', url, status: 'caching' });
                    const response = await fetch(request);
                    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
                    await cache.put(request, response.clone());
                    postProgress({ type: 'AUDIO_CACHING_PROGRESS', url, status: 'cached' });
                } catch (error) {
                    postProgress({ type: 'AUDIO_CACHING_PROGRESS', url, status: 'failed' });
                }
            }
            postProgress({ type: 'AUDIO_CACHING_COMPLETE' });
        })());
    }
});