"use client";

import { useLandscapePhoto } from "@/hooks/useLandscapePhoto";

interface LandscapePhotoProps {
    src: string;
    alt: string;
    className?: string;
    /** Extra classes for the wrapper div */
    wrapperClassName?: string;
    /** Duration of Ken Burns cycle in seconds (default: 12) */
    kenBurnsDuration?: number;
    /** If true, skip landscape detection entirely */
    disableEffect?: boolean;
}

/**
 * Drop-in image replacement that intelligently handles landscape photos:
 * - Portrait photos → standard object-cover, no animation
 * - Landscape on mobile (gyroscope) → tilt-to-pan effect
 * - Landscape on desktop → smooth Ken Burns pan animation
 */
export default function LandscapePhoto({
    src,
    alt,
    className = "",
    wrapperClassName = "",
    kenBurnsDuration = 12,
    disableEffect = false,
}: LandscapePhotoProps) {
    const { isLandscape, mode, gyroOffset } = useLandscapePhoto(
        disableEffect ? undefined : src
    );

    // Portrait or disabled → simple image
    if (!isLandscape || disableEffect || mode === "none") {
        return (
            <img
                src={src}
                alt={alt}
                className={`w-full h-full object-cover ${className}`}
                loading="lazy"
            />
        );
    }

    // Gyroscope mode → translate based on tilt
    if (mode === "gyroscope") {
        // Map gyroOffset.x [-1, 1] to translate percentage
        // We scale up the image to ~140% so there's room to pan
        const translateX = gyroOffset.x * 20; // ±20% travel
        const translateY = gyroOffset.y * 8; // subtle vertical

        return (
            <div
                className={`overflow-hidden w-full h-full ${wrapperClassName}`}
            >
                <img
                    src={src}
                    alt={alt}
                    className={`w-full h-full object-cover transition-transform duration-200 ease-out ${className}`}
                    style={{
                        transform: `scale(1.4) translate(${translateX}%, ${translateY}%)`,
                    }}
                    loading="lazy"
                />
            </div>
        );
    }

    // Ken Burns mode → CSS animation
    return (
        <img
            src={src}
            alt={alt}
            className={`w-full h-full object-cover landscape-kenburns ${className}`}
            style={{
                animationDuration: `${kenBurnsDuration}s`,
            }}
            loading="lazy"
        />
    );
}
