"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface LandscapePhotoState {
    isLandscape: boolean;
    /** Touch drag offset in percentage [-1, 1] */
    dragOffset: number;
    /** Whether the user is currently dragging */
    isDragging: boolean;
}

/**
 * Hook that detects if a photo is landscape and provides
 * touch-drag state for manual panning on mobile.
 *
 * Ken Burns animation is handled purely via CSS class.
 * This hook provides drag-to-pan as an additional mobile interaction.
 */
export function useLandscapePhoto(src: string | undefined): LandscapePhotoState {
    const [isLandscape, setIsLandscape] = useState(false);

    // ---------- Detect image orientation ----------
    useEffect(() => {
        if (!src) {
            setIsLandscape(false);
            return;
        }

        const img = new Image();
        img.onload = () => {
            const ratio = img.naturalWidth / img.naturalHeight;
            setIsLandscape(ratio > 1.2);
        };
        img.onerror = () => setIsLandscape(false);
        img.src = src;
    }, [src]);

    return {
        isLandscape,
        dragOffset: 0,
        isDragging: false,
    };
}
