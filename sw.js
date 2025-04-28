const CACHE_NAME = "random-fit-v2";
const urlsToCache = [
	"/",
	"/index.html",
	"/manifest.json",
	"/icons/icon-192x192.svg",
	"/icons/icon-512x512.svg",
	"/offline.html",
	"/workouts.json",
];

self.addEventListener("install", (event) => {
	self.skipWaiting();
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(urlsToCache);
		}),
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (cacheName !== CACHE_NAME) {
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
});

self.addEventListener("fetch", (event) => {
	// Network-first for specific files
	const networkFirstURLs = [
		"/workouts.json",
		"/index.html"
	];
	
	// Check if the request matches any network-first URL
	if (networkFirstURLs.some(url => event.request.url.includes(url))) {
		event.respondWith(
			fetch(event.request)
				.then((response) => {
					// Clone and cache the fresh response
					const responseToCache = response.clone();
					caches.open(CACHE_NAME).then((cache) => {
						cache.put(event.request, responseToCache);
					});
					return response;
				})
				.catch(() => {
					// If network fails, try the cache
					return caches.match(event.request);
				})
		);
		return;
	}

	// For everything else, use cache-first strategy
	event.respondWith(
		caches.match(event.request).then((response) => {
			// Cache hit - return response
			if (response) {
				return response;
			}

			return fetch(event.request)
				.then((response) => {
					// Check if we received a valid response
					if (
						!response ||
						response.status !== 200 ||
						response.type !== "basic"
					) {
						return response;
					}

					// Clone the response
					const responseToCache = response.clone();

					caches.open(CACHE_NAME).then((cache) => {
						cache.put(event.request, responseToCache);
					});

					return response;
				})
				.catch(() => {
					// If the request is for a webpage, show the offline page
					if (event.request.mode === "navigate") {
						return caches.match("/offline.html");
					}
				});
		}),
	);
});
