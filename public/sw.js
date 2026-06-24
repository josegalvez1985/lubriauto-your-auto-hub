// Service worker mínimo para habilitar la instalación de la PWA.
// Chrome solo dispara `beforeinstallprompt` si hay un SW con handler `fetch`.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
