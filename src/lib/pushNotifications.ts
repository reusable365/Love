"use client";

import { getSupabase } from "@/lib/supabase";
import { CoupleUser } from "@/lib/useCoupleUser";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BD4_W9g3CC3XlqzxLdp-f46NyIM60vSulspifctMlzzx74UzqUon9cjmG6TpIiht2q4_08v40sTBDQHxWdyW0iU";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const buffer = new ArrayBuffer(rawData.length);
    const outputArray = new Uint8Array(buffer);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
        return null;
    }
    try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        return registration;
    } catch (err) {
        console.warn("Service Worker registration failed:", err);
        return null;
    }
}

export async function getNotificationPermissionStatus(): Promise<NotificationPermission | "unsupported"> {
    if (typeof window === "undefined" || !("Notification" in window)) {
        return "unsupported";
    }
    return Notification.permission;
}

export async function subscribePartnerToPush(partner: CoupleUser): Promise<boolean> {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.warn("Push notifications are not supported on this browser.");
        return false;
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
            return false;
        }

        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any,
            });
        }

        // Save subscription in Supabase Storage (vault/subscriptions/{partner}.json)
        const subscriptionJSON = JSON.stringify(subscription);
        const blob = new Blob([subscriptionJSON], { type: "application/json" });
        const filePath = `subscriptions/${partner}.json`;

        const sb = getSupabase();
        const { error } = await sb.storage
            .from("vault")
            .upload(filePath, blob, { upsert: true });

        if (error) {
            console.error("Failed to store push subscription in Supabase:", error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Failed to subscribe to push notifications:", err);
        return false;
    }
}
