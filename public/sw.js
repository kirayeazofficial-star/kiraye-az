// Minimal service worker: only makes the site installable. It caches nothing and lets every
// request go to the network as usual.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
