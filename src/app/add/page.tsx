"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ArrowLeft, Camera, Video, Link as LinkIcon, Upload, Loader2, AlertTriangle } from "lucide-react";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import BottomNav from "@/components/BottomNav";
import Toast from "@/components/Toast";
import { useAddMemory, useAddSoundtrack, useMemories, useSoundtracks } from "@/hooks/useData";
import { getSupabase } from "@/lib/supabase";
import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/youtube";
import { extractPhotoMetadata, formatPhotoDate } from "@/lib/exifUtils";

type TabType = "photo" | "music";
type MusicTypeChoice = "youtube" | "mp3";

export default function AddPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>("photo");
    const [toast, setToast] = useState({ visible: false, message: "", type: "success" as "success" | "error" });

    const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast({ visible: false, message: "", type: "success" }), 3000);
    }, []);

    return (
        <div className="flex flex-col h-dvh bg-background relative overflow-hidden">
            <BackgroundOrbs />

            <div className="flex-1 flex flex-col relative z-10 h-full">
                {/* Header */}
                <div className="px-6 pt-12 pb-6 flex items-center justify-between">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => router.back()}
                        className="size-11 flex items-center justify-center rounded-full bg-card/40 backdrop-blur-sm border border-border"
                        id="back-btn"
                    >
                        <ArrowLeft className="size-6 text-foreground" />
                    </motion.button>
                    <h1 className="text-2xl font-[var(--font-dm-serif)] text-foreground tracking-tight">
                        Add New Surprise
                    </h1>
                    <div className="size-11" />
                </div>

                {/* Tabs */}
                <div className="flex-1 px-6 flex flex-col gap-6 pb-24 overflow-y-auto custom-scrollbar">
                    <div className="flex gap-4">
                        <TabButton
                            icon={<Camera className="size-8" />}
                            label="Upload Photo"
                            active={activeTab === "photo"}
                            onClick={() => setActiveTab("photo")}
                        />
                        <TabButton
                            icon={<Video className="size-8" />}
                            label="Add Music"
                            active={activeTab === "music"}
                            onClick={() => setActiveTab("music")}
                        />
                    </div>

                    <AnimatePresence mode="wait">
                        {activeTab === "photo" ? (
                            <motion.div
                                key="photo"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <PhotoForm showToast={showToast} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="music"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <MusicForm showToast={showToast} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <BottomNav />
            <Toast message={toast.message} visible={toast.visible} type={toast.type} />
        </div>
    );
}

/* ═══════════════════════════════════════
   Tab Button
   ═══════════════════════════════════════ */
function TabButton({
    icon,
    label,
    active,
    onClick,
}: {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`flex-1 flex flex-col items-center justify-center gap-2 p-5 rounded-3xl transition-all ${active
                ? "bg-primary shadow-lg shadow-primary/20 text-primary-foreground"
                : "bg-card/60 backdrop-blur-md border border-border text-muted-foreground"
                }`}
        >
            {icon}
            <span className="text-sm font-semibold">{label}</span>
        </motion.button>
    );
}

/* ═══════════════════════════════════════
   Photo Form
   ═══════════════════════════════════════ */
