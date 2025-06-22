// sw.js
const APP_CACHE_NAME = 'softieaxin-app-v2'; // Increment version if you change APP_SHELL_URLS
const AUDIO_CACHE_NAME = 'softieaxin-audio-v1';

const APP_SHELL_URLS = [
    '/',
    'index.html',
    'style.css',
    'script.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-solid-900.woff2'
];

self.addEventListener('install', event => {
    console.log('[SW] Install event');
    event.waitUntil(
        caches.open(APP_CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching app shell');
                const promises = APP_SHELL_URLS.map(url => {
                    return cache.add(url).catch(err => {
                        console.warn(`[SW] Failed to cache app shell resource ${url}: ${err}`);
                    });
                });
                return Promise.all(promises);
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    console.log('[SW] Activate event');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== APP_CACHE_NAME && cacheName !== AUDIO_CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Strategy for app shell and assets
    if (APP_SHELL_URLS.includes(url.pathname) || url.origin === location.origin || url.href.startsWith('https://cdnjs.cloudflare.com')) {
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                if (cachedResponse) return cachedResponse;
                return fetch(event.request).then(networkResponse => {
                    // Optionally cache new app resources dynamically
                    return caches.open(APP_CACHE_NAME).then(cache => {
                        if (networkResponse && networkResponse.ok) { // Check before caching
                           cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    });
                }).catch(error => {
                    console.error('[SW] Fetch failed for app shell resource (likely offline):', event.request.url, error);
                    // Optionally return a fallback page for app shell if critical resources fail
                    // For now, let the browser handle the error (which will show offline page if it's the main doc)
                    throw error; // Re-throw to ensure promise rejects
                });
            })
        );
    }
    // Strategy for audio files
    else if (url.origin === 'https://ik.imagekit.io' || /\.(mp3|ogg|wav|m4a)$/i.test(url.pathname)) {
        event.respondWith((async () => { // Wrap in an async IIFE for clean async/await
            try {
                const cache = await caches.open(AUDIO_CACHE_NAME);

                // Attempt 1: Match by the full Request object
                let cachedResponse = await cache.match(event.request);
                if (cachedResponse) {
                    console.log('[SW] Serving audio from AUDIO_CACHE (matched Request object):', event.request.url);
                    return cachedResponse;
                }

                // Attempt 2: If full Request match failed, try matching by URL string only
                // This can help if there are subtle differences in Request headers/properties causing match failure
                console.log(`[SW] Full Request match failed for ${event.request.url}. Trying match by URL string.`);
                cachedResponse = await cache.match(event.request.url); // Match by URL string
                if (cachedResponse) {
                    console.log('[SW] Serving audio from AUDIO_CACHE (matched URL string):', event.request.url);
                    return cachedResponse;
                }

                // If still not found in cache, then attempt network fetch
                console.log('[SW] Audio not in cache (both Request and URL string match failed), attempting network fetch for:', event.request.url);
                try {
                    const networkResponse = await fetch(event.request);
                    // If fetch is successful, clone and cache it (e.g., if "Cache All" was missed or for new files)
                    if (networkResponse && networkResponse.ok) {
                        console.log('[SW] Fetched audio from network, caching it now:', event.request.url);
                        await cache.put(event.request.clone(), networkResponse.clone()); // Use event.request.clone() for the key too
                    } else if (networkResponse) {
                        // Log if network gave a response, but it's not "ok" (e.g., 404, 503)
                        console.warn(`[SW] Network fetch for audio ${event.request.url} was not ok: ${networkResponse.status}`);
                    }
                    return networkResponse; // Return whatever network gave, browser will handle non-ok responses
                } catch (networkError) {
                    // This catch is for when fetch itself fails (e.g., offline, DNS error)
                    console.error(`[SW] Network fetch for audio ${event.request.url} failed (likely offline): ${networkError.message}`);
                    // IMPORTANT: Return a proper error Response
                    return new Response(
                        `Audio file not found. Failed to fetch ${event.request.url} from network (offline or server error) and not found in cache.`,
                        {
                            status: 404, // Or 503 Service Unavailable
                            statusText: "Not Found or Network Error",
                            headers: { 'Content-Type': 'text/plain' }
                        }
                    );
                }
            } catch (cacheOpenError) {
                console.error('[SW] Error opening cache:', cacheOpenError.message);
                return new Response('Service Worker cache error.', {
                    status: 500,
                    statusText: "Cache Error",
                    headers: { 'Content-Type': 'text/plain' }
                });
            }
        })());
    }
    // For any other requests, don't interfere (let them go to network or browser cache)
    // else {
    //    console.log('[SW] Request not handled by SW specific rules:', event.request.url);
    // }
});


self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CACHE_AUDIO_FILES') {
        console.log('[SW] Received message to cache audio files:', event.data.urls.length, "urls");
        const urlsToCache = event.data.urls;
        let successCount = 0;
        let failCount = 0;

        event.waitUntil(
            caches.open(AUDIO_CACHE_NAME).then(async cache => { // use async here for await inside map
                const cachePromises = urlsToCache.map(async url => { // make inner function async
                    const request = new Request(url); // ImageKit URLs are absolute, no need to resolve against origin
                    try {
                        // Check if already in cache to avoid re-fetching if not necessary
                        // const existingResponse = await cache.match(request);
                        // if (existingResponse) {
                        //     console.log(`[SW] Audio already cached: ${url}`);
                        //     successCount++;
                        //     return;
                        // }

                        const response = await fetch(request);
                        if (!response.ok) {
                            throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
                        }
                        await cache.put(request, response.clone()); // response.clone() because response body can be read once
                        successCount++;
                        // console.log(`[SW] Successfully cached: ${url}`);
                    } catch (error) {
                        failCount++;
                        console.error(`[SW] Failed to cache ${url}:`, error.message);
                    }
                });
                await Promise.allSettled(cachePromises); // Wait for all caching attempts
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