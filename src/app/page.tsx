"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  useMemories,
  useSoundtracks,
  useDailyPickMemory,
  useDailyPickSoundtrack,
  useUpdateMemory,
  useSetDailyPickMemory,
  useSetDailyPickSoundtrack
} from "@/hooks/useData";
import { getSeededRandom, seededPick } from "@/lib/seededRandom";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import BottomNav from "@/components/BottomNav";
import MusicPlayer from "@/components/MusicPlayer";
import { FlipCard } from "@/components/FlipCard";
import MagicalText from "@/components/MagicalText";
import { Loader2, Heart, Play, Pause } from "lucide-react";
import type { Memory, Soundtrack } from "@/lib/supabase";

export default function DailySurprisePage() {
  const { data: allMemories, isLoading: loadingMemories } = useMemories();
  const { data: allSoundtracks, isLoading: loadingSoundtracks } = useSoundtracks();
  // We don't use dailyPick data anymore for selection, but we could use it for syncing manually.

  const updateMemory = useUpdateMemory();
  const setDailyMemory = useSetDailyPickMemory();
  const setDailySoundtrack = useSetDailyPickSoundtrack();

  // Interaction State
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState("");

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

  /* ─── Handlers ─── */
  const toggleMusic = () => setIsMusicPlaying(!isMusicPlaying);

  const handleSaveCaption = () => {
    if (photo && captionDraft !== photo.caption) {
      updateMemory.mutate({ id: photo.id, caption: captionDraft });
    }
    setIsEditingCaption(false);
  };

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

  /* ─── Main Daily Surprise View ─── */
  return (
    <div className="flex flex-col h-dvh bg-background relative overflow-hidden">
      <BackgroundOrbs />

      <div className="flex-1 flex flex-col relative z-10 h-full">

        {/* Photo container with Flip Interaction */}
        {photo && (
          <div
            className="flex-1 relative mx-4 my-4 rounded-[32px] overflow-hidden shadow-2xl"
          >
            <FlipCard
              memory={photo}
              isEditing={isEditingCaption}
              captionDraft={captionDraft}
              onCaptionChange={setCaptionDraft}
              onEditToggle={() => setIsEditingCaption(!isEditingCaption)}
              onSave={handleSaveCaption}
            >
              {/* Front Overlay: Greeting */}
              <div
                className="absolute top-8 left-0 right-0 z-20 px-6 pointer-events-none"
              >
                <div className="flex flex-col items-center justify-center">
                  <div className="text-6xl md:text-8xl font-[var(--font-dm-serif)] text-white drop-shadow-lg">
                    {Math.floor((new Date().getTime() - new Date(2002, 1, 10).getTime()) / (1000 * 60 * 60 * 24))}
                  </div>
                  <div className="text-sm uppercase tracking-[0.3em] text-white/80 font-bold mt-2 drop-shadow-md">
                    Jours Ensemble
                  </div>
                </div>
              </div>
            </FlipCard>

            {/* Dim overlay when music plays */}
            <div className={`absolute inset-0 bg-black/20 pointer-events-none transition-opacity duration-500 ${isMusicPlaying ? 'opacity-100' : 'opacity-0'} z-10`} />

          </div>
        )}

        {/* Music player at bottom (Global Overlay) */}
        {song && (
          <motion.div
            className="absolute bottom-24 left-4 right-4 z-20"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <MusicPlayer
              soundtrack={song}
              isPlaying={isMusicPlaying}
              onTogglePlay={toggleMusic}
            />
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
