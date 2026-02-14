"use client";

import { motion } from "framer-motion";
import { Heart, Sparkles, Calendar } from "lucide-react";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import BottomNav from "@/components/BottomNav";

export default function ProfilePage() {
    return (
        <div className="flex flex-col h-dvh bg-background relative overflow-hidden">
            <BackgroundOrbs />

            <div className="flex-1 flex flex-col relative z-10 items-center justify-center px-8 text-center">
                <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="mb-8"
                >
                    <div className="size-28 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                        <Heart className="size-14 text-primary" fill="currentColor" />
                    </div>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-3xl font-[var(--font-dm-serif)] text-foreground mb-3"
                >
                    Eternal Memories
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-muted-foreground text-sm max-w-xs mb-8"
                >
                    Your shared love diary. A new surprise every morning, forever.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex gap-6"
                >
                    <div className="flex flex-col items-center gap-1">
                        <div className="glass-light rounded-2xl p-4 shadow-sm">
                            <Sparkles className="size-6 text-primary" />
                        </div>
                        <span className="text-xs text-muted-foreground mt-1">NFC Ready</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <div className="glass-light rounded-2xl p-4 shadow-sm">
                            <Calendar className="size-6 text-primary" />
                        </div>
                        <span className="text-xs text-muted-foreground mt-1">Since Feb 14</span>
                    </div>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-12 text-xs text-muted-foreground/60"
                >
                    Made with ❤️ for you
                </motion.p>
            </div>

            <BottomNav />
        </div>
    );
}
