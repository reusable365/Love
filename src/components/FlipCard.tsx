"use client";

import { useState, useRef, ReactNode } from "react";
import { differenceInDays } from "date-fns";
import { PenLine, Save, X } from "lucide-react";
import LandscapePhoto from "./LandscapePhoto";
import { Memory } from "@/lib/supabase";
import { getQuoteForMemory } from "@/lib/quotes";

import { parseMemoryData } from "@/lib/memoryNotes";
import { CoupleUser } from "@/lib/useCoupleUser";

interface FlipCardProps {
    memory: Memory;
    children?: ReactNode;

    // Editing Props (legacy or general)
    isEditing?: boolean;
    captionDraft?: string;
    onCaptionChange?: (val: string) => void;
    onEditToggle?: () => void;
    onSave?: () => void;
    onDoubleTap?: (e: React.MouseEvent) => void;
    onFrontClick?: (e: React.MouseEvent) => void;

    // Couple notes
    activeUser?: CoupleUser | null;
    onSaveNote?: (note: string, partner: CoupleUser) => void;
}

export function FlipCard({
    memory,
    children,
    isEditing = false,
    captionDraft = "",
    onCaptionChange,
    onEditToggle,
    onSave,
    onDoubleTap,
    onFrontClick,
    activeUser,
    onSaveNote
}: FlipCardProps) {
    const [isFlipped, setIsFlipped] = useState(false);
    const [editingPartner, setEditingPartner] = useState<CoupleUser | null>(null);
    const [draftNote, setDraftNote] = useState("");

    // Guard: prevent flip right after pen click
    const justClickedPen = useRef(false);

    // Fallback quote
    const fallbackQuote = getQuoteForMemory(memory.id);
    const parsed = parseMemoryData(memory.caption, fallbackQuote);

    // Start Date: 10 Feb 2002
    const startDate = new Date(2002, 1, 10);
    const today = new Date();
    const daysCount = differenceInDays(today, startDate);

    const lastTapRef = useRef(0);
    const flipTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Flip to BACK (only from front face)
    const handleFrontClick = (e: React.MouseEvent) => {
        // Ignore clicks from interactive elements
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('a') || target.closest('[data-interactive]')) return;

        const now = Date.now();
        const timeSinceLastTap = now - lastTapRef.current;
        lastTapRef.current = now;

        if (timeSinceLastTap < 300) {
            // DOUBLE TAP!
            if (flipTimeoutRef.current) {
                clearTimeout(flipTimeoutRef.current);
                flipTimeoutRef.current = null;
            }
            onDoubleTap?.(e);
            return;
        }

        // SINGLE TAP (potential flip)
        onFrontClick?.(e);

        if (!justClickedPen.current) {
            // Delay the flip to see if a second tap comes in
            flipTimeoutRef.current = setTimeout(() => {
                setIsFlipped(true);
                flipTimeoutRef.current = null;
            }, 320);
        }
        justClickedPen.current = false;
    };

    // Flip to FRONT (only from back face, and only if NOT editing)
    const handleBackClick = () => {
        if (!isEditing && !editingPartner && !justClickedPen.current) {
            setIsFlipped(false);
        }
        justClickedPen.current = false;
    };

    return (
        <div
            className="relative h-full w-full group cursor-pointer"
            style={{ perspective: "1200px" }}
        >
            {/* Inner container - pure CSS transition */}
            <div
                style={{
                    transformStyle: "preserve-3d",
                    transition: "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                }}
                className="relative h-full w-full"
            >
                {/* ═══ FRONT ═══ */}
                <div
                    className="absolute inset-0 bg-black overflow-hidden rounded-[32px]"
                    style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        pointerEvents: isFlipped ? "none" : "auto",
                    }}
                    onClick={handleFrontClick}
                >
                    <LandscapePhoto
                        src={memory.image_url}
                        alt={parsed.quote || memory.caption}
                        wrapperClassName="pointer-events-none"
                    />
                    {/* Front overlay (children: days counter, slideshow btn, partner status, etc) */}
                    <div className="absolute inset-0 z-10">
                        {children}
                    </div>
                </div>

                {/* ═══ BACK ═══ */}
                <div
                    className="absolute inset-0 h-full w-full text-white flex flex-col items-center justify-between p-6 text-center overflow-y-auto rounded-[32px] cursor-default custom-scrollbar"
                    style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        backgroundColor: "#0f0d0c",
                        pointerEvents: isFlipped ? "auto" : "none",
                    }}
                    onClick={handleBackClick}
                >
                    {/* Blurred BG — photo visible through blur */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <img
                            src={memory.image_url}
                            alt=""
                            className="h-full w-full object-cover"
                            style={{ filter: "blur(20px)", transform: "scale(1.2)", opacity: 0.9 }}
                        />
                        <div className="absolute inset-0 bg-black/40" />
                    </div>

                    {/* Header / Quote */}
                    <div className="relative z-10 flex flex-col items-center gap-1.5 max-w-md w-full pt-1">
                        <div className="text-[10px] tracking-[0.3em] uppercase text-white/40 font-bold">
                            Good Vibe
                        </div>
                        <div
                            className="text-2xl md:text-3xl leading-snug text-white/95 drop-shadow px-2"
                            style={{ fontFamily: "'Caveat', cursive" }}
                        >
                            &ldquo;{parsed.quote}&rdquo;
                        </div>
                    </div>

                    {/* Couple Notes (Stéphane & Caroline) */}
                    <div className="relative z-10 w-full max-w-sm flex flex-col gap-2.5 my-2">
                        {/* Stéphane Note */}
                        <div className="rounded-2xl p-3 bg-black/40 backdrop-blur-md border border-white/10 text-left">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#E8B4A6] flex items-center gap-1">
                                    👑 Mot de Stéphane
                                </span>
                                {activeUser === "stephane" && editingPartner !== "stephane" && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            justClickedPen.current = true;
                                            setDraftNote(parsed.note_stephane);
                                            setEditingPartner("stephane");
                                        }}
                                        className="text-[10px] bg-white/10 hover:bg-white/20 px-2.5 py-0.5 rounded-full text-white/90 transition flex items-center gap-1"
                                    >
                                        <PenLine size={10} />
                                        {parsed.note_stephane ? "Modifier" : "Écrire"}
                                    </button>
                                )}
                            </div>
                            {editingPartner === "stephane" ? (
                                <div onClick={(e) => e.stopPropagation()} className="flex flex-col gap-2 mt-1">
                                    <textarea
                                        value={draftNote}
                                        onChange={(e) => setDraftNote(e.target.value)}
                                        placeholder="Écris ton mot doux pour Caroline..."
                                        className="w-full bg-white/10 text-[#E8B4A6] font-[var(--font-caveat)] text-xl p-2.5 rounded-xl border border-white/20 focus:outline-none resize-none leading-relaxed"
                                        rows={3}
                                        maxLength={280}
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setEditingPartner(null)}
                                            className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-white/70"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onSaveNote?.(draftNote, "stephane");
                                                setEditingPartner(null);
                                            }}
                                            className="text-xs px-4 py-1 bg-[#E8B4A6] text-[#422B26] font-extrabold rounded-full flex items-center gap-1 shadow-md hover:scale-105 transition"
                                        >
                                            <Save size={12} />
                                            Enregistrer
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="font-[var(--font-caveat)] text-xl text-white/95 leading-relaxed min-h-[1.5rem]">
                                    {parsed.note_stephane ? (
                                        parsed.note_stephane
                                    ) : (
                                        <span className="text-xs font-sans text-white/40 italic">
                                            {activeUser === "stephane" ? "Clique sur 'Écrire' pour laisser un mot doux à Caroline" : "Pas encore de mot de Stéphane aujourd'hui"}
                                        </span>
                                    )}
                                </p>
                            )}
                        </div>

                        {/* Caroline Note */}
                        <div className="rounded-2xl p-3 bg-black/40 backdrop-blur-md border border-white/10 text-left">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-pink-300 flex items-center gap-1">
                                    🌸 Réponse de Caroline
                                </span>
                                {activeUser === "caroline" && editingPartner !== "caroline" && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            justClickedPen.current = true;
                                            setDraftNote(parsed.note_caroline);
                                            setEditingPartner("caroline");
                                        }}
                                        className="text-[10px] bg-white/10 hover:bg-white/20 px-2.5 py-0.5 rounded-full text-white/90 transition flex items-center gap-1"
                                    >
                                        <PenLine size={10} />
                                        {parsed.note_caroline ? "Modifier" : "Répondre"}
                                    </button>
                                )}
                            </div>
                            {editingPartner === "caroline" ? (
                                <div onClick={(e) => e.stopPropagation()} className="flex flex-col gap-2 mt-1">
                                    <textarea
                                        value={draftNote}
                                        onChange={(e) => setDraftNote(e.target.value)}
                                        placeholder="Écris ton mot doux pour Stéphane..."
                                        className="w-full bg-white/10 text-pink-200 font-[var(--font-caveat)] text-xl p-2.5 rounded-xl border border-white/20 focus:outline-none resize-none leading-relaxed"
                                        rows={3}
                                        maxLength={280}
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setEditingPartner(null)}
                                            className="text-xs px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-white/70"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onSaveNote?.(draftNote, "caroline");
                                                setEditingPartner(null);
                                            }}
                                            className="text-xs px-4 py-1 bg-pink-400 text-white font-extrabold rounded-full flex items-center gap-1 shadow-md hover:scale-105 transition"
                                        >
                                            <Save size={12} />
                                            Enregistrer
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="font-[var(--font-caveat)] text-xl text-white/95 leading-relaxed min-h-[1.5rem]">
                                    {parsed.note_caroline ? (
                                        parsed.note_caroline
                                    ) : (
                                        <span className="text-xs font-sans text-white/40 italic">
                                            {activeUser === "caroline" ? "Clique sur 'Répondre' pour laisser un mot doux à Stéphane" : "Pas encore de mot de Caroline aujourd'hui"}
                                        </span>
                                    )}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Footer Journey */}
                    <div className="relative z-10 flex flex-col items-center gap-0.5 pb-1">
                        <div className="text-[9px] tracking-[0.2em] uppercase text-white/30">
                            Journey
                        </div>
                        <div className="font-[var(--font-dm-serif)] text-3xl md:text-4xl text-white/90 leading-tight">
                            {daysCount}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-[#E8B4A6]/60 font-medium">
                            days together
                        </div>
                        <div className="w-10 h-0.5 bg-[#E8B4A6]/30 mt-1 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}
