"use client";

import { useState, useEffect, useCallback } from "react";

export type CoupleUser = "stephane" | "caroline";

export const PARTNER_NAMES: Record<CoupleUser, string> = {
    stephane: "Stéphane",
    caroline: "Caroline",
};

export const PARTNER_EMOJIS: Record<CoupleUser, string> = {
    stephane: "👑",
    caroline: "🌸",
};

export function useCoupleUser() {
    const [user, setUser] = useState<CoupleUser | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        try {
            const stored = localStorage.getItem("love_active_user") as CoupleUser | null;
            if (stored === "stephane" || stored === "caroline") {
                setUser(stored);
            }
        } catch {
            // localStorage not available
        } finally {
            setIsLoaded(true);
        }
    }, []);

    const selectUser = useCallback((newUser: CoupleUser) => {
        setUser(newUser);
        try {
            localStorage.setItem("love_active_user", newUser);
        } catch {
            // ignore
        }
    }, []);

    const otherUser: CoupleUser | null = user === "stephane" ? "caroline" : user === "caroline" ? "stephane" : null;

    return {
        user,
        userName: user ? PARTNER_NAMES[user] : null,
        userEmoji: user ? PARTNER_EMOJIS[user] : null,
        otherUser,
        otherUserName: otherUser ? PARTNER_NAMES[otherUser] : null,
        otherUserEmoji: otherUser ? PARTNER_EMOJIS[otherUser] : null,
        selectUser,
        isLoaded,
    };
}
