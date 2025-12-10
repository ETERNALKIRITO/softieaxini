// sw.js (Final Corrected Version)

const APP_CACHE_NAME = 'softieaxin-app-v13'; // Increment Version!
const AUDIO_CACHE_NAME = 'softieaxin-audio-v1';

const APP_SHELL_URLS = [
    '/',
    'index.html',
    'library.json', // Ensure this is here from the previous step
    'style.css',
    'css/themes.css',
    'css/base.css',
    'css/components.css',
    'css/library.css',
    'css/player.css',
    'css/sidebar.css', // Don't forget this one if you haven't added it!
    'js/main.js',
    'js/config.js',
    'js/dom.js',
    'js/state.js',
    'js/ui.js',
    'js/player.js',
    'js/persistence.js',
    // --- EXTERNAL ASSETS (Must be exact matches) ---
    'https://unpkg.com/vconsole/dist/vconsole.min.js', // <--- ADD THIS LINE
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

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CACHE_AUDIO_FILES') {
        const urlsToCache = event.data.urls;

        event.waitUntil((async () => {
            const cache = await caches.open(AUDIO_CACHE_NAME);
            const clients = await self.clients.matchAll();

            // Helper function to post messages to all clients
            const postProgress = (message) => {
                clients.forEach(client => client.postMessage(message));
            };

            for (const url of urlsToCache) {
                try {
                    const request = new Request(url, { mode: 'cors', credentials: 'omit' });
                    const cachedResponse = await cache.match(request);

                    if (cachedResponse) {
                        // Already cached, just notify the client
                        postProgress({ type: 'AUDIO_CACHING_PROGRESS', url, status: 'cached' });
                        continue;
                    }

                    // Not cached, so let's start the process
                    postProgress({ type: 'AUDIO_CACHING_PROGRESS', url, status: 'caching' });

                    const response = await fetch(request);
                    if (!response.ok) {
                        throw new Error(`Fetch failed: ${response.status}`);
                    }
                    await cache.put(request, response.clone());
                    
                    // Success!
                    postProgress({ type: 'AUDIO_CACHING_PROGRESS', url, status: 'cached' });

                } catch (error) {
                    console.error(`[SW] Failed to cache ${url}:`, error.message);
                    postProgress({ type: 'AUDIO_CACHING_PROGRESS', url, status: 'failed' });
                }
            }

            // Send a final completion message
            postProgress({ type: 'AUDIO_CACHING_COMPLETE' });

        })());
    }
});