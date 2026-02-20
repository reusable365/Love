"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Pause, Play, MapPin, Calendar } from "lucide-react";
import type { Memory } from "@/lib/supabase";
import { formatPhotoDate } from "@/lib/exifUtils";
import LandscapePhoto from "@/components/LandscapePhoto";

interface SlideshowOverlayProps {
    memories: Memory[];
    onClose: () => void;
}

export default function SlideshowOverlay({ memories, onClose }: SlideshowOverlayProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(true);
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);

    const currentMemory = memories[currentIndex];

    const goNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % memories.length);
    }, [memories.length]);

    const goPrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + memories.length) % memories.length);
    }, [memories.length]);

    // Auto-advance
    useEffect(() => {
        if (!isPlaying) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % memories.length);
        }, 6000); // 6 seconds per slide

        return () => clearInterval(timer);
    }, [isPlaying, memories.length]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowRight") goNext();
            if (e.key === "ArrowLeft") goPrev();
            if (e.key === " ") setIsPlaying((prev) => !prev);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [memories.length, onClose, goNext, goPrev]);

    // Touch swipe navigation
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    }, []);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (touchStartX.current === null || touchStartY.current === null) return;

        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        const deltaY = e.changedTouches[0].clientY - touchStartY.current;
        const SWIPE_THRESHOLD = 50;

        // Only trigger if horizontal swipe is dominant
        if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX < 0) {
                goNext(); // Swipe left → next
            } else {
                goPrev(); // Swipe right → previous
            }
        }

        touchStartX.current = null;
        touchStartY.current = null;
    }, [goNext, goPrev]);

    if (!currentMemory) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black flex items-center justify-center"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Background Blur (Ambient) */}
            <div className="absolute inset-0 opacity-30">
                <img
                    src={currentMemory.image_url}
                    alt=""
                    className="w-full h-full object-cover blur-3xl scale-125"
                />
            </div>

            {/* Main Image Container */}
            <div className="absolute inset-0 flex items-center justify-center p-4 md:p-10">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentMemory.id}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{
                            opacity: 1,
                            scale: 1,
                            transition: { duration: 1.5, ease: "easeOut" }
                        }}
                        exit={{ opacity: 0, transition: { duration: 0.8 } }}
                        className="relative w-full h-full max-h-[90vh] max-w-[90vw] flex items-center justify-center overflow-hidden rounded-xl shadow-2xl"
                    >
                        {/* Ken Burns Effect Wrapper */}
                        <motion.img
                            src={currentMemory.image_url}
                            alt="Memory"
                            className="w-full h-full object-contain max-h-full max-w-full"
                            animate={{ scale: [1, 1.05] }}
                            transition={{ duration: 6, ease: "linear" }}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Metadata Overlay (Bottom Left) */}
            <div className="absolute bottom-10 left-6 md:left-12 z-20 text-white/90 drop-shadow-lg filter">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentMemory.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col gap-2"
                    >
                        {/* Date */}
                        <div className="flex items-center gap-2">
                            <Calendar className="size-4 opacity-80" />
                            <span className="text-lg font-[var(--font-dm-serif)] tracking-wide">
                                {formatPhotoDate(currentMemory.photo_date)}
                            </span>
                        </div>

                        {/* Location */}
                        {currentMemory.photo_location && (
                            <div className="flex items-center gap-2">
                                <MapPin className="size-4 opacity-80" />
                                <span className="text-sm font-light tracking-widest uppercase opacity-90">
                                    {currentMemory.photo_location}
                                </span>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Controls (Top Right) */}
            <div className="absolute top-6 right-6 z-30 flex items-center gap-4">
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-3 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-all"
                >
                    {isPlaying ? <Pause className="size-6" /> : <Play className="size-6" />}
                </button>
                <button
                    onClick={onClose}
                    className="p-3 rounded-full bg-black/20 hover:bg-red-500/20 text-white backdrop-blur-md transition-all hover:text-red-200"
                >
                    <X className="size-6" />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                <motion.div
                    key={currentMemory.id}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 6, ease: "linear", repeat: 0 }}
                    className="h-full bg-white/50"
                />
            </div>
        </motion.div>
    );
}
