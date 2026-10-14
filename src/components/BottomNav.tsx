"use client";

import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useCoupleUser } from "@/lib/useCoupleUser";

export default function BottomNav() {
    const router = useRouter();
    const pathname = usePathname();
    const { userEmoji } = useCoupleUser();
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

    const isHomeActive = pathname === "/";
    const isVaultActive = pathname === "/vault";
    const isProfileActive = pathname === "/profile";

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 pb-safe pointer-events-none">
            {/* Gradient Mask for bottom fade */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />

            <div className="relative flex justify-between items-end px-6 pb-6 max-w-lg mx-auto w-full h-24 pointer-events-auto">

                {/* LEFT: Date (Clickable -> Home) */}
                <div className="flex flex-col justify-end items-start pb-1">
                    <button
                        onClick={() => router.push("/")}
                        className={`group flex flex-col items-start gap-1 font-mono text-sm tracking-widest font-bold transition-colors ${
                            isHomeActive ? "text-[#8E5B5B]" : "text-[#8E5B5B]/60 hover:text-[#8E5B5B]"
                        }`}
                    >
                        <span>{dateStr}</span>
                        {isHomeActive && (
                            <motion.div
                                layoutId="nav-dot"
                                className="size-1.5 rounded-full bg-[#8E5B5B]"
                            />
                        )}
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

                {/* RIGHT: Souvenirs & Profil Links */}
                <div className="flex items-end justify-end gap-4 pb-1">
                    <button
                        onClick={() => router.push("/vault")}
                        className="group flex flex-col items-center gap-1"
                    >
                        <span className={`text-[10px] font-bold tracking-[0.15em] uppercase transition-colors ${
                            isVaultActive ? "text-[#8E5B5B]" : "text-[#8E5B5B]/60 group-hover:text-[#8E5B5B]"
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

                    <button
                        onClick={() => router.push("/profile")}
                        className="group flex flex-col items-center gap-1"
                    >
                        <span className={`text-[10px] font-bold tracking-[0.15em] uppercase transition-colors flex items-center gap-1 ${
                            isProfileActive ? "text-[#8E5B5B]" : "text-[#8E5B5B]/60 group-hover:text-[#8E5B5B]"
                        }`}>
                            <span>{userEmoji || "❤️"}</span>
                            <span>Profil</span>
                        </span>
                        {isProfileActive && (
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
