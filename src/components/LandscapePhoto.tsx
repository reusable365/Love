"use client";

import { useLandscapePhoto } from "@/hooks/useLandscapePhoto";

interface LandscapePhotoProps {
    src: string;
    alt: string;
    className?: string;
    /** Extra classes for the wrapper div */
    wrapperClassName?: string;
    /** If true, skip landscape detection entirely (always object-cover) */
    disableEffect?: boolean;
}

/**
 * Drop-in image replacement that handles landscape photos with a "Letterbox Intelligent" style:
 * - Portrait photos → standard object-cover (full height)
 * - Landscape photos → object-contain with blurred background (full width key, no crop)
 */
export default function LandscapePhoto({
    src,
    alt,
    className = "",
    wrapperClassName = "",
    disableEffect = false,
}: LandscapePhotoProps) {
    const { isLandscape } = useLandscapePhoto(disableEffect ? undefined : src);

    // Portrait or disabled → simple image (cover)
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

    // Landscape → Letterbox Intelligent
    return (
        <div className={`relative overflow-hidden w-full h-full ${wrapperClassName}`}>
            {/* 1. Background: Blurred, Zoomed, Opacity */}
            <img
                src={src}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-60"
            />

            {/* 2. Foreground: Contained, Sharp, Shadow */}
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <img
                    src={src}
                    alt={alt}
                    className={`w-full h-full object-contain drop-shadow-2xl shadow-black/50 animate-subtle-zoom ${className}`}
                    loading="lazy"
                />
            </div>
        </div>
    );
}
