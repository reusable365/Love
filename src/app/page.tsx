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
import { FlipCard } from "@/components/FlipCard";
import MagicalText from "@/components/MagicalText";
import { Loader2, Heart, MapPin, Calendar } from "lucide-react";
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

  // Double-tap heart animation
  const [showHeart, setShowHeart] = useState(false);
  const lastTapRef = useRef(0);

  /* ─── Determine today's photo and song ─── */
  const { photo, song } = useMemo(() => {
    const memories = allMemories ?? [];
    const soundtracks = allSoundtracks ?? [];

    let photo: Memory | null = null;
    let song: Soundtrack | null = null;

    if (memories.length > 0) {
      const rng = getSeededRandom();
      photo = seededPick(memories, rng);
    }
    if (soundtracks.length > 0) {
      const rng = getSeededRandom();
      rng(); // Advance rng
      song = seededPick(soundtracks, rng);
    }

    return { photo, song };
  }, [allMemories, allSoundtracks]);

  // Sync draft with photo caption
  useEffect(() => {
    if (photo?.caption) {
      setCaptionDraft(photo.caption);
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
  const handleDoubleTap = useCallback(() => {
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
            No memories yet
          </h1>
          <p className="text-muted-foreground text-sm max-w-xs">
            Start by adding your first photo in the Vault.
          </p>
        </div>
        <BottomNav />
      </div>
    );
  }

  // Formatted photo metadata
  const photoDateStr = formatPhotoDate(photo?.photo_date);
  const photoLoc = photo?.photo_location;

  /* ─── Main Daily Surprise View ─── */
  return (
    <div className="flex flex-col h-dvh bg-background relative overflow-hidden">
      <BackgroundOrbs />

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

              {/* TOP — Photo date & location */}
              {(photoDateStr || photoLoc) && (
                <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
                  <div className="flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-b from-black/50 to-transparent">
                    {photoDateStr && (
                      <span className="flex items-center gap-1.5 text-white/90 text-xs font-medium">
                        <Calendar className="size-3 opacity-70" />
                        {photoDateStr}
                      </span>
                    )}
                    {photoDateStr && photoLoc && (
                      <span className="text-white/30">·</span>
                    )}
                    {photoLoc && (
                      <span className="flex items-center gap-1.5 text-white/90 text-xs font-medium">
                        <MapPin className="size-3 opacity-70" />
                        {photoLoc}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* CENTER — Days counter (prominent overlay) */}
              <div className="absolute top-12 left-0 right-0 z-20 pointer-events-none flex justify-center">
                <div className="flex flex-col items-center bg-black/40 backdrop-blur-lg rounded-3xl px-6 py-3 border border-white/15 shadow-lg">
                  <span className="font-[var(--font-dm-serif)] text-4xl text-white leading-none tracking-tight">
                    {daysCount}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-white/70 font-bold mt-1">
                    jours ensemble
                  </span>
                </div>
              </div>

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
