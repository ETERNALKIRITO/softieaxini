// sw.js (Corrected)

const APP_CACHE_NAME = 'softieaxin-app-v3'; // Increment version to trigger update
const AUDIO_CACHE_NAME = 'softieaxin-audio-v1';

// --- UPDATED: New file structure ---
const APP_SHELL_URLS = [
    '/',
    'index.html',
    'style.css', // The main CSS file

    // CSS Modules
    'css/base.css',
    'css/components.css',
    'css/library.css',
    'css/player.css',
    'css/themes.css',

    // JS Modules
    'js/main.js',
    'js/config.js',
    'js/dom.js',
    'js/state.js',
    'js/ui.js',
    'js/player.js',
    'js/persistence.js',

    // External assets
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-solid-900.woff2'
];

self.addEventListener('install', event => {
    console.log('[SW] Install event for version:', APP_CACHE_NAME);
    event.waitUntil(
        caches.open(APP_CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching app shell');
                const promises = APP_SHELL_URLS.map(url => {
                    return cache.add(url).catch(err => {
                        console.warn(`[SW] Failed to cache app shell resource ${url}:`, err);
                    });
                });
                return Promise.all(promises);
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    console.log('[SW] Activate event for version:', APP_CACHE_NAME);
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Delete old app caches, but keep the audio cache
                    if (cacheName !== APP_CACHE_NAME && cacheName !== AUDIO_CACHE_NAME) {
                        console.log('[SW] Deleting old app cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// The 'fetch' and 'message' event listeners below this line remain the same.
// You do not need to change them.

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Strategy for app shell and assets
    if (APP_SHELL_URLS.includes(url.pathname) || url.origin === location.origin || url.href.startsWith('https://cdnjs.cloudflare.com')) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request).then(networkResponse => {
                    return caches.open(APP_CACHE_NAME).then(cache => {
                        if (networkResponse && networkResponse.ok) {
                           cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    });
                }).catch(error => {
                    console.error('[SW] Fetch failed for app shell resource:', event.request.url, error);
                    throw error;
                });
            })
        );
    }
    // Strategy for audio files
    else if (url.origin === 'https://ik.imagekit.io' || /\.(mp3|ogg|wav|m4a)$/i.test(url.pathname)) {
        event.respondWith((async () => {
            try {
                const cache = await caches.open(AUDIO_CACHE_NAME);
                const cachedResponse = await cache.match(event.request.url);
                if (cachedResponse) {
                    return cachedResponse;
                }
                const networkResponse = await fetch(event.request);
                if (networkResponse && networkResponse.ok) {
                    await cache.put(event.request.url, networkResponse.clone());
                }
                return networkResponse;
            } catch (error) {
                console.error(`[SW] Network fetch for audio ${event.request.url} failed: ${error.message}`);
                return new Response(`Audio file not found or network error.`, { status: 404, statusText: "Not Found" });
            }
        })());
    }
});


self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CACHE_AUDIO_FILES') {
        console.log('[SW] Received message to cache audio files:', event.data.urls.length, "urls");
        const urlsToCache = event.data.urls;
        let successCount = 0;
        let failCount = 0;

        event.waitUntil(
            caches.open(AUDIO_CACHE_NAME).then(async cache => {
                const cachePromises = urlsToCache.map(async url => {
                    const request = new Request(url);
                    try {
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
                });
                await Promise.allSettled(cachePromises);
            }).then(() => {
                console.log(`[SW] Audio caching process complete. Success: ${successCount}, Failed: ${failCount}`);
                self.clients.matchAll().then(clients => {
                    clients.forEach(client => {
                        client.postMessage({
                            type: 'AUDIO_CACHING_COMPLETE',
                            successCount: successCount,
                            failCount: failCount
                        });
                    });
                });
            }).catch(err => {
                console.error("[SW] Error during bulk audio caching:", err);
            })
        );
    }
});