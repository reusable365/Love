// Service Worker for Eternal Memories PWA & Push Notifications

self.addEventListener("install", (event) => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

// Handle incoming push notification
self.addEventListener("push", (event) => {
    let payload = {
        title: "Eternal Memories 💖",
        body: "Un nouveau mot doux t'attend...",
        icon: "/icon.svg",
        url: "/"
    };

    if (event.data) {
        try {
            payload = event.data.json();
        } catch {
            payload.body = event.data.text();
        }
    }

    const options = {
        body: payload.body,
        icon: payload.icon || "/icon.svg",
        badge: "/icon.svg",
        data: {
            url: payload.url || "/",
        },
        vibrate: [200, 100, 200],
    };

    event.waitUntil(
        self.registration.showNotification(payload.title || "Eternal Memories 💖", options)
    );
});

// Handle click on notification
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const urlToOpen = event.notification.data?.url || "/";

    event.waitUntil(
        self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && "focus" in client) {
                    return client.focus();
                }
            }
            if (self.clients.openWindow) {
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});
