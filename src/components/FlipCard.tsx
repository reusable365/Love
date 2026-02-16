"use client";

import { useState, ReactNode } from "react";
import { differenceInDays } from "date-fns";
import { PenLine, Save, X } from "lucide-react";
import LandscapePhoto from "./LandscapePhoto";
import { Memory } from "@/lib/supabase";

interface FlipCardProps {
    memory: Memory;
    children?: ReactNode;

    // Editing Props
    isEditing?: boolean;
    captionDraft?: string;
    onCaptionChange?: (val: string) => void;
    onEditToggle?: () => void;
    onSave?: () => void;
}

export function FlipCard({
    memory,
    children,
    isEditing = false,
    captionDraft = "",
    onCaptionChange,
    onEditToggle,
    onSave
}: FlipCardProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    // Start Date: 10 Feb 2002
    const startDate = new Date(2002, 1, 10);
    const today = new Date();
    const daysCount = differenceInDays(today, startDate);

    // Handle flip click
    const handleCardClick = () => {
        if (!isEditing) {
            setIsFlipped(!isFlipped);
        }
    };

    return (
        <div
            className="relative h-full w-full group cursor-pointer"
            style={{ perspective: "1200px" }}
            onClick={handleCardClick}
        >
            {/* Inner container - pure CSS transition, NO framer-motion */}
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
                    style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                >
                    <LandscapePhoto
                        src={memory.image_url}
                        alt={memory.caption}
                        wrapperClassName="pointer-events-none"
                    />
                    {/* Front overlay (children: days counter etc) */}
                    <div className="absolute inset-0 pointer-events-none z-10">
                        {children}
                    </div>
                </div>

                {/* ═══ BACK ═══ */}
                <div
                    className="absolute inset-0 h-full w-full text-white flex flex-col items-center justify-center p-8 text-center overflow-hidden rounded-[32px] cursor-default"
                    style={{
                        backfaceVisibility: "hidden",
                        WebkitBackfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        backgroundColor: "#0f0d0c",
                    }}
                    onClick={(e) => {
                        if (isEditing) e.stopPropagation();
                    }}
                >
                    {/* Blurred BG — photo visible through blur */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <img
                            src={memory.image_url}
                            alt=""
                            className="h-full w-full object-cover"
                            style={{ filter: "blur(20px)", transform: "scale(1.2)", opacity: 0.9 }}
                        />
                        <div className="absolute inset-0 bg-black/30" />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center gap-6 max-w-md w-full">

                        {/* ✏️ PEN BUTTON — top right */}
                        {!isEditing && onEditToggle && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEditToggle();
                                }}
                                className="absolute -top-16 right-0 size-14 rounded-full bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-[#E8B4A6] shadow-2xl hover:scale-110 active:scale-95 transition-all z-50"
                                title="Écrire une note"
                            >
                                <PenLine size={24} />
                            </button>
                        )}

                        <div className="text-[10px] tracking-[0.4em] uppercase text-white/40 font-bold">
                            Good Vibe
                        </div>

                        {isEditing ? (
                            <div className="w-full flex flex-col items-center gap-6">
                                <textarea
                                    value={captionDraft}
                                    onChange={(e) => onCaptionChange?.(e.target.value)}
                                    className="w-full bg-white/5 text-[#E8B4A6] text-center font-[var(--font-caveat)] text-3xl leading-relaxed focus:outline-none resize-none rounded-2xl p-6 border border-white/10 shadow-inner min-h-[150px]"
                                    autoFocus
                                    maxLength={280}
                                    placeholder="Écris un souvenir... (max 7 lignes)"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <div className="flex gap-4">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEditToggle?.(); }}
                                        className="size-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                                    >
                                        <X size={24} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onSave?.(); }}
                                        className="px-8 py-3 rounded-full bg-[#E8B4A6] text-[#422B26] font-extrabold hover:scale-105 transition shadow-lg flex items-center gap-2"
                                    >
                                        <Save size={20} />
                                        Mémoriser
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                className="text-4xl md:text-5xl leading-tight text-white drop-shadow-2xl px-2"
                                style={{ fontFamily: "'Caveat', cursive" }}
                            >
                                &ldquo;{memory.caption || "Ajouter une note..."}&rdquo;
                            </div>
                        )}

                        {!isEditing && (
                            <div className="mt-6 flex flex-col items-center gap-1">
                                <div className="text-[10px] tracking-[0.2em] uppercase text-white/30">
                                    Journey
                                </div>
                                <div className="font-[var(--font-dm-serif)] text-4xl md:text-5xl text-white/90">
                                    {daysCount}
                                </div>
                                <div className="text-sm uppercase tracking-widest text-[#E8B4A6]/60 font-medium">
                                    days together
                                </div>
                                <div className="w-12 h-0.5 bg-[#E8B4A6]/30 mt-3 rounded-full" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
