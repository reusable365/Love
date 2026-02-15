"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import LandscapePhoto from "@/components/LandscapePhoto";
import MagicalText from "@/components/MagicalText";
import { Loader2, Heart, Edit2, Play, Pause, Sparkles } from "lucide-react";
import type { Memory, Soundtrack } from "@/lib/supabase";

export default function DailySurprisePage() {
  const { data: allMemories, isLoading: loadingMemories } = useMemories();
  const { data: allSoundtracks, isLoading: loadingSoundtracks } = useSoundtracks();
  const { data: dailyPickMemory } = useDailyPickMemory();
  const { data: dailyPickSoundtrack } = useDailyPickSoundtrack();

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

    // Purely Automatic: Seeded random based on date
    // We ignore DB manual picks (`dailyPickMemory`) to ensure it always rotates.

    if (memories.length > 0) {
      const rng = getSeededRandom();
      photo = seededPick(memories, rng);
    }
    if (soundtracks.length > 0) {
      const rng = getSeededRandom();
      // Advance the rng once so photo and song don't correlate on the same index
      rng();
      song = seededPick(soundtracks, rng);
    }

    return { photo, song };
  }, [allMemories, allSoundtracks]); // Removed dailyPick dependencies

  // Sync draft with photo caption
  useEffect(() => {
    if (photo?.caption) {
      setCaptionDraft(photo.caption);
    }
  }, [photo]);

  // Midnight Watcher: Refresh the page if the day changes while open
  useEffect(() => {
    // We capture the date when the component mounts
    const mountDate = new Date().toLocaleDateString("fr-CA");

    // Check every minute if the date has changed
    const interval = setInterval(() => {
      const currentDate = new Date().toLocaleDateString("fr-CA");
      if (currentDate !== mountDate) {
        window.location.reload(); // Reload to fetch new daily seed
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

  const handleNewSurprise = () => {
    if (allMemories && allMemories.length > 0) {
      const randomMemory = allMemories[Math.floor(Math.random() * allMemories.length)];
      setDailyMemory.mutate(randomMemory.id);
    }
    if (allSoundtracks && allSoundtracks.length > 0) {
      const randomSoundtrack = allSoundtracks[Math.floor(Math.random() * allSoundtracks.length)];
      setDailySoundtrack.mutate(randomSoundtrack.id);
    }
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
            Start by adding your first photo or song in the Vault. Your daily surprise awaits!
          </p>
        </div>
        <BottomNav />
      </div>
    );
  }

  const isFilenameCaption = photo?.caption?.startsWith("Souvenir :") && !!photo?.caption?.match(/\.(jpg|jpeg|png|webp)$/i);
  const showCaption = photo?.caption && !isFilenameCaption;

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
          <MagicalText className="text-2xl font-[var(--font-dm-serif)] text-white tracking-tight leading-tight text-center drop-shadow-lg" />
        </motion.div>

        {/* New Surprise Button removed per user request */}

        {/* Photo container with click-to-play */}
        {photo && (
          <motion.div
            className="flex-1 relative mx-4 my-4 rounded-[32px] overflow-hidden shadow-2xl cursor-pointer group"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            onClick={toggleMusic}
          >
            <div className="absolute inset-0">
              <LandscapePhoto
                src={photo.image_url}
                alt={photo.caption || "Daily surprise"}
                className="transition-transform duration-700 group-hover:scale-105"
                wrapperClassName="absolute inset-0"
              />
            </div>
            <div className={`absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 transition-opacity duration-500 ${isMusicPlaying ? 'opacity-80' : 'opacity-100'}`} />

            {/* Play/Pause indicator overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
              <div className="bg-black/30 backdrop-blur-sm p-4 rounded-full">
                {isMusicPlaying ? (
                  <Pause className="size-8 text-white fill-white" />
                ) : (
                  <Play className="size-8 text-white fill-white ml-1" />
                )}
              </div>
            </div>

            {/* Caption overlay or Editor */}
            <div
              className="absolute top-20 left-6 right-6 z-30"
              onClick={(e) => e.stopPropagation()}
            >
              {isEditingCaption ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-white/10"
                >
                  <textarea
                    value={captionDraft}
                    onChange={(e) => setCaptionDraft(e.target.value)}
                    className="w-full bg-transparent text-white text-center italic font-medium focus:outline-none resize-none"
                    rows={3}
                    placeholder="Write a memory..."
                    autoFocus
                  />
                  <div className="flex justify-center gap-2 mt-2">
                    <button
                      onClick={() => setIsEditingCaption(false)}
                      className="px-3 py-1 text-xs text-white/70 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveCaption}
                      className="px-4 py-1.5 bg-white text-black text-xs font-bold rounded-full hover:bg-white/90"
                    >
                      Save
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="group/caption relative flex flex-col items-center">
                  {showCaption && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1, duration: 0.8 }}
                    >
                      <p className="text-white/80 text-lg font-medium text-center italic drop-shadow-md">
                        &ldquo;{photo.caption}&rdquo;
                      </p>
                    </motion.div>
                  )}

                  {/* Edit Button - Visible on hover or if no caption */}
                  <button
                    onClick={() => setIsEditingCaption(true)}
                    className={`mt-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-white/60 text-[10px] hover:text-white hover:bg-black/40 transition-all ${showCaption ? 'opacity-0 group-hover/caption:opacity-100' : 'opacity-70 hover:opacity-100'}`}
                  >
                    <Edit2 className="size-3" />
                    <span>Edit Caption</span>
                  </button>
                </div>
              )}
            </div>
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
