"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { CoupleUser, PARTNER_NAMES, PARTNER_EMOJIS } from "@/lib/useCoupleUser";

interface UserSelectionModalProps {
    onSelect: (user: CoupleUser) => void;
}

export default function UserSelectionModal({ onSelect }: UserSelectionModalProps) {
    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-sm rounded-[32px] bg-card/95 border border-white/20 p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden"
            >
                {/* Decorative background glow */}
                <div className="absolute -top-12 -left-12 size-36 rounded-full bg-primary/20 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-12 -right-12 size-36 rounded-full bg-accent/20 blur-2xl pointer-events-none" />

                <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="mb-4"
                >
                    <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Heart className="size-8 fill-current" />
                    </div>
                </motion.div>

                <h2 className="text-2xl font-[var(--font-dm-serif)] text-foreground mb-2">
                    Bienvenue mon amour 💖
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                    Qui utilise ce téléphone aujourd&apos;hui ?
                </p>

                <div className="w-full flex flex-col gap-3">
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => onSelect("stephane")}
                        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold flex items-center justify-between shadow-lg shadow-primary/25 transition-all"
                    >
                        <span className="text-xl">{PARTNER_EMOJIS.stephane}</span>
                        <span className="text-lg tracking-wide">{PARTNER_NAMES.stephane}</span>
                        <span className="opacity-0">👑</span>
                    </motion.button>

                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => onSelect("caroline")}
                        className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-accent to-accent/80 text-white font-semibold flex items-center justify-between shadow-lg shadow-accent/25 transition-all"
                    >
                        <span className="text-xl">{PARTNER_EMOJIS.caroline}</span>
                        <span className="text-lg tracking-wide">{PARTNER_NAMES.caroline}</span>
                        <span className="opacity-0">🌸</span>
                    </motion.button>
                </div>

                <p className="text-[11px] text-muted-foreground/60 mt-6">
                    Tu pourras modifier ce choix à tout moment dans le Profil.
                </p>
            </motion.div>
        </div>
    );
}
