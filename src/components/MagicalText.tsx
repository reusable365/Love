"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

/**
 * A curated list of bilingual love notes / inspiring greetings.
 * Mix of French & English.
 */
const GREETINGS = [
    "Good morning, my love.",
    "Bonjour, mon amour.",
    "Ready to make magic?",
    "Prêt pour un peu de magie ?",
    "Thinking of you...",
    "Une douce pensée pour toi...",
    "You are my sunshine.",
    "Tu es mon rayon de soleil.",
    "Today is yours.",
    "Cette journée est à toi.",
    "Love is in the air.",
    "L'amour est dans l'air.",
    "Smile, beautiful.",
    "Souris, la vie est belle.",
    "Capturing the moment.",
    "L'instant présent.",
];

interface MagicalTextProps {
    className?: string;
}

export default function MagicalText({ className = "" }: MagicalTextProps) {
    // Select a greeting based on the current date (consistent all day)
    const greeting = useMemo(() => {
        const today = new Date();
        // Use date string as seed: "2023-10-27"
        const seedString = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

        // Simple hash function for the seed
        let hash = 0;
        for (let i = 0; i < seedString.length; i++) {
            hash = (hash << 5) - hash + seedString.charCodeAt(i);
            hash |= 0; // Convert to 32bit integer
        }

        const index = Math.abs(hash) % GREETINGS.length;
        return GREETINGS[index];
    }, []);

    // Split text into words for stagger effect
    const words = greeting.split(" ");

    return (
        <h1 className={`text-2xl font-[var(--font-dm-serif)] text-white tracking-tight leading-tight text-center drop-shadow-lg ${className}`}>
            {words.map((word, i) => (
                <motion.span
                    key={i}
                    className="inline-block mr-1.5 last:mr-0"
                    initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{
                        duration: 0.8,
                        delay: 0.2 + i * 0.1, // Stagger effect
                        ease: [0.2, 0.65, 0.3, 0.9],
                    }}
                >
                    {word}
                </motion.span>
            ))}
            <br />
            <motion.span
                className="block text-sm text-white/80 mt-1 font-sans font-normal tracking-widest uppercase"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 1 }}
            >
                Today&apos;s surprise...
            </motion.span>
        </h1>
    );
}
