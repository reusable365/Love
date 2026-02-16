"use client";

import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

export default function BottomNav() {
    const router = useRouter();
    const pathname = usePathname();
    const [dateStr, setDateStr] = useState("");

    useEffect(() => {
        // Format: "16/02/26"
        const now = new Date();
        const formatted = now.toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
        });
        setDateStr(formatted);
    }, []);

    const isVaultActive = pathname === "/vault";

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe pointer-events-none">
            {/* 
                We use pointer-events-none on container so clicks pass through to content 
                (like the card) in the empty areas. 
                Elements inside must have pointer-events-auto.
            */}

            {/* Gradient Mask for bottom fade */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />

            <div className="relative flex justify-between items-end px-8 pb-6 max-w-lg mx-auto w-full h-24 pointer-events-auto">

                {/* LEFT: Date (Clickable -> Home) */}
                <div className="w-24 flex flex-col justify-end items-start pb-1">
                    <button
                        onClick={() => router.push("/")}
                        className="font-mono text-sm tracking-widest text-[#8E5B5B]/70 font-bold hover:text-[#8E5B5B] transition-colors"
                    >
                        {dateStr}
                    </button>
                </div>

                {/* CENTER: Add Button */}
                <div className="flex-1 flex justify-center relative">
                    <button
                        onClick={() => router.push("/add")}
                        className="relative -top-4 group"
                    >
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-[#8E5B5B]/30 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500" />

                        <motion.div
                            whileTap={{ scale: 0.9 }}
                            whileHover={{ scale: 1.05 }}
                            className="relative size-16 rounded-full bg-[#8E5B5B] text-[#F5E6E0] shadow-2xl flex items-center justify-center ring-4 ring-white/10"
                        >
                            <Plus className="size-8" strokeWidth={2} />
                        </motion.div>
                    </button>
                </div>

                {/* RIGHT: Souvenirs Link */}
                <div className="w-24 flex flex-col justify-end items-end pb-1">
                    <button
                        onClick={() => router.push("/vault")}
                        className="group flex flex-col items-end gap-1"
                    >
                        <span className={`text-[10px] font-bold tracking-[0.2em] uppercase transition-colors ${isVaultActive ? "text-[#8E5B5B]" : "text-[#8E5B5B]/60 group-hover:text-[#8E5B5B]"
                            }`}>
                            Souvenirs
                        </span>
                        {isVaultActive && (
                            <motion.div
                                layoutId="nav-dot"
                                className="size-1.5 rounded-full bg-[#8E5B5B]"
                            />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
