"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Gift, ShieldCheck, Plus, UserCircle } from "lucide-react";

const tabs = [
    { href: "/", icon: Gift, label: "Daily Reveal", activeIcon: Gift },
    { href: "/vault", icon: ShieldCheck, label: "The Vault", activeIcon: ShieldCheck },
    { href: "/add", icon: Plus, label: "Add", isCenter: true, activeIcon: Plus },
    { href: "/profile", icon: UserCircle, label: "Profile", activeIcon: UserCircle },
];

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border z-50 pb-safe">
            <div className="flex justify-around items-center h-16 px-2 max-w-lg mx-auto">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    const Icon = tab.icon;

                    if (tab.isCenter) {
                        return (
                            <button
                                key={tab.href}
                                id={`nav-${tab.label.toLowerCase().replace(/\s+/g, "-")}`}
                                onClick={() => router.push(tab.href)}
                                className="relative -mt-6"
                            >
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    className="size-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 flex items-center justify-center"
                                >
                                    <Icon className="size-7" strokeWidth={2} />
                                </motion.div>
                            </button>
                        );
                    }

                    return (
                        <button
                            key={tab.href}
                            id={`nav-${tab.label.toLowerCase().replace(/\s+/g, "-")}`}
                            onClick={() => router.push(tab.href)}
                            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Icon className="size-6" strokeWidth={isActive ? 2.5 : 1.5} />
                            <span className="text-[10px] font-medium">{tab.label}</span>
                            {isActive && (
                                <motion.div
                                    layoutId="nav-indicator"
                                    className="absolute bottom-1 w-1 h-1 rounded-full bg-primary"
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
