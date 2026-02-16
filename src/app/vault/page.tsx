"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase";
import {
    useMemories,
    useSoundtracks,
    useSetDailyPickMemory,
    useSetDailyPickSoundtrack,
    useClearDailyPickMemory,
    useClearDailyPickSoundtrack,
    useToggleFavorite,
} from "@/hooks/useData";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import BottomNav from "@/components/BottomNav";
import Toast from "@/components/Toast";
import SlideshowOverlay from "@/components/SlideshowOverlay";
import InteractiveFlipCard from "@/components/InteractiveFlipCard";
import { Heart, HeartOff, Wand2, Search, Loader2, BookOpen, Music, Play, PlayCircle } from "lucide-react";
import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/youtube";
import type { Memory, Soundtrack } from "@/lib/supabase";
import { formatPhotoDate } from "@/lib/exifUtils";

type SelectionMode = "random" | "manual";
type Tab = "flipbook" | "favorites" | "music" | "gallery";

export default function VaultPage() {
    const { data: memories = [], isLoading: loadingMems } = useMemories();
    const { data: soundtracks = [], isLoading: loadingSongs } = useSoundtracks();
    const setDailyMemory = useSetDailyPickMemory();
    const setDailySoundtrack = useSetDailyPickSoundtrack();
    const clearDailyMemory = useClearDailyPickMemory();
    const clearDailySoundtrack = useClearDailyPickSoundtrack();
    const toggleFavorite = useToggleFavorite();

    const [activeTab, setActiveTab] = useState<Tab>("favorites");
    const [mode, setMode] = useState<SelectionMode>("random");
    const [toast, setToast] = useState({ visible: false, message: "" });
    const [search, setSearch] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [showSlideshow, setShowSlideshow] = useState(false);

    const showToast = useCallback((message: string) => {
        setToast({ visible: true, message });
        setTimeout(() => setToast({ visible: false, message: "" }), 3000);
    }, []);

    const handleSetDailySong = async (soundtrack: Soundtrack) => {
        if (soundtrack.is_daily_pick) {
            await clearDailySoundtrack.mutateAsync();
            showToast("Sélection musique retirée — retour au hasard ! 🎲");
        } else {
            await setDailySoundtrack.mutateAsync(soundtrack.id);
            showToast("Musique sélectionnée pour demain ! 🎵");
        }
    };

    /* ─── Switch back to Random clears all picks ─── */
    const handleModeChange = async (newMode: SelectionMode) => {
        setMode(newMode);
        if (newMode === "random") {
            await clearDailyMemory.mutateAsync();
            await clearDailySoundtrack.mutateAsync();
            showToast("Retour au mode aléatoire ! L'algorithme choisit 🎲");
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

    // SURPRISE LOGIC: Only show "unlocked" memories (created_at <= today)
    const isUnlocked = (memory: Memory) => {
        if (!memory.created_at) return false;
        const revealDate = new Date(memory.created_at);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        return revealDate <= today;
    };

    const unlockedMemories = memories.filter(isUnlocked);
    const unlockedShuffled = shuffledMemories.filter(isUnlocked);

    // Gallery Logic: All memories matching search
    const galleryMemories = search
        ? memories.filter((m) => m.caption?.toLowerCase().includes(search.toLowerCase()))
        : memories;

    // General Logic:
    const displayMemories = search
        ? (mode === "manual" || activeTab === "gallery" ? memories : unlockedMemories)
        : (mode === "manual" || activeTab === "gallery" ? shuffledMemories : unlockedShuffled);

    /* ─── MAGIC SEED: Reset Timeline ─── */
    const { mutateAsync: updateMemory } = useMutation({
        mutationFn: async ({ id, created_at }: { id: string; created_at: string }) => {
            const { error } = await getSupabase().from("memories").update({ created_at }).eq("id", id);
            if (error) throw error;
        }
    });

    const queryClient = useQueryClient();

    const handleResetTimeline = async () => {
        if (!confirm("⚠️ REINITIALISER L'AVENTURE ?\n\nCeci va mélanger tous les souvenirs et les programmer pour s'afficher un par un, jour après jour, à partir d'aujourd'hui.\n\n(Action irréversible sur l'ordre d'apparition)")) return;

        showToast("⏳ Réorganisation temporelle en cours...");

        // 1. Shuffle all memories
        const shuffled = [...memories].sort(() => Math.random() - 0.5);

        // 2. Clear current Daily Pick (to ensure clean state)
        await clearDailyMemory.mutateAsync();
        await clearDailySoundtrack.mutateAsync();

        // 3. Assign dates starting from NOW
        const today = new Date();

        await Promise.all(shuffled.map(async (memory, index) => {
            const date = new Date(today);
            date.setDate(date.getDate() + index);

            await updateMemory({
                id: memory.id,
                created_at: date.toISOString()
            });
        }));

        // 4. Set the FIRST memory (Today) as Daily Pick
        if (shuffled.length > 0) {
            await setDailyMemory.mutateAsync(shuffled[0].id);
        }

        await queryClient.invalidateQueries({ queryKey: ["memories"] });
        showToast("✨ L'Aventure commence ! Demain, un nouveau souvenir...");
        setActiveTab("flipbook");
    };

    /* ─── DATE SWAP: Set as Tomorrow's Surprise ─── */
    const handleSetDailyPhoto = async (targetMemory: Memory) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 59, 999);

        const targetDateString = tomorrow.toDateString();

        const scheduledForTomorrow = memories.find(m => {
            if (!m.created_at) return false;
            return new Date(m.created_at).toDateString() === targetDateString;
        });

        if (!scheduledForTomorrow) {
            await updateMemory({ id: targetMemory.id, created_at: tomorrow.toISOString() });
            showToast("📅 Programmée pour demain !");
            return;
        }

        if (scheduledForTomorrow.id === targetMemory.id) {
            showToast("⚠️ C'est déjà la photo de demain !");
            return;
        }

        const targetOriginalDate = targetMemory.created_at || new Date().toISOString();

        showToast("🔄 Échange avec la photo de demain...");

        await Promise.all([
            updateMemory({ id: targetMemory.id, created_at: scheduledForTomorrow.created_at }),
            updateMemory({ id: scheduledForTomorrow.id, created_at: targetOriginalDate })
        ]);

        await setDailyMemory.mutateAsync(targetMemory.id);

        await queryClient.invalidateQueries({ queryKey: ["memories"] });
        showToast("✅ C'est fait ! Ce sera la surprise de demain.");
    };

    const displaySoundtracks = search ? soundtracks : shuffledSoundtracks;

    const filteredMemories = activeTab === "gallery"
        ? galleryMemories
        : (search
            ? (mode === "manual" ? memories.filter(m => m.caption?.toLowerCase().includes(search.toLowerCase())) : unlockedMemories.filter(m => m.caption?.toLowerCase().includes(search.toLowerCase())))
            : (mode === "manual" ? shuffledMemories : unlockedShuffled)
        );

    const filteredSoundtracks = search
        ? displaySoundtracks.filter(
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

    return (
        <div className="flex flex-col h-dvh bg-background relative overflow-hidden">
            <BackgroundOrbs />
            <AnimatePresence>
                {showSlideshow && (
                    <SlideshowOverlay
                        memories={unlockedShuffled}
                        onClose={() => setShowSlideshow(false)}
                    />
                )}
            </AnimatePresence>

            {/* Header with Tabs */}
            <div className="relative z-10 pt-12 px-6 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <h1 className="text-3xl font-[var(--font-dm-serif)] text-foreground tracking-tight leading-tight">
                        Le <span className="text-primary italic">Coffre</span> à souvenirs
                    </h1>

                    <div className="flex gap-2">
                        {/* MAGIC WAND (Hidden tool for setup) - DISABLED PER USER REQUEST */}
                        {/* 
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={handleResetTimeline}
                            className="size-10 rounded-full bg-purple-500/10 backdrop-blur-md border border-purple-500/20 flex items-center justify-center shadow-sm text-purple-500 hover:bg-purple-500 hover:text-white transition-all"
                            title="Réinitialiser l'Aventure (Mélanger & Program)"
                        >
                            <Wand2 className="size-5" />
                        </motion.button>
                        */}

                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowSlideshow(true)}
                            className="size-10 rounded-full bg-primary/10 backdrop-blur-md border border-primary/20 flex items-center justify-center shadow-sm text-primary hover:bg-primary hover:text-white transition-all"
                            title="Lancer le Diaporama"
                        >
                            <PlayCircle className="size-6" />
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowSearch(!showSearch)}
                            className={`size-10 rounded-full bg-white/50 backdrop-blur-md border border-white/40 flex items-center justify-center shadow-sm ${showSearch ? 'bg-white/80' : ''}`}
                        >
                            <Search className="size-5 text-foreground" />
                        </motion.button>
                    </div>
                </div>

                {/* TABS */}
                <div className="flex gap-4 border-b border-black/5 pb-2 overflow-x-auto custom-scrollbar">
                    <button
                        onClick={() => setActiveTab("flipbook")}
                        className={`text-xs font-bold uppercase tracking-widest transition-all pb-1 ${activeTab === "flipbook"
                            ? "text-primary border-b-2 border-primary"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Le Flipbook
                    </button>
                    <button
                        onClick={() => setActiveTab("favorites")}
                        className={`text-xs font-bold uppercase tracking-widest transition-all pb-1 ${activeTab === "favorites"
                            ? "text-primary border-b-2 border-primary"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Coup de 🩷
                    </button>
                    <button
                        onClick={() => setActiveTab("music")}
                        className={`text-xs font-bold uppercase tracking-widest transition-all pb-1 ${activeTab === "music"
                            ? "text-primary border-b-2 border-primary"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Musique
                    </button>
                    <button
                        onClick={() => setActiveTab("gallery")}
                        className={`text-xs font-bold uppercase tracking-widest transition-all pb-1 ${activeTab === "gallery"
                            ? "text-primary border-b-2 border-primary"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Galerie ({memories.length})
                    </button>
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
                            placeholder="Chercher..."
                            className="w-full mt-3 bg-input rounded-2xl px-4 py-3 text-foreground font-medium border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
                            autoFocus
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Selection Mode toggle (Only visible for Flipbook) */}
            {(activeTab === "flipbook") && (
                <div className="relative z-10 px-6 mt-4">
                    <div className="glass-light rounded-2xl p-3 shadow-sm flex items-center justify-between">
                        <div className="flex flex-col">
                            <p className="text-xs font-semibold text-foreground">Mode de sélection</p>
                            <p className="text-[10px] text-muted-foreground">
                                Pour la surprise de demain (Tout voir & Choisir)
                            </p>
                        </div>
                        <div className="flex items-center gap-1 bg-background/50 rounded-full p-1">
                            <button
                                onClick={() => handleModeChange("random")}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${mode === "random"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-foreground opacity-60"
                                    }`}
                            >
                                Aléatoire
                            </button>
                            <button
                                onClick={() => setMode("manual")}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all ${mode === "manual"
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-foreground opacity-60"
                                    }`}
                            >
                                Manuel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto relative z-10 px-6 pt-6 pb-40 custom-scrollbar">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="size-8 text-primary animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* ─── TAB: FLIPBOOK ─── */}
                        {activeTab === "flipbook" && (
                            <div className="animate-fade-in-up">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="size-5 text-primary opacity-80" />
                                        <h2 className="text-xl font-[var(--font-dm-serif)] text-foreground">Le Flipbook</h2>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{filteredMemories.length} souvenirs</p>
                                </div>

                                {filteredMemories.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-muted-foreground text-sm">Pas encore de photos dévoilées.</p>
                                    </div>
                                ) : (
                                    <div className="flex gap-4">
                                        {/* Left column */}
                                        <div className="flex-1 flex flex-col gap-4">
                                            {filteredMemories
                                                .filter((_, i) => i % 2 === 0)
                                                .map((memory, i) => (
                                                    <div key={memory.id} className="relative">
                                                        <InteractiveFlipCard
                                                            memory={memory}
                                                            className={`w-full ${masonryHeights[i % masonryHeights.length]}`}
                                                            onClick={() => mode === "manual" && handleSetDailyPhoto(memory)}
                                                            selected={memory.is_daily_pick}
                                                            enableSelection={mode === "manual"}
                                                        />
                                                        {mode === "manual" && !isUnlocked(memory) && (
                                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl pointer-events-none">
                                                                <p className="text-white text-xs font-bold uppercase tracking-widest text-center px-4">
                                                                    🔒 Prévu pour<br />{new Date(memory.created_at).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                        {/* Right column */}
                                        <div className="flex-1 flex flex-col gap-4 mt-8">
                                            {filteredMemories
                                                .filter((_, i) => i % 2 === 1)
                                                .map((memory, i) => (
                                                    <div key={memory.id} className="relative">
                                                        <InteractiveFlipCard
                                                            memory={memory}
                                                            className={`w-full ${masonryHeights[(i + 3) % masonryHeights.length]}`}
                                                            onClick={() => mode === "manual" && handleSetDailyPhoto(memory)}
                                                            selected={memory.is_daily_pick}
                                                            enableSelection={mode === "manual"}
                                                        />
                                                        {mode === "manual" && !isUnlocked(memory) && (
                                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl pointer-events-none">
                                                                <p className="text-white text-xs font-bold uppercase tracking-widest text-center px-4">
                                                                    🔒 Prévu pour<br />{new Date(memory.created_at).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ─── TAB: FAVORITES ─── */}
                        {activeTab === "favorites" && (
                            <div className="animate-fade-in-up">
                                {(() => {
                                    const favorites = memories.filter(m => m.is_favorite);
                                    const unlockedFavorites = favorites.filter(isUnlocked);

                                    if (unlockedFavorites.length === 0) {
                                        return (
                                            <div className="text-center py-12 flex flex-col items-center">
                                                <Heart className="size-12 text-pink-200 mb-4" />
                                                <p className="text-muted-foreground text-sm">Pas encore de coups de cœur.</p>
                                                <p className="text-xs text-muted-foreground/60 mt-2">Double-clique sur une photo du Flipbook pour l'ajouter ici.</p>
                                            </div>
                                        );
                                    }

                                    return (
                                        <>
                                            <div className="flex items-center gap-2 mb-6">
                                                <Heart className="size-5 text-pink-400 fill-pink-400" />
                                                <h2 className="text-xl font-[var(--font-dm-serif)] text-foreground">Coup de 🩷</h2>
                                                <span className="text-xs text-muted-foreground ml-auto">{unlockedFavorites.length} favoris</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                {unlockedFavorites.map((memory, i) => (
                                                    <div
                                                        key={memory.id}
                                                        className={`w-full relative ${masonryHeights[i % masonryHeights.length]}`}
                                                    >
                                                        <InteractiveFlipCard
                                                            memory={memory}
                                                            className="w-full h-full"
                                                        />
                                                        {/* Unfavorite button */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleFavorite.mutate({ id: memory.id, is_favorite: false });
                                                                showToast("Retiré des Coup de 🩷");
                                                            }}
                                                            className="absolute top-2 right-2 z-30 size-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-red-500/40 transition-all"
                                                            title="Retirer des favoris"
                                                        >
                                                            <HeartOff className="size-4 text-white" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        )}

                        {/* ─── TAB: MUSIC ─── */}
                        {activeTab === "music" && (
                            <div className="animate-fade-in-up">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Music className="size-5 text-primary opacity-80" />
                                        <h2 className="text-xl font-[var(--font-dm-serif)] text-foreground">La Réserve Musicale</h2>
                                    </div>
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{filteredSoundtracks.length} titres</span>
                                </div>

                                <div className="flex flex-col gap-3">
                                    {filteredSoundtracks.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-muted-foreground text-sm">Pas encore de musique. Ajoute tes chansons préférées !</p>
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
                        )}

                        {/* ─── TAB: GALLERY (NEW) ─── */}
                        {activeTab === "gallery" && (
                            <div className="animate-fade-in-up">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Wand2 className="size-5 text-primary opacity-80" />
                                        <h2 className="text-xl font-[var(--font-dm-serif)] text-foreground">La Galerie Complète</h2>
                                    </div>
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{filteredMemories.length} photos</span>
                                </div>

                                <p className="text-xs text-muted-foreground mb-4">
                                    Accès direct à toutes les photos de la base de données. Tu peux aussi en choisir une pour demain !
                                </p>

                                {filteredMemories.length === 0 ? (
                                    <div className="text-center py-12">
                                        <p className="text-muted-foreground text-sm">Aucune photo trouvée.</p>
                                    </div>
                                ) : (
                                    <div className="flex gap-4">
                                        {/* Simplified Grid for Gallery */}
                                        <div className="flex-1 flex flex-col gap-4">
                                            {filteredMemories.filter((_, i) => i % 2 === 0).map((memory, i) => (
                                                <InteractiveFlipCard
                                                    key={memory.id}
                                                    memory={memory}
                                                    className={`w-full ${masonryHeights[i % masonryHeights.length]}`}
                                                    onClick={() => handleSetDailyPhoto(memory)}
                                                    selected={memory.is_daily_pick}
                                                    enableSelection={true}
                                                />
                                            ))}
                                        </div>
                                        <div className="flex-1 flex flex-col gap-4 mt-8">
                                            {filteredMemories.filter((_, i) => i % 2 === 1).map((memory, i) => (
                                                <InteractiveFlipCard
                                                    key={memory.id}
                                                    memory={memory}
                                                    className={`w-full ${masonryHeights[(i + 3) % masonryHeights.length]}`}
                                                    onClick={() => handleSetDailyPhoto(memory)}
                                                    selected={memory.is_daily_pick}
                                                    enableSelection={true}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
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
                        Sélectionné
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
                    {isSelected ? "Sélectionné" : "Choisir"}
                </motion.button>
            )}
        </motion.div>
    );
}
