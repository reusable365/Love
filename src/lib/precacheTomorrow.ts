"use client";

import { useEffect } from "react";
import type { Memory, Soundtrack } from "@/lib/supabase";

/**
 * Pre-caches tomorrow's photo and soundtrack in the background so that
 * when Caroline or Stéphane opens the app tomorrow morning, it loads instantly!
 */
export function usePrecacheTomorrow(memories: Memory[] = [], soundtracks: Soundtrack[] = []) {
    useEffect(() => {
        if (!memories.length) return;

        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toLocaleDateString("fr-CA");

            // 1. Find tomorrow's scheduled photo
            const tomorrowPhoto = memories.find((m) => {
                if (!m.created_at) return false;
                return new Date(m.created_at).toLocaleDateString("fr-CA") === tomorrowStr;
            });

            if (tomorrowPhoto?.image_url) {
                // Pre-load image into browser memory cache
                const img = new Image();
                img.src = tomorrowPhoto.image_url;

                // Also store in Cache Storage if available
                if ("caches" in window) {
                    caches.open("eternal-memories-cache-v1").then((cache) => {
                        cache.add(tomorrowPhoto.image_url).catch(() => {});
                    });
                }
            }

            // 2. Preload upcoming MP3 soundtracks if applicable
            soundtracks.forEach((track) => {
                if (track.type === "mp3" && track.src_url && "caches" in window) {
                    caches.open("eternal-memories-cache-v1").then((cache) => {
                        cache.add(track.src_url).catch(() => {});
                    });
                }
            });
        } catch {
            // Non-blocking pre-cache
        }
    }, [memories, soundtracks]);
}
