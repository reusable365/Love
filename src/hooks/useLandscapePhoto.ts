"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type PhotoMode = "gyroscope" | "kenburns" | "none";

interface LandscapePhotoState {
    /** True if the image is landscape (width > height) */
    isLandscape: boolean;
    /** Which pan mode to use */
    mode: PhotoMode;
    /** Gyroscope offset for panning (0 = center, -1 = left, 1 = right) */
    gyroOffset: { x: number; y: number };
    /** True while detecting image dimensions */
    detecting: boolean;
}

/**
 * Hook that detects if a photo is landscape and provides
 * the best pan mode: gyroscope on mobile, Ken Burns on desktop.
 *
 * On mobile with gyroscope: streams tilt data for natural panning.
 * On desktop or fallback: returns 'kenburns' for CSS animation.
 * On portrait photos: returns mode 'none'.
 */
export function useLandscapePhoto(src: string | undefined): LandscapePhotoState {
    const [isLandscape, setIsLandscape] = useState(false);
    const [detecting, setDetecting] = useState(true);
    const [hasGyroscope, setHasGyroscope] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [gyroOffset, setGyroOffset] = useState({ x: 0, y: 0 });
    const gyroCleanupRef = useRef<(() => void) | null>(null);

    // ---------- Detect image orientation ----------
    useEffect(() => {
        if (!src) {
            setIsLandscape(false);
            setDetecting(false);
            return;
        }

        setDetecting(true);
        const img = new Image();
        img.onload = () => {
            // Consider landscape if width is at least 20% wider than height
            const ratio = img.naturalWidth / img.naturalHeight;
            setIsLandscape(ratio > 1.2);
            setDetecting(false);
        };
        img.onerror = () => {
            setIsLandscape(false);
            setDetecting(false);
        };
        img.src = src;
    }, [src]);

    // ---------- Detect mobile device ----------
    useEffect(() => {
        if (typeof window === "undefined") return;
        const touchDevice =
            "ontouchstart" in window || navigator.maxTouchPoints > 0;
        const hoverNone = window.matchMedia("(hover: none)").matches;
        setIsMobile(touchDevice && hoverNone);
    }, []);

    // ---------- Detect & setup gyroscope ----------
    useEffect(() => {
        if (typeof window === "undefined" || !isMobile || !isLandscape) {
            setHasGyroscope(false);
            return;
        }

        const setupGyroscope = async () => {
            // iOS 13+ requires permission request
            const DeviceOrientationEventTyped = DeviceOrientationEvent as unknown as {
                requestPermission?: () => Promise<string>;
            };
            if (typeof DeviceOrientationEventTyped.requestPermission === "function") {
                try {
                    const permission =
                        await DeviceOrientationEventTyped.requestPermission();
                    if (permission !== "granted") {
                        setHasGyroscope(false);
                        return;
                    }
                } catch {
                    setHasGyroscope(false);
                    return;
                }
            }

            // Test if events actually fire
            let received = false;
            const testHandler = () => {
                received = true;
            };
            window.addEventListener("deviceorientation", testHandler);

            // Wait a bit to see if we get events
            setTimeout(() => {
                window.removeEventListener("deviceorientation", testHandler);
                if (received) {
                    setHasGyroscope(true);
                    startGyroListening();
                } else {
                    setHasGyroscope(false);
                }
            }, 500);
        };

        const startGyroListening = () => {
            // Track initial orientation for relative offset
            let initialGamma: number | null = null;
            let initialBeta: number | null = null;

            const handler = (event: DeviceOrientationEvent) => {
                const gamma = event.gamma ?? 0; // left/right tilt [-90, 90]
                const beta = event.beta ?? 0; // front/back tilt [-180, 180]

                if (initialGamma === null) initialGamma = gamma;
                if (initialBeta === null) initialBeta = beta;

                // Normalize to [-1, 1] range, clamped
                // gamma range is ~[-45, 45] for comfortable tilt
                const deltaGamma = gamma - initialGamma;
                const deltaBeta = beta - initialBeta;

                const x = Math.max(-1, Math.min(1, deltaGamma / 12));
                const y = Math.max(-1, Math.min(1, deltaBeta / 20));

                setGyroOffset({ x, y });
            };

            window.addEventListener("deviceorientation", handler);
            gyroCleanupRef.current = () => {
                window.removeEventListener("deviceorientation", handler);
            };
        };

        setupGyroscope();

        return () => {
            gyroCleanupRef.current?.();
        };
    }, [isMobile, isLandscape]);

    // ---------- Determine mode ----------
    const mode: PhotoMode = !isLandscape
        ? "none"
        : isMobile && hasGyroscope
            ? "gyroscope"
            : "kenburns";

    return {
        isLandscape,
        mode,
        gyroOffset,
        detecting,
    };
}
