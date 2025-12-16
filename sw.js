// sw.js (Final Corrected Version - Refined fetch for APP_SHELL_URLS & all other assets)

import { APP_CACHE_NAME, AUDIO_CACHE_NAME } from './js/config.js'; // Import cache names from config

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
    'https://ik.imagekit.io/9llyyueko/STATIC%20IMAGES/blank.png?updatedAt=1745897165289', // This is the favicon
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

    // Helper to check if a request URL matches any APP_SHELL_URL's base path
    const isBaseAppShellUrl = () => {
        for (const shellUrl of APP_SHELL_URLS) {
            // Resolve relative APP_SHELL_URLS against the service worker's scope
            const absoluteShellUrl = new URL(shellUrl, self.location.href);
            if (url.origin === absoluteShellUrl.origin && url.pathname === absoluteShellUrl.pathname) {
                return true;
            }
        }
        return false;
    };

    // 1. Handle Audio files from ImageKit (cache-first, then network)
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
                    // If network fails, and it wasn't in cache, respond with a generic 404
                    return new Response('Audio not found or network offline.', { status: 404 });
                }
            })
        );
    } 
    // 2. Handle APP_SHELL_URLS and other critical assets (cache-first, then network)
    else {
        event.respondWith(
            caches.open(APP_CACHE_NAME).then(async cache => {
                // Try to match the exact request first
                let cachedResponse = await cache.match(event.request);
                
                // If not found, and it's a known app shell asset, try matching ignoring query parameters.
                // This is crucial for favicons and other assets where query params might vary.
                if (!cachedResponse && isBaseAppShellUrl()) {
                    cachedResponse = await cache.match(event.request, { ignoreSearch: true });
                }

                if (cachedResponse) return cachedResponse;
                
                // If not in cache, try network
                return fetch(event.request).catch(error => {
                    // If network fails (e.g., offline) AND it wasn't in cache (even with ignoreSearch),
                    // it means the resource is genuinely unavailable offline.
                    // Log the error but let the browser handle the failed load,
                    // as we've done our best to serve it from cache.
                    console.error(`Service Worker: Failed to fetch "${event.request.url}" (offline or not in cache).`, error);
                    // For critical app shell assets, if this point is reached, it means it
                    // failed to cache during install OR failed to match later.
                    // The error message is then a truthful representation.
                    throw error; 
                });
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