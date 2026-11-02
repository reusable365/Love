"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Loader2, Check, Eye } from "lucide-react";
import { useToggleFavorite, useUpdateMemory } from "@/hooks/useData";
import LandscapePhoto from "@/components/LandscapePhoto";
import { getQuoteForMemory } from "@/lib/quotes";
import { parseMemoryData, incrementMemoryView, getAffectionLevel, getTotalViews, serializeMemoryData } from "@/lib/memoryNotes";
import { useCoupleUser } from "@/lib/useCoupleUser";

interface InteractiveFlipCardProps {
    memory: {
        id: string;
        image_url: string;
        caption: string;
        is_daily_pick: boolean;
        is_favorite?: boolean;
    };
    className?: string;
    onClick?: () => void;
    selected?: boolean;
    enableSelection?: boolean;
}

export default function InteractiveFlipCard({
    memory,
    className = "",
    onClick,
    selected,
    enableSelection = false
}: InteractiveFlipCardProps) {
    const { user } = useCoupleUser();
    const [isFlipped, setIsFlipped] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    // Fallback quote
    const fallbackQuote = getQuoteForMemory(memory.id);
    const parsed = parseMemoryData(memory.caption, fallbackQuote);
    const totalViews = getTotalViews(parsed);
    const affection = getAffectionLevel(totalViews);

    // Ignore default filenames when initializing the edit draft
    const initialCaption = parsed.quote || "";
    const [caption, setCaption] = useState(initialCaption);

    useEffect(() => {
        if (!isEditing) {
            setCaption(parsed.quote || "");
        }
    }, [parsed.quote, isEditing]);

    const [justSaved, setJustSaved] = useState(false);
    const [showHeart, setShowHeart] = useState(false);
    const lastTapRef = useRef(0);

    const toggleFavorite = useToggleFavorite();
    const updateMemory = useUpdateMemory();

    const handleFlip = () => {
        if (!isEditing) {
            const nextFlipped = !isFlipped;
            setIsFlipped(nextFlipped);

            // Record a view for the active partner when admiring the back of the photo
            if (nextFlipped && user) {
                const sessionKey = `love_flip_view_${memory.id}_${user}`;
                let canCount = false;
                try {
                    const last = localStorage.getItem(sessionKey) || sessionStorage.getItem(sessionKey);
                    const COOLDOWN_MS = 5 * 60 * 1000; // 5 min cooldown in Vault
                    canCount = !last || (Date.now() - Number(last) > COOLDOWN_MS);
                    if (canCount) {
                        try { localStorage.setItem(sessionKey, String(Date.now())); } catch {}
                        try { sessionStorage.setItem(sessionKey, String(Date.now())); } catch {}
                    }
                } catch {
                    canCount = true;
                }

                if (canCount) {
                    const { newCaption } = incrementMemoryView(memory.caption, user, fallbackQuote);
                    updateMemory.mutate({
                        id: memory.id,
                        caption: newCaption,
                    });
                }
            }
        }
    };

    // Double-tap handler for Coup de 🩷
    const handleDoubleTap = useCallback(() => {
        const now = Date.now();
        const timeSinceLastTap = now - lastTapRef.current;
        lastTapRef.current = now;

        if (timeSinceLastTap < 300) {
            // Double tap detected!
            setShowHeart(true);
            if (!memory.is_favorite) {
                toggleFavorite.mutate({ id: memory.id, is_favorite: true });
            }
            setTimeout(() => setShowHeart(false), 1200);
            return true; // was a double-tap
        }
        return false; // was a single tap
    }, [memory.id, memory.is_favorite, toggleFavorite]);

    const handleCardClick = (e: React.MouseEvent) => {
        if (enableSelection && onClick) {
            e.stopPropagation();
            onClick();
            return;
        }
        // Check double-tap first, only flip if it was a single tap
        if (!handleDoubleTap()) {
            // Delay the flip to wait for potential second tap
            setTimeout(() => {
                if (Date.now() - lastTapRef.current >= 300) {
                    handleFlip();
                }
            }, 310);
        }
    };

    const handleBlur = () => {
        setIsEditing(false);
        const trimmed = caption.trim();
        if (trimmed !== (parsed.quote || "")) {
            const updated = {
                ...parsed,
                quote: trimmed,
            };
            updateMemory.mutate({
                id: memory.id,
                caption: serializeMemoryData(updated),
            });
            setJustSaved(true);
            setTimeout(() => setJustSaved(false), 2000);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleBlur();
        }
    };

    const isSelected = selected !== undefined ? selected : memory.is_daily_pick;

    return (
        <div className={`relative perspective-1000 group ${className}`}>
            <motion.div
                className="w-full h-full relative preserve-3d transition-all duration-500"
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
                {/* FRONT SIDE (Photo) */}
                <div
                    className={`absolute inset-0 backface-hidden rounded-[24px] overflow-hidden shadow-lg cursor-pointer bg-white transition-all duration-300 ${isSelected && enableSelection ? "ring-4 ring-primary scale-[0.98]" : ""
                        }`}
                    onClick={handleCardClick}
                >
                    <LandscapePhoto
                        src={memory.image_url}
                        alt="Memory"
                    />

                    {/* Overlay actions — Coup de 🩷 */}
                    {!enableSelection && (
                        <div className="absolute top-3 right-3 flex gap-2">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite.mutate({ id: memory.id, is_favorite: !memory.is_favorite });
                                }}
                                className={`size-9 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${memory.is_favorite
                                    ? "bg-pink-500 text-white shadow-lg scale-110"
                                    : "bg-black/20 text-white/80 hover:bg-white/20"
                                    }`}
                            >
                                {toggleFavorite.isPending ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : (
                                    <Heart
                                        className={`size-5 ${memory.is_favorite ? "fill-current" : ""}`}
                                    />
                                )}
                            </button>
                        </div>
                    )}

                    {/* ❤️ DOUBLE-TAP HEART ANIMATION */}
                    <AnimatePresence>
                        {showHeart && (
                            <motion.div
                                className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <motion.div
                                    initial={{ scale: 0, rotate: -10 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                >
                                    <Heart className="size-16 text-pink-500 drop-shadow-2xl" fill="currentColor" strokeWidth={0} />
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Views badge on front */}
                    {totalViews > 0 && (
                        <div className="absolute bottom-3 left-3 z-20 pointer-events-none">
                            <div className="flex items-center gap-1.5 bg-black/45 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-white/95 border border-white/15 shadow-sm">
                                <Eye className="size-3 text-amber-300" />
                                <span>👑 {parsed.stephane_views_count} · 🌸 {parsed.caroline_views_count}</span>
                            </div>
                        </div>
                    )}

                    {/* Flip hint on hover */}
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex justify-center pb-2">
                        <span className="text-white/90 text-xs font-medium tracking-wider uppercase border border-white/30 rounded-full px-3 py-1 backdrop-blur-sm">
                            Cliquer pour lire
                        </span>
                    </div>
                </div>

                {/* BACK SIDE (Caption / Paper) */}
                <div
                    className="absolute inset-0 backface-hidden rounded-[24px] shadow-xl rotate-y-180 overflow-hidden cursor-pointer"
                    onClick={!isEditing ? handleFlip : undefined}
                    style={{
                        backgroundColor: "#fcf8f2", // Cream/Paper color
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E")`,
                    }}
                >
                    {/* Darker border for depth */}
                    <div className="absolute inset-0 border-[6px] border-white/40 pointer-events-none rounded-[24px]" />

                    <div className="h-full flex flex-col p-6 relative">
                        {/* Paper header */}
                        <div className="flex justify-between items-center mb-4 border-b border-stone-200 pb-2">
                            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-sans">
                                J&apos;ai pensé à toi
                            </span>
                            {justSaved && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full"
                                >
                                    <Check className="size-3" />
                                    <span className="text-[10px] font-medium">Sauvegardé</span>
                                </motion.div>
                            )}
                        </div>

                        {/* Editable Content */}
                        <div className="flex-1 flex items-center justify-center relative">
                            {isEditing ? (
                                <textarea
                                    className="w-full h-full bg-transparent resize-none border-none focus:ring-0 text-2xl text-center leading-relaxed text-[#2c3e50] font-[var(--font-caveat)] p-0"
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    onBlur={handleBlur}
                                    onKeyDown={handleKeyDown}
                                    autoFocus
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    style={{
                                        fontFamily: "var(--font-caveat), cursive",
                                    }}
                                />
                            ) : (
                                <div
                                    className="w-full h-full flex items-center justify-center text-2xl text-center leading-relaxed text-[#2c3e50] font-[var(--font-caveat)] selection:bg-stone-200"
                                    data-interactive="true"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsEditing(true);
                                    }}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    style={{
                                        fontFamily: "var(--font-caveat), cursive",
                                    }}
                                >
                                    {(caption && !/.*\.(jpe?g|png|heic|webp|gif)$/i.test(caption)) ? caption : (
                                        <span className="text-[#2c3e50]/70">
                                            {fallbackQuote}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Views breakdown & quick gaze button */}
                        <div className="mt-3 pt-2 border-t border-stone-200/80 flex flex-col items-center gap-1.5">
                            <div className="flex items-center gap-2 text-[11px] text-stone-600 font-sans">
                                <span className="font-semibold text-amber-700">👑 Steph : {parsed.stephane_views_count}</span>
                                <span className="text-stone-300">•</span>
                                <span className="font-semibold text-pink-700">🌸 Caro : {parsed.caroline_views_count}</span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${affection.bgBadge} font-bold`}>
                                    {affection.emoji} {affection.label}
                                </span>
                            </div>
                            {user && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        const { newCaption } = incrementMemoryView(memory.caption, user, fallbackQuote);
                                        updateMemory.mutate({
                                            id: memory.id,
                                            caption: newCaption,
                                        });
                                        setShowHeart(true);
                                        setTimeout(() => setShowHeart(false), 1200);
                                    }}
                                    className="text-[10px] font-semibold text-[#8E5B5B] hover:text-[#5c3838] bg-white/80 hover:bg-white px-2.5 py-0.5 rounded-full border border-stone-200 transition active:scale-95 flex items-center gap-1 shadow-2xs cursor-pointer"
                                >
                                    <span>👀</span>
                                    <span>Poser un regard d&apos;amour (+1)</span>
                                </button>
                            )}
                        </div>

                        {/* Footer / Hint */}
                        <div className="mt-4 pt-2 border-t border-stone-200 flex justify-center">
                            <span className="text-[10px] text-stone-400 font-sans">
                                {isEditing ? "Écrire puis cliquer ailleurs" : "Cliquer sur le texte pour éditer"}
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div >
        </div >
    );
}
