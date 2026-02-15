"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause } from "lucide-react";
import YouTube, { YouTubeEvent } from "react-youtube";
import type { Soundtrack } from "@/lib/supabase";
import { extractYouTubeId } from "@/lib/youtube";

interface MusicPlayerProps {
    soundtrack: Soundtrack;
    isPlaying?: boolean;
    onTogglePlay?: () => void;
}

export default function MusicPlayer({ soundtrack, isPlaying: externalIsPlaying, onTogglePlay }: MusicPlayerProps) {
    // Internal state only used if external props are not provided (backward compatibility)
    const [internalIsPlaying, setInternalIsPlaying] = useState(false);

    // Derived state: use external if available, else internal
    const isControlled = typeof externalIsPlaying !== "undefined" && !!onTogglePlay;
    const isPlaying = isControlled ? externalIsPlaying : internalIsPlaying;

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ytPlayerRef = useRef<any>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const isMP3 = soundtrack.type === "mp3";
    const youtubeId = !isMP3 ? extractYouTubeId(soundtrack.src_url) : null;

    /* ─── Time formatting ─── */
    const formatTime = (s: number) => {
        const min = Math.floor(s / 60);
        const sec = Math.floor(s % 60);
        return `${min}:${sec.toString().padStart(2, "0")}`;
    };

    /* ─── Progress tracking ─── */
    const startTracking = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
            if (isMP3 && audioRef.current) {
                setCurrentTime(audioRef.current.currentTime);
            } else if (ytPlayerRef.current?.getCurrentTime) {
                setCurrentTime(ytPlayerRef.current.getCurrentTime());
            }
        }, 250);
    }, [isMP3]);

    const stopTracking = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    useEffect(() => () => stopTracking(), [stopTracking]);

    /* ─── Sync with isPlaying state ─── */
    useEffect(() => {
        if (isMP3 && audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(() => setError(true));
                startTracking();
            } else {
                audioRef.current.pause();
                stopTracking();
            }
        } else if (ytPlayerRef.current && ytPlayerRef.current.playVideo) {
            if (isPlaying) {
                ytPlayerRef.current.playVideo();
                startTracking();
            } else {
                ytPlayerRef.current.pauseVideo();
                stopTracking();
            }
        }
    }, [isPlaying, isMP3, startTracking, stopTracking]);

    /* ─── Play / Pause toggle ─── */
    const handleTogglePlay = useCallback(() => {
        if (isControlled && onTogglePlay) {
            onTogglePlay();
        } else {
            setInternalIsPlaying(prev => !prev);
        }
    }, [isControlled, onTogglePlay]);

    /* ─── MP3 event handlers ─── */
    const onAudioLoaded = () => {
        if (audioRef.current) setDuration(audioRef.current.duration);
    };

    const onAudioEnded = () => {
        if (isControlled && onTogglePlay && isPlaying) {
            onTogglePlay(); // Notify parent to stop
        } else {
            setInternalIsPlaying(false);
        }
        setCurrentTime(0);
        stopTracking();
    };

    const onAudioError = () => setError(true);

    /* ─── YouTube event handlers ─── */
    const onYTReady = (e: YouTubeEvent) => {
        ytPlayerRef.current = e.target;
        setDuration(e.target.getDuration());

        // Sync initial state if needed
        if (isPlaying) {
            e.target.playVideo();
            startTracking();
        }
    };

    const onYTStateChange = (e: YouTubeEvent) => {
        const state = e.data;
        if (state === 0) {
            // Ended
            if (isControlled && onTogglePlay && isPlaying) {
                onTogglePlay(); // Notify parent to stop
            } else {
                setInternalIsPlaying(false);
            }
            setCurrentTime(0);
            stopTracking();
        }
    };

    const onYTError = () => setError(true);

    /* ─── Progress bar click ─── */
    const progressBarRef = useRef<HTMLDivElement>(null);
    const onSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressBarRef.current || !duration) return;
        const rect = progressBarRef.current.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const seekTime = ratio * duration;

        if (isMP3 && audioRef.current) {
            audioRef.current.currentTime = seekTime;
        } else if (ytPlayerRef.current) {
            ytPlayerRef.current.seekTo(seekTime, true);
        }
        setCurrentTime(seekTime);
    };

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    /* ─── Error fallback ─── */
    if (error) {
        return (
            <div className="glass rounded-3xl p-6 shadow-2xl">
                <div className="flex items-center gap-4">
                    <div className="size-16 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🎵</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-[var(--font-dm-serif)] text-xl truncate leading-tight">
                            {soundtrack.title}
                        </h3>
                        <p className="text-white/60 text-sm mt-1">
                            Unable to load • {soundtrack.type === "youtube" ? "Video may have been removed" : "Audio file unavailable"}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass rounded-3xl p-6 landscape:p-3 shadow-2xl transition-all duration-300">
            {/* Hidden MP3 element */}
            {isMP3 && (
                <audio
                    ref={audioRef}
                    src={soundtrack.src_url}
                    onLoadedMetadata={onAudioLoaded}
                    onEnded={onAudioEnded}
                    onError={onAudioError}
                    preload="metadata"
                />
            )}

            {/* Hidden YouTube player */}
            {!isMP3 && youtubeId && (
                <div className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden">
                    <YouTube
                        videoId={youtubeId}
                        opts={{
                            height: "1",
                            width: "1",
                            playerVars: {
                                autoplay: 0, // Controlled by state
                                controls: 0,
                                disablekb: 1,
                                fs: 0,
                                modestbranding: 1,
                                rel: 0,
                                playsinline: 1,
                                origin: typeof window !== "undefined" ? window.location.origin : undefined,
                            },
                        }}
                        onReady={onYTReady}
                        onStateChange={onYTStateChange}
                        onError={onYTError}
                    />
                </div>
            )}

            {/* Player UI */}
            <div className="flex items-center gap-4 landscape:gap-2 mb-5 landscape:mb-2">
                {/* Play button */}
                <div className="relative group cursor-pointer" onClick={(e) => {
                    e.stopPropagation(); // Prevent bubbling if nested
                    handleTogglePlay();
                }}>
                    <div className="absolute inset-0 bg-primary/40 rounded-full blur-lg group-hover:blur-xl transition-all duration-500 animate-pulse" />
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        className="relative size-16 landscape:size-10 bg-white rounded-full flex items-center justify-center shadow-xl text-primary hover:scale-110 transition-transform duration-300"
                        id="play-pause-btn"
                    >
                        <AnimatePresence mode="wait">
                            {isPlaying ? (
                                <motion.div
                                    key="pause"
                                    initial={{ scale: 0, rotate: -90 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: 90 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Pause className="size-7 landscape:size-5" fill="currentColor" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="play"
                                    initial={{ scale: 0, rotate: 90 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0, rotate: -90 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Play className="size-7 landscape:size-5 ml-1" fill="currentColor" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>

                {/* Song info */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-[var(--font-dm-serif)] text-xl landscape:text-base truncate leading-tight">
                        {soundtrack.title}
                    </h3>
                    <p className="text-white/80 text-sm landscape:text-xs truncate mt-1 landscape:mt-0">{soundtrack.artist}</p>
                </div>

                {/* Equalizer bars */}
                <div className="flex gap-0.5 items-end h-9 pb-1">
                    {[3, 7, 4, 8, 5].map((h, i) => (
                        <motion.div
                            key={i}
                            className="w-1 bg-white/90 rounded-full"
                            animate={
                                isPlaying
                                    ? {
                                        height: [h * 4, h * 2, h * 4.5, h * 3, h * 4],
                                    }
                                    : { height: h * 2 }
                            }
                            transition={
                                isPlaying
                                    ? {
                                        duration: 0.8 + i * 0.15,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }
                                    : { duration: 0.3 }
                            }
                        />
                    ))}
                </div>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-3">
                <span className="text-xs text-white/70 font-medium w-10 text-right">
                    {formatTime(currentTime)}
                </span>
                <div
                    ref={progressBarRef}
                    className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSeek(e);
                    }}
                >
                    <motion.div
                        className="h-full bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.6)]"
                        style={{ width: `${progress}%` }}
                        transition={{ duration: 0.1 }}
                    />
                </div>
                <span className="text-xs text-white/70 font-medium w-10">
                    {formatTime(duration)}
                </span>
            </div>
        </div>
    );
}
