const CACHE_NAME = "random-fit-v1";
const urlsToCache = [
	"/",
	"/index.html",
	"/manifest.json",
	"/icons/icon-192x192.svg",
	"/icons/icon-512x512.svg",
	"/offline.html",
];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(urlsToCache);
		}),
	);
});

self.addEventListener("fetch", (event) => {
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