function PhotoForm({ showToast }: { showToast: (msg: string, t?: "success" | "error") => void }) {
    const addMemory = useAddMemory();
    const { data: existingMemories = [] } = useMemories();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [caption, setCaption] = useState("");
    const [forceDaily, setForceDaily] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [photoDate, setPhotoDate] = useState<string | undefined>();
    const [photoLocation, setPhotoLocation] = useState<string | undefined>();
    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        setDuplicateWarning(null);
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result as string);
        reader.readAsDataURL(f);

        // Extract EXIF metadata
        try {
            const meta = await extractPhotoMetadata(f);
            if (meta.date) {
                const isoDate = meta.date.toISOString();
                setPhotoDate(isoDate);

                // Check for duplicate by EXIF date (same day = likely same photo)
                const photoDay = isoDate.slice(0, 10); // YYYY-MM-DD
                const duplicate = existingMemories.find(m => {
                    if (!m.photo_date) return false;
                    return m.photo_date.slice(0, 10) === photoDay;
                });
                if (duplicate) {
                    setDuplicateWarning(
                        `⚠️ Une photo du même jour (${new Date(isoDate).toLocaleDateString("fr-FR")}) est déjà dans le coffre${duplicate.caption ? ` : "${duplicate.caption}"` : ""}`
                    );
                }
            }
            if (meta.location) setPhotoLocation(meta.location);
        } catch (err) {
            console.warn("EXIF extraction failed:", err);
        }
    };

    const handleSubmit = async () => {
        if (!file) {
            showToast("Please select a photo first", "error");
            return;
        }

        setUploading(true);
        try {
            // Upload to Supabase Storage (bucket: vault, folder: photos/)
            const ext = file.name.split(".").pop();
            const fileName = `photos/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
            const sb = getSupabase();
            const { error: uploadError } = await sb.storage
                .from("vault")
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: urlData } = sb.storage
                .from("vault")
                .getPublicUrl(fileName);

            await addMemory.mutateAsync({
                image_url: urlData.publicUrl,
                caption,
                is_daily_pick: forceDaily,
                photo_date: photoDate,
                photo_location: photoLocation,
            });

            showToast("Photo added to your collection! 📸");
            setPreview(null);
            setFile(null);
            setCaption("");
            setForceDaily(false);
            setPhotoDate(undefined);
            setPhotoLocation(undefined);
        } catch (err) {
            console.error(err);
            showToast("Failed to upload photo. Please try again.", "error");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 rounded-[32px] bg-card/80 backdrop-blur-md shadow-xl border border-white/50">
            {/* Upload area */}
            <div
                onClick={() => fileInputRef.current?.click()}
                className="relative cursor-pointer group"
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="photo-upload"
                />
                {preview ? (
                    <div className="w-full h-56 rounded-2xl overflow-hidden bg-muted">
                        <img
                            src={preview}
                            alt="Preview"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    </div>
                ) : (
                    <div className="w-full h-56 rounded-2xl bg-input border-2 border-dashed border-border flex flex-col items-center justify-center gap-3 group-hover:border-primary/40 transition-colors">
                        <Upload className="size-10 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground font-medium">Tap to select a photo</p>
                    </div>
                )}
            </div>

            {/* Duplicate warning */}
            <AnimatePresence>
                {duplicateWarning && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300"
                    >
                        <AlertTriangle className="size-5 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium">{duplicateWarning}</p>
                            <p className="text-xs mt-1 opacity-70">Tu peux quand même l'ajouter si tu le souhaites.</p>
                        </div>
                        <button onClick={() => setDuplicateWarning(null)} className="text-xs opacity-60 hover:opacity-100">✕</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Caption */}
            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    Caption
                </label>
                <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="A lovely memory..."
                    className="w-full bg-input rounded-2xl px-4 py-4 text-foreground font-medium border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
                    id="photo-caption"
                />
            </div>

            {/* Force daily toggle */}
            <div className="flex items-center justify-between py-2 border-t border-border/50">
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">
                        Force as Today&apos;s Surprise
                    </span>
                    <span className="text-xs text-muted-foreground">
                        This will override the current reveal
                    </span>
                </div>
                <button
                    onClick={() => setForceDaily(!forceDaily)}
                    className={`toggle-switch ${forceDaily ? "active" : ""}`}
                    id="force-photo-toggle"
                    role="switch"
                    aria-checked={forceDaily}
                />
            </div>

            {/* Submit */}
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={uploading || !file}
                className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                id="submit-photo"
            >
                {uploading ? (
                    <>
                        <Loader2 className="size-5 animate-spin" />
                        Uploading...
                    </>
                ) : (
                    "Add to Collection"
                )}
            </motion.button>
        </div>
    );
}

/* ═══════════════════════════════════════
   Music Form
   ═══════════════════════════════════════ */
function MusicForm({ showToast }: { showToast: (msg: string, t?: "success" | "error") => void }) {
    const addSoundtrack = useAddSoundtrack();
    const { data: existingSoundtracks = [] } = useSoundtracks();
    const [musicType, setMusicType] = useState<MusicTypeChoice>("youtube");
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [forceDaily, setForceDaily] = useState(false);
    const [mp3File, setMp3File] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

    const youtubeId = youtubeUrl ? extractYouTubeId(youtubeUrl) : null;
    const [fetchingMeta, setFetchingMeta] = useState(false);

    // Auto-fill metadata when YouTube URL is valid
    useEffect(() => {
        if (youtubeId && !title && !artist) {
            const fetchMeta = async () => {
                setFetchingMeta(true);
                setDuplicateWarning(null);
                let fetchedTitle = "";
                try {
                    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`);
                    if (res.ok) {
                        const data = await res.json();
                        fetchedTitle = data.title || "";
                        setTitle(fetchedTitle);
                        setArtist(data.author_name || "");
                        showToast("Metadata found! 🎵", "success");
                    }
                } catch (e) {
                    console.error("Failed to fetch youtube meta", e);
                } finally {
                    setFetchingMeta(false);
                }

                // 1) Check for duplicate by YouTube video ID
                const idDup = existingSoundtracks.find(s => {
                    if (s.type !== "youtube") return false;
                    const existingId = extractYouTubeId(s.src_url);
                    return existingId === youtubeId;
                });
                if (idDup) {
                    setDuplicateWarning(
                        `⚠️ Cette musique est déjà dans le coffre : "${idDup.title}" par ${idDup.artist}`
                    );
                } else if (fetchedTitle) {
                    // 2) Cross-check by title against ALL sources (YouTube + MP3)
                    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\u00e0-\u00ff]/g, "");
                    const normalizedTitle = normalize(fetchedTitle);
                    const titleDup = existingSoundtracks.find(s => {
                        const existingNorm = normalize(s.title);
                        return existingNorm === normalizedTitle ||
                            (normalizedTitle.length > 5 && existingNorm.includes(normalizedTitle)) ||
                            (existingNorm.length > 5 && normalizedTitle.includes(existingNorm));
                    });
                    if (titleDup) {
                        setDuplicateWarning(
                            `⚠️ Un titre similaire existe déjà : "${titleDup.title}" par ${titleDup.artist} (${titleDup.type === "youtube" ? "YouTube" : "MP3"})`
                        );
                    }
                }
            };
            fetchMeta();
        }
    }, [youtubeId, title, artist, showToast, existingSoundtracks]);

    const handleSubmit = async () => {
        if (!title.trim()) {
            showToast("Please add a song title", "error");
            return;
        }

        setUploading(true);
        try {
            let src_url = "";

            if (musicType === "youtube") {
                if (!youtubeId) {
                    showToast("Invalid YouTube URL", "error");
                    setUploading(false);
                    return;
                }
                src_url = youtubeUrl;
            } else {
                if (!mp3File) {
                    showToast("Please select an MP3 file", "error");
                    setUploading(false);
                    return;
                }
                const fileName = `musique/${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`;
                const sb = getSupabase();
                const { error: uploadError } = await sb.storage
                    .from("vault")
                    .upload(fileName, mp3File);

                if (uploadError) throw uploadError;

                const { data: urlData } = sb.storage
                    .from("vault")
                    .getPublicUrl(fileName);

                src_url = urlData.publicUrl;
            }

            await addSoundtrack.mutateAsync({
                title,
                artist,
                type: musicType,
                src_url,
                is_daily_pick: forceDaily,
            });

            showToast("Song added to your collection! 🎵");
            setYoutubeUrl("");
            setTitle("");
            setArtist("");
            setMp3File(null);
            setForceDaily(false);
        } catch (err) {
            console.error(err);
            showToast("Failed to add song. Please try again.", "error");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 rounded-[32px] bg-card/80 backdrop-blur-md shadow-xl border border-white/50">
            {/* Music type tabs */}
            <div className="flex gap-3">
                <button
                    onClick={() => setMusicType("youtube")}
                    className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-all ${musicType === "youtube"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-input text-muted-foreground"
                        }`}
                    id="music-type-youtube"
                >
                    YouTube Link
                </button>
                <button
                    onClick={() => setMusicType("mp3")}
                    className={`flex-1 py-3 rounded-2xl text-sm font-semibold transition-all ${musicType === "mp3"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-input text-muted-foreground"
                        }`}
                    id="music-type-mp3"
                >
                    Upload MP3
                </button>
            </div>

            <AnimatePresence mode="wait">
                {musicType === "youtube" ? (
                    <motion.div
                        key="yt"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col gap-4"
                    >
                        {/* YouTube URL input */}
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                                YouTube URL
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={youtubeUrl}
                                    onChange={(e) => setYoutubeUrl(e.target.value)}
                                    placeholder="https://youtube.com/watch?v=..."
                                    className="w-full bg-input rounded-2xl px-4 py-4 pr-12 text-foreground font-medium border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
                                    id="youtube-url-input"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                    <LinkIcon className="size-5 text-primary" />
                                </div>
                            </div>
                        </div>

                        {/* Duplicate warning */}
                        <AnimatePresence>
                            {duplicateWarning && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, height: 0 }}
                                    animate={{ opacity: 1, y: 0, height: "auto" }}
                                    exit={{ opacity: 0, y: -10, height: 0 }}
                                    className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300"
                                >
                                    <AlertTriangle className="size-5 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{duplicateWarning}</p>
                                        <p className="text-xs mt-1 opacity-70">Tu peux quand même l'ajouter si tu le souhaites.</p>
                                    </div>
                                    <button onClick={() => setDuplicateWarning(null)} className="text-xs opacity-60 hover:opacity-100">✕</button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* YouTube preview */}
                        {youtubeId && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-background/40 rounded-2xl p-3 border border-border"
                            >
                                <div className="flex gap-3">
                                    <div className="relative w-24 h-16 rounded-xl overflow-hidden bg-muted">
                                        <img
                                            src={getYouTubeThumbnail(youtubeId)}
                                            alt="Video thumbnail"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                            <div className="size-5 bg-white/90 rounded-full flex items-center justify-center">
                                                <div className="w-0 h-0 ml-0.5 border-l-[6px] border-l-primary border-y-[4px] border-y-transparent" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center min-w-0">
                                        <h4 className="text-sm font-bold text-foreground truncate">
                                            YouTube Video Preview
                                        </h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">YouTube • Ready to add</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                ) : (
                    <motion.div
                        key="mp3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col gap-4"
                    >
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                                MP3 File
                            </label>
                            <label className="w-full bg-input rounded-2xl px-4 py-4 text-muted-foreground font-medium border border-border cursor-pointer flex items-center gap-3 hover:border-primary/40 transition-colors">
                                <Upload className="size-5" />
                                <span className="truncate">{mp3File ? mp3File.name : "Choose an MP3 file..."}</span>
                                <input
                                    type="file"
                                    accept="audio/mpeg,audio/mp3"
                                    onChange={(e) => setMp3File(e.target.files?.[0] || null)}
                                    className="hidden"
                                    id="mp3-upload"
                                />
                            </label>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Song title & artist */}
            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    Song Title
                </label>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Our favourite song..."
                    className="w-full bg-input rounded-2xl px-4 py-4 text-foreground font-medium border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
                    id="song-title"
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">
                    Artist
                </label>
                <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="Ed Sheeran..."
                    className="w-full bg-input rounded-2xl px-4 py-4 text-foreground font-medium border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50"
                    id="song-artist"
                />
            </div>

            {/* Force daily toggle */}
            <div className="flex items-center justify-between py-2 border-t border-border/50">
                <div className="flex flex-col">
                    <span className="text-sm font-semibold text-foreground">
                        Force as Today&apos;s Surprise
                    </span>
                    <span className="text-xs text-muted-foreground">
                        This will override the current reveal
                    </span>
                </div>
                <button
                    onClick={() => setForceDaily(!forceDaily)}
                    className={`toggle-switch ${forceDaily ? "active" : ""}`}
                    id="force-song-toggle"
                    role="switch"
                    aria-checked={forceDaily}
                />
            </div>

            {/* Submit */}
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={uploading || !title.trim()}
                className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                id="submit-song"
            >
                {uploading ? (
                    <>
                        <Loader2 className="size-5 animate-spin" />
                        Adding...
                    </>
                ) : (
                    "Add to Collection"
                )}
            </motion.button>
        </div>
    );
}
