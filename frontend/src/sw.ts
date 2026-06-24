/// <reference lib="WebWorker" />

import { clientsClaim, skipWaiting } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope;

skipWaiting();
clientsClaim();

// Precache all assets injected by vite-plugin-pwa
precacheAndRoute(self.__WB_MANIFEST);

// Clean up old caches from previous service worker versions
cleanupOutdatedCaches();

// ── Push event handler ────────────────────────────────────────────────────────

self.addEventListener('push', (event: PushEvent) => {
    if (!event.data) return;

    let payload: { type?: string; message?: string } = {};
    try {
        payload = event.data.json();
    } catch {
        payload = { message: event.data.text() };
    }

    const title = 'Réseau ABC';
    const options: NotificationOptions = {
        body: payload.message || 'Nouvelle notification',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: payload.type || 'default',
        data: { type: payload.type, url: self.registration.scope },
    };
    // vibrate is supported but not in the TS lib — attach after construction
    (options as any).vibrate = [200, 100, 200];

    event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click handler ────────────────────────────────────────────────

self.addEventListener('notificationclick', (event: NotificationEvent) => {
    event.notification.close();

    const urlToOpen = new URL(self.registration.scope).origin + '/notifications';

    event.waitUntil(
        self.clients
            .matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url.includes(urlToOpen) && 'focus' in client) {
                        return client.focus();
                    }
                }
                if (self.clients.openWindow) {
                    return self.clients.openWindow(urlToOpen);
                }
            }),
    );
});
