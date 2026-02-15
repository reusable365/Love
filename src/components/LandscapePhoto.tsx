"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useLandscapePhoto } from "@/hooks/useLandscapePhoto";

interface LandscapePhotoProps {
    src: string;
    alt: string;
    className?: string;
    /** Extra classes for the wrapper div */
    wrapperClassName?: string;
    /** Duration of Ken Burns cycle in seconds (default: 10) */
    kenBurnsDuration?: number;
    /** If true, skip landscape detection entirely */
    disableEffect?: boolean;
}

/**
 * Drop-in image replacement that handles landscape photos:
 * - Portrait photos → standard object-cover, no animation
 * - Landscape photos → Ken Burns pan animation (CSS)
 * - On touch devices: user can also drag to explore manually
 */
export default function LandscapePhoto({
    src,
    alt,
    className = "",
    wrapperClassName = "",
    kenBurnsDuration = 13,
    disableEffect = false,
}: LandscapePhotoProps) {
    const { isLandscape } = useLandscapePhoto(disableEffect ? undefined : src);

    // Touch drag state
    const [isDragging, setIsDragging] = useState(false);
    const [dragPosition, setDragPosition] = useState(50); // 0-100 percentage
    const [isPaused, setIsPaused] = useState(false);
    const touchStartRef = useRef<{ x: number; startPos: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Touch handlers for drag-to-pan
    const handleTouchStart = useCallback(
        (e: React.TouchEvent) => {
            if (!isLandscape) return;
            const touch = e.touches[0];
            touchStartRef.current = { x: touch.clientX, startPos: dragPosition };
            setIsDragging(true);
            setIsPaused(true);
            // Clear any existing resume timer
            if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        },
        [isLandscape, dragPosition]
    );

    const handleTouchMove = useCallback(
        (e: React.TouchEvent) => {
            if (!touchStartRef.current || !containerRef.current) return;
            const touch = e.touches[0];
            const containerWidth = containerRef.current.offsetWidth;
            const deltaX = touch.clientX - touchStartRef.current.x;
            // Convert pixel delta to percentage (inverted: drag left = see right side)
            const deltaPercent = -(deltaX / containerWidth) * 100;
            const newPos = Math.max(
                0,
                Math.min(100, touchStartRef.current.startPos + deltaPercent)
            );
            setDragPosition(newPos);
        },
        []
    );

    const handleTouchEnd = useCallback(() => {
        setIsDragging(false);
        touchStartRef.current = null;
        // Resume Ken Burns after 3 seconds of no interaction
        resumeTimerRef.current = setTimeout(() => {
            setIsPaused(false);
        }, 3000);
    }, []);

    // Cleanup timer on unmount
    useEffect(() => {
        return () => {
            if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        };
    }, []);

    // Portrait or disabled → simple image
    if (!isLandscape || disableEffect) {
        return (
            <img
                src={src}
                alt={alt}
                className={`w-full h-full object-cover ${className}`}
                loading="lazy"
            />
        );
    }

    // Landscape → Ken Burns with optional touch drag
    return (
        <div
            ref={containerRef}
            className={`overflow-hidden w-full h-full ${wrapperClassName}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <img
                src={src}
                alt={alt}
                className={`w-full h-full object-cover ${isPaused ? "" : "landscape-kenburns"
                    } ${className}`}
                style={{
                    ...(isPaused
                        ? { objectPosition: `${dragPosition}% center` }
                        : { animationDuration: `${kenBurnsDuration}s` }),
                    // Smooth transition when dragging
                    transition: isDragging ? "none" : "object-position 0.3s ease-out",
                }}
                loading="lazy"
                draggable={false}
            />
        </div>
    );
}
