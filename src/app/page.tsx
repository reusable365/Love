"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useMemories,
  useSoundtracks,
  useDailyPickMemory,
  useDailyPickSoundtrack,
  useUpdateMemory,
  useSetDailyPickMemory,
  useSetDailyPickSoundtrack,
  useToggleFavorite,
} from "@/hooks/useData";
import { getSeededRandom, seededPick } from "@/lib/seededRandom";
import { formatPhotoDate } from "@/lib/exifUtils";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import BottomNav from "@/components/BottomNav";
import MusicPlayer from "@/components/MusicPlayer";
import SlideshowOverlay from "@/components/SlideshowOverlay";
import { FlipCard } from "@/components/FlipCard";
import MagicalText from "@/components/MagicalText";
import { Loader2, Heart, MapPin, Calendar, PlayCircle } from "lucide-react";
import { differenceInDays } from "date-fns";
import type { Memory, Soundtrack } from "@/lib/supabase";

export default function DailySurprisePage() {
  const { data: allMemories, isLoading: loadingMemories } = useMemories();
  const { data: allSoundtracks, isLoading: loadingSoundtracks } = useSoundtracks();

  const updateMemory = useUpdateMemory();
  const setDailyMemory = useSetDailyPickMemory();
  const setDailySoundtrack = useSetDailyPickSoundtrack();
  const toggleFavorite = useToggleFavorite();

  // Interaction State
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState("");
  const [showSlideshow, setShowSlideshow] = useState(false);

  // Double-tap heart animation
  const [showHeart, setShowHeart] = useState(false);
  const lastTapRef = useRef(0);

  /* ─── Determine today's photo and song ─── */
  const { photo, song } = useMemo(() => {
    const memories = allMemories ?? [];
    const soundtracks = allSoundtracks ?? [];

    let photo: Memory | null = null;
    let song: Soundtrack | null = null;
    const todayStr = new Date().toLocaleDateString("fr-CA");

    if (memories.length > 0) {
      // 1. Check for a memory scheduled SPECIFICALLY for today (Advent Calendar logic)
      const scheduledForToday = memories.find((m) => {
        if (!m.created_at) return false;
        return new Date(m.created_at).toLocaleDateString("fr-CA") === todayStr;
      });

      // 2. Check for manual override (is_daily_pick) ONLY if it matches today or if no schedule exists
      const manualPick = memories.find((m) => m.is_daily_pick);

      if (scheduledForToday) {
        photo = scheduledForToday;
      } else if (manualPick) {
        // Fallback: if a manual pick exists but isn't today's scheduled one, use it?
        // Actually, if we use the Magic Wand, manualPick IS scheduledForToday usually.
        // But if manualPick is old (yesterday), we should ignore it in favor of seeded random?
        // Let's stick with manualPick as a strong override for now, but maybe only if it's recent?
        // Simplify: If scheduled found, use it. If not, check manual.
        photo = manualPick;
      } else {
        const rng = getSeededRandom();
        photo = seededPick(memories, rng);
      }
    }
    if (soundtracks.length > 0) {
      const manualSong = soundtracks.find((s) => s.is_daily_pick);
      if (manualSong) {
        song = manualSong;
      } else {
        const rng = getSeededRandom();
        rng(); // Advance rng
        song = seededPick(soundtracks, rng);
      }
    }

    return { photo, song };
  }, [allMemories, allSoundtracks]);

  // Sync draft with photo caption
  useEffect(() => {
    if (photo?.caption) {
      if (/.*\.(jpe?g|png|heic|webp|gif)$/i.test(photo.caption)) {
        setCaptionDraft("");
      } else {
        setCaptionDraft(photo.caption);
      }
    } else {
      setCaptionDraft("");
    }
  }, [photo]);

  // Midnight Watcher
  useEffect(() => {
    const mountDate = new Date().toLocaleDateString("fr-CA");
    const interval = setInterval(() => {
      const currentDate = new Date().toLocaleDateString("fr-CA");
      if (currentDate !== mountDate) {
        window.location.reload();
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const isLoading = loadingMemories || loadingSoundtracks;

  // Days counter
  const daysCount = differenceInDays(new Date(), new Date(2002, 1, 10));

  /* ─── Handlers ─── */
  const toggleMusic = () => setIsMusicPlaying(!isMusicPlaying);

  const handleSaveCaption = () => {
    if (photo && captionDraft !== photo.caption) {
      updateMemory.mutate({ id: photo.id, caption: captionDraft });
    }
    setIsEditingCaption(false);
  };

  // Double-tap handler for Coup de 🩷
  const handleDoubleTap = useCallback((e: React.MouseEvent) => {
    // Ignore clicks from interactive elements (buttons, etc.)
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('[data-interactive]')) return;

    if (!photo) return;
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    lastTapRef.current = now;

    if (timeSinceLastTap < 350) {
      // Double tap detected!
      setShowHeart(true);
      if (!photo.is_favorite) {
        toggleFavorite.mutate({ id: photo.id, is_favorite: true });
      }
      setTimeout(() => setShowHeart(false), 1200);
    }
  }, [photo, toggleFavorite]);

  /* ─── Loading state ─── */
  if (isLoading) {
    return (
      <div className="flex flex-col h-dvh bg-background relative overflow-hidden">
        <BackgroundOrbs />
        <div className="flex-1 flex items-center justify-center relative z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="size-10 text-primary" />
          </motion.div>
        </div>
        <BottomNav />
      </div>
    );
  }

  /* ─── Empty state ─── */
  if (!photo && !song) {
    return (
      <div className="flex flex-col h-dvh bg-background relative overflow-hidden">
        <BackgroundOrbs />
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
          >
            <Heart className="size-20 text-accent mx-auto mb-6" strokeWidth={1} />
          </motion.div>
          <h1 className="text-2xl font-[var(--font-dm-serif)] text-foreground mb-3">
            Pas encore de souvenirs
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs">
            Commence par ajouter ta première photo dans le Coffre.
          </p>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Formatted photo metadata
  // Fallback: If no metadata date, use the DB created_at date
  const dateToDisplay = photo?.photo_date || photo?.created_at;
  const photoDateStr = formatPhotoDate(dateToDisplay);
  const photoLoc = photo?.photo_location;

  /* ─── Main Daily Surprise View ─── */
  return (
    <div className="flex flex-col h-dvh bg-background relative overflow-hidden">
      <BackgroundOrbs />

      {/* ═══ SLIDESHOW OVERLAY ═══ */}
      <AnimatePresence>
        {showSlideshow && allMemories && allMemories.length > 0 && (() => {
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          const unlocked = allMemories.filter(m => m.created_at && new Date(m.created_at) <= today);
          if (unlocked.length === 0) return null;
          return (
            <SlideshowOverlay
              memories={[...unlocked].sort(() => Math.random() - 0.5)}
              onClose={() => setShowSlideshow(false)}
            />
          );
        })()}
      </AnimatePresence>

      <div className="flex-1 flex flex-col relative z-10 h-full">

        {/* Photo container with Flip Interaction */}
        {photo && (
          <div
            className="flex-1 relative mx-4 my-4 rounded-[32px] overflow-hidden shadow-2xl"
            onClick={handleDoubleTap}
          >
            <FlipCard
              memory={photo}
              isEditing={isEditingCaption}
              captionDraft={captionDraft}
              onCaptionChange={setCaptionDraft}
              onEditToggle={() => setIsEditingCaption(!isEditingCaption)}
              onSave={handleSaveCaption}
            >
              {/* ═══ RECTO OVERLAY ═══ */}

              {/* TOP-LEFT — Days counter + Slideshow button */}
              <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10 pointer-events-none">
                  <span className="font-[var(--font-dm-serif)] text-lg text-white/90 leading-none">
                    {daysCount}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-white/60 font-semibold">
                    jours
                  </span>
                </div>
                {/* Slideshow button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSlideshow(true);
                  }}
                  className="size-9 rounded-full bg-black/30 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-all active:scale-90"
                  title="Lancer le Diaporama"
                >
                  <PlayCircle className="size-5" />
                </button>
              </div>

              {/* TOP-RIGHT — Photo date & location (discreet) */}
              {(photoDateStr || photoLoc) && (
                <div className="absolute top-3 right-3 z-20 pointer-events-none">
                  <div className="flex flex-col items-end gap-1">
                    {photoDateStr && (
                      <span className="flex items-center gap-1 bg-black/30 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/10 text-white/80 text-[10px] font-medium">
                        <Calendar className="size-3 opacity-60" />
                        {photoDateStr}
                      </span>
                    )}
                    {photoLoc && (
                      <span className="flex items-center gap-1 bg-black/30 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/10 text-white/80 text-[10px] font-medium">
                        <MapPin className="size-3 opacity-60" />
                        {photoLoc}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* BOTTOM-RIGHT — Favorite indicator */}
              {photo.is_favorite && (
                <div className="absolute bottom-4 right-4 z-20 pointer-events-none">
                  <div className="bg-black/30 backdrop-blur-md rounded-full p-2 border border-white/10">
                    <Heart className="size-4 text-pink-400 fill-pink-400" />
                  </div>
                </div>
              )}
            </FlipCard>

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
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 15,
                    }}
                  >
                    <Heart
                      className="size-28 text-pink-500 drop-shadow-2xl"
                      fill="currentColor"
                      strokeWidth={0}
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Dim overlay when music plays */}
            <div className={`absolute inset-0 bg-black/20 pointer-events-none transition-opacity duration-500 ${isMusicPlaying ? 'opacity-100' : 'opacity-0'} z-10`} />

          </div>
        )}

        {/* Music player at bottom */}
        {song && (
          <div className="absolute bottom-24 left-4 right-4 z-20">
            <MusicPlayer
              soundtrack={song}
              isPlaying={isMusicPlaying}
              onTogglePlay={toggleMusic}
            />
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
