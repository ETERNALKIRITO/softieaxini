// sw.js (Final Corrected Version)

const APP_CACHE_NAME = 'softieaxin-app-v10'; // <-- IMPORTANT: Increment the version!
const AUDIO_CACHE_NAME = 'softieaxin-audio-v1';

// All the essential files needed for the application shell to work offline.
const APP_SHELL_URLS = [
    '/',
    'index.html',
    'style.css',
    'css/themes.css',
    'css/base.css',
    'css/components.css',
    'css/library.css',
    'css/player.css',
    'js/main.js',
    'js/config.js',
    'js/dom.js',
    'js/state.js',
    'js/ui.js',
    'js/player.js',
    'js/persistence.js',
    // External Assets
    'https://ik.imagekit.io/9llyyueko/STATIC%20IMAGES/blank.png?updatedAt=1745897165289',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-solid-900.woff2'
];

// --- INSTALL: Pre-cache the application shell ---
self.addEventListener('install', event => {
    console.log('[SW] Install event for version:', APP_CACHE_NAME);
    event.waitUntil(
        caches.open(APP_CACHE_NAME).then(async cache => {
            console.log('[SW] Caching app shell assets.');
            // We use individual requests to ensure credentials are omitted for all external assets
            const promises = APP_SHELL_URLS.map(url => {
                const request = new Request(url, { credentials: 'omit' });
                return fetch(request).then(response => {
                    if (response.ok) {
                        return cache.put(request, response);
                    }
                    console.error(`[SW] Failed to fetch and cache ${url}`, response.status);
                    return Promise.reject(response);
                });
            });
            await Promise.all(promises);
        }).then(() => self.skipWaiting())
    );
});


// --- ACTIVATE: Clean up old caches ---
self.addEventListener('activate', event => {
    console.log('[SW] Activate event for version:', APP_CACHE_NAME);
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== APP_CACHE_NAME && cacheName !== AUDIO_CACHE_NAME) {
                        console.log('[SW] Deleting old app cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});


// --- FETCH: Intercept network requests ---
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Strategy 1: Handle audio files with a cache-first, then network strategy
    if (url.origin === 'https://ik.imagekit.io' && /\.(mp3|ogg|wav|m4a)$/i.test(url.pathname)) {
        event.respondWith(
            caches.open(AUDIO_CACHE_NAME).then(async cache => {
                const cachedResponse = await cache.match(event.request.url);
                if (cachedResponse) return cachedResponse;

                // Fetch the entire file, omitting range headers
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
                    console.error(`[SW] Audio fetch failed:`, error);
                    return new Response('Audio not found.', { status: 404 });
                }
            })
        );
    }
    // Strategy 2: For everything else (App Shell, Favicon, Fonts), use a simple cache-first strategy
    else {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                // If it exists in the cache, return it. This is the offline magic.
                if (cachedResponse) {
                    return cachedResponse;
                }
                // Otherwise, go to the network.
                return fetch(event.request);
            })
        );
    }
});

// --- MESSAGE: Handle bulk audio caching requests from the main application ---
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CACHE_AUDIO_FILES') {
        console.log('[SW] Received message to cache audio files:', event.data.urls.length, "urls");
        const urlsToCache = event.data.urls;
        let successCount = 0;
        let failCount = 0;

        event.waitUntil((async () => {
            const cache = await caches.open(AUDIO_CACHE_NAME);

            // Process URLs sequentially to be kind to the network and avoid errors.
            for (const url of urlsToCache) {
                const request = new Request(url, { mode: 'cors', credentials: 'omit' });
                try {
                    // Check if already cached to save bandwidth.
                    const cachedResponse = await cache.match(request);
                    if (cachedResponse) {
                        successCount++;
                        continue; // Already exists, so skip to the next one.
                    }

                    const response = await fetch(request);
                    if (!response.ok) {
                        throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
                    }
                    await cache.put(request, response.clone());
                    successCount++;
                } catch (error) {
                    failCount++;
                    console.error(`[SW] Failed to cache ${url}:`, error.message);
                }
            }

            console.log(`[SW] Audio caching process complete. Success: ${successCount}, Failed: ${failCount}`);
            // Send a completion message back to all client pages.
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({
                        type: 'AUDIO_CACHING_COMPLETE',
                        successCount: successCount,
                        failCount: failCount
                    });
                });
            });
        })());
    }
});