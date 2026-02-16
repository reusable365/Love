"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    useMemories,
    useSoundtracks,
    useSetDailyPickMemory,
    useSetDailyPickSoundtrack,
    useClearDailyPickMemory,
    useClearDailyPickSoundtrack,
} from "@/hooks/useData";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import BottomNav from "@/components/BottomNav";
import Toast from "@/components/Toast";
import InteractiveFlipCard from "@/components/InteractiveFlipCard";
import { Heart, Wand2, Search, Loader2 } from "lucide-react";
import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/youtube";
import type { Memory, Soundtrack } from "@/lib/supabase";

type SelectionMode = "random" | "manual";

export default function VaultPage() {
    const { data: memories = [], isLoading: loadingMems } = useMemories();
    const { data: soundtracks = [], isLoading: loadingSongs } = useSoundtracks();
    const setDailyMemory = useSetDailyPickMemory();
    const setDailySoundtrack = useSetDailyPickSoundtrack();
    const clearDailyMemory = useClearDailyPickMemory();
    const clearDailySoundtrack = useClearDailyPickSoundtrack();

    const [mode, setMode] = useState<SelectionMode>("random");
    const [toast, setToast] = useState({ visible: false, message: "" });
    const [search, setSearch] = useState("");
    const [showSearch, setShowSearch] = useState(false);

    const showToast = useCallback((message: string) => {
        setToast({ visible: true, message });
        setTimeout(() => setToast({ visible: false, message: "" }), 3000);
    }, []);

    /* ─── Handle daily pick ─── */
    const handleSetDailyPhoto = async (memory: Memory) => {
        if (memory.is_daily_pick) {
            await clearDailyMemory.mutateAsync();
            showToast("Photo pick cleared — back to random! 🎲");
        } else {
            await setDailyMemory.mutateAsync(memory.id);
            showToast("Selection saved for your partner! ❤️");
        }
    };

    const handleSetDailySong = async (soundtrack: Soundtrack) => {
        if (soundtrack.is_daily_pick) {
            await clearDailySoundtrack.mutateAsync();
            showToast("Song pick cleared — back to random! 🎲");
        } else {
            await setDailySoundtrack.mutateAsync(soundtrack.id);
            showToast("Song selected for tomorrow! 🎵");
        }
    };

    /* ─── Switch back to Random clears all picks ─── */
    const handleModeChange = async (newMode: SelectionMode) => {
        setMode(newMode);
        if (newMode === "random") {
            await clearDailyMemory.mutateAsync();
            await clearDailySoundtrack.mutateAsync();
            showToast("Back to random mode! The algorithm chooses 🎲");
        }
    };

    /* ─── Shuffled Data ─── */
    const [shuffledMemories, setShuffledMemories] = useState<Memory[]>([]);
    const [shuffledSoundtracks, setShuffledSoundtracks] = useState<Soundtrack[]>([]);

    useEffect(() => {
        if (memories.length > 0) {
            setShuffledMemories([...memories].sort(() => Math.random() - 0.5));
        }
    }, [memories]);

    useEffect(() => {
        if (soundtracks.length > 0) {
            setShuffledSoundtracks([...soundtracks].sort(() => Math.random() - 0.5));
        }
    }, [soundtracks]);

    // Use shuffled data for filtering
    const displayMemories = search ? memories : shuffledMemories; // Search overrides shuffle
    const displaySoundtracks = search ? soundtracks : shuffledSoundtracks;

    const filteredMemories = search
        ? memories.filter((m) => m.caption?.toLowerCase().includes(search.toLowerCase()))
        : displayMemories;

    const filteredSoundtracks = search
        ? soundtracks.filter(
            (s) =>
                s.title.toLowerCase().includes(search.toLowerCase()) ||
                s.artist.toLowerCase().includes(search.toLowerCase())
        )
        : displaySoundtracks;

    const selectedMemCount = memories.filter((m) => m.is_daily_pick).length;
    const selectedSongCount = soundtracks.filter((s) => s.is_daily_pick).length;

    const isLoading = loadingMems || loadingSongs;

    /* ─── Masonry heights ─── */
    const masonryHeights = ["h-72", "h-48", "h-64", "h-56", "h-80", "h-48", "h-60", "h-44"];

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="flex flex-col h-dvh bg-background relative overflow-hidden">
            <BackgroundOrbs />

            {/* Header */}
            <div className="relative z-10 pt-12 px-6 flex justify-between items-start">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-[var(--font-dm-serif)] text-foreground tracking-tight leading-tight">
                        Le <span className="text-primary italic">Coffre</span> à souvenirs
                    </h1>
                    <div className="flex gap-4">
                        <button
                            onClick={() => scrollToSection("photos-section")}
                            className="text-muted-foreground font-medium text-xs uppercase tracking-widest hover:text-primary transition-colors cursor-pointer"
                        >
                            Photos
                        </button>
                        <span className="text-muted-foreground/30 text-xs">•</span>
                        <button
                            onClick={() => scrollToSection("songs-section")}
                            className="text-muted-foreground font-medium text-xs uppercase tracking-widest hover:text-primary transition-colors cursor-pointer"
                        >
                            Music
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowSearch(!showSearch)}
                        className="size-10 rounded-full bg-white/50 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-sm"
                        id="search-toggle"
                    >
                        <Search className="size-5 text-foreground" />
                    </motion.button>
                </div>
            </div>

            {/* Search bar */}
            <AnimatePresence>
                {showSearch && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="relative z-10 px-6 overflow-hidden"
                    >
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search memories & songs..."
                            className="w-full mt-3 bg-input rounded-2xl px-4 py-3 text-foreground font-medium border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
                            autoFocus
                            id="search-input"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Selection Mode toggle */}
            <div className="relative z-10 px-6 mt-6">
                <div className="glass-light rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <p className="text-sm font-semibold text-foreground">Selection Mode</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Choose how to pick daily surprises
                            </p>
                        </div>
                        <div className="flex items-center gap-2 bg-background/50 rounded-full p-1">
                            <button
                                onClick={() => handleModeChange("random")}
                                className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${mode === "random"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-foreground"
                                    }`}
                                id="mode-random"
                            >
                                Random
                            </button>
                            <button
                                onClick={() => setMode("manual")}
                                className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${mode === "manual"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-foreground"
                                    }`}
                                id="mode-manual"
                            >
                                Manual
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto relative z-10 px-6 pt-6 pb-40 custom-scrollbar">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="size-8 text-primary animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Photos Section */}
                        <div className="mb-8" id="photos-section">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-[var(--font-dm-serif)] text-foreground">Photos</h2>
                                <p className="text-xs text-muted-foreground">{selectedMemCount} selected</p>
                            </div>

                            {filteredMemories.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground text-sm">No photos yet. Add some memories!</p>
                                </div>
                            ) : (
                                <div className="flex gap-4">
                                    {/* Left column */}
                                    <div className="flex-1 flex flex-col gap-4">
                                        {filteredMemories
                                            .filter((_, i) => i % 2 === 0)
                                            .map((memory, i) => (
                                                <InteractiveFlipCard
                                                    key={memory.id}
                                                    memory={memory}
                                                    className={`w-full ${masonryHeights[i % masonryHeights.length]}`}
                                                />
                                            ))}
                                    </div>
                                    {/* Right column (offset) */}
                                    <div className="flex-1 flex flex-col gap-4 mt-8">
                                        {filteredMemories
                                            .filter((_, i) => i % 2 === 1)
                                            .map((memory, i) => (
                                                <InteractiveFlipCard
                                                    key={memory.id}
                                                    memory={memory}
                                                    className={`w-full ${masonryHeights[(i + 3) % masonryHeights.length]}`}
                                                />
                                            ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Songs Section */}
                        <div className="mt-8" id="songs-section">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-[var(--font-dm-serif)] text-foreground">Songs</h2>
                                <p className="text-xs text-muted-foreground">{selectedSongCount} selected</p>
                            </div>
                            <div className="flex flex-col gap-3">
                                {filteredSoundtracks.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-muted-foreground text-sm">No songs yet. Add your favorites!</p>
                                    </div>
                                ) : (
                                    filteredSoundtracks.map((song) => (
                                        <SongCard
                                            key={song.id}
                                            song={song}
                                            onTogglePick={handleSetDailySong}
                                            showManual={mode === "manual"}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <BottomNav />
            <Toast message={toast.message} visible={toast.visible} />
        </div>
    );
}



/* ═══════════════════════════════════════
   Song Card
   ═══════════════════════════════════════ */
function SongCard({
    song,
    onTogglePick,
    showManual,
}: {
    song: Soundtrack;
    onTogglePick: (s: Soundtrack) => void;
    showManual: boolean;
}) {
    const isSelected = song.is_daily_pick;
    const youtubeId = song.type === "youtube" ? extractYouTubeId(song.src_url) : null;
    const thumbnail = youtubeId
        ? getYouTubeThumbnail(youtubeId)
        : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect fill='%23D4A5A5' width='100' height='100'/%3E%3Ctext x='50' y='55' text-anchor='middle' font-size='40' fill='white'%3E🎵%3C/text%3E%3C/svg%3E";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`glass-light rounded-2xl p-3 shadow-sm flex items-center gap-3 ${isSelected ? "ring-2 ring-accent" : ""
                }`}
        >
            <img
                src={thumbnail}
                alt={`${song.title} thumbnail`}
                className="size-16 rounded-xl object-cover"
                loading="lazy"
            />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{song.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{song.artist}</p>
                {isSelected && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mt-1 px-2 py-0.5 rounded-full bg-accent text-white text-[9px] font-bold uppercase tracking-wide inline-block"
                    >
                        Selected
                    </motion.div>
                )}
            </div>
            {showManual && (
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => onTogglePick(song)}
                    className={`px-4 py-2 rounded-full text-xs font-medium shadow-sm flex items-center gap-2 transition-all ${isSelected
                        ? "bg-muted text-muted-foreground"
                        : "bg-primary text-primary-foreground active:scale-95"
                        }`}
                >
                    <Wand2 className="size-4" />
                    {isSelected ? "Selected" : "Set as Daily"}
                </motion.button>
            )}
        </motion.div>
    );
}
