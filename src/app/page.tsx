"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useMemories, useSoundtracks, useDailyPickMemory, useDailyPickSoundtrack } from "@/hooks/useData";
import { getSeededRandom, seededPick } from "@/lib/seededRandom";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import BottomNav from "@/components/BottomNav";
import MusicPlayer from "@/components/MusicPlayer";
import { Loader2, Heart } from "lucide-react";
import type { Memory, Soundtrack } from "@/lib/supabase";

export default function DailySurprisePage() {
  const { data: allMemories, isLoading: loadingMemories } = useMemories();
  const { data: allSoundtracks, isLoading: loadingSoundtracks } = useSoundtracks();
  const { data: dailyPickMemory } = useDailyPickMemory();
  const { data: dailyPickSoundtrack } = useDailyPickSoundtrack();

  /* ─── Determine today's photo and song ─── */
  const { photo, song } = useMemo(() => {
    const memories = allMemories ?? [];
    const soundtracks = allSoundtracks ?? [];

    let photo: Memory | null = null;
    let song: Soundtrack | null = null;

    // Priority 1: Manual daily pick from DB
    if (dailyPickMemory) {
      photo = dailyPickMemory;
    }
    if (dailyPickSoundtrack) {
      song = dailyPickSoundtrack;
    }

    // Priority 2: Seeded random fallback
    if (!photo && memories.length > 0) {
      const rng = getSeededRandom();
      photo = seededPick(memories, rng);
    }
    if (!song && soundtracks.length > 0) {
      const rng = getSeededRandom();
      // Advance the rng once so photo and song don't correlate on the same index
      rng();
      song = seededPick(soundtracks, rng);
    }

    return { photo, song };
  }, [allMemories, allSoundtracks, dailyPickMemory, dailyPickSoundtrack]);

  const isLoading = loadingMemories || loadingSoundtracks;

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
            Start by adding your first photo or song in the Vault. Your daily surprise awaits!
          </p>
        </div>
        <BottomNav />
      </div>
    );
  }

  /* ─── Main Daily Surprise View ─── */
  return (
    <div className="flex flex-col h-dvh bg-background relative overflow-hidden">
      <BackgroundOrbs />

      <div className="flex-1 flex flex-col relative z-10 h-full">
        {/* Top heading */}
        <motion.div
          className="absolute top-8 left-0 right-0 z-20 px-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h1 className="text-2xl font-[var(--font-dm-serif)] text-white tracking-tight leading-tight text-center drop-shadow-lg">
            Good morning, my love.
            <br />
            Today&apos;s surprise...
          </h1>
        </motion.div>

        {/* Photo container */}
        {photo && (
          <motion.div
            className="flex-1 relative mx-4 my-4 rounded-[32px] overflow-hidden shadow-2xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <img
              src={photo.image_url}
              alt={photo.caption || "Daily surprise"}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none" />

            {/* Caption overlay - Only show if it's NOT a filename */}
            {photo.caption &&
              !photo.caption.startsWith("Souvenir :") &&
              !photo.caption.match(/\.(jpg|jpeg|png|webp)$/i) && (
                <motion.div
                  className="absolute top-20 left-6 right-6 z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1, duration: 0.8 }}
                >
                  <p className="text-white/70 text-sm font-medium text-center italic">
                    &ldquo;{photo.caption}&rdquo;
                  </p>
                </motion.div>
              )}
          </motion.div>
        )}

        {/* Music player at bottom */}
        {song && (
          <motion.div
            className="absolute bottom-24 left-4 right-4 z-20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <MusicPlayer soundtrack={song} />
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
