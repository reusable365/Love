"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface ToastProps {
    message: string;
    visible: boolean;
    type?: "success" | "error" | "info";
}

const icons = {
    success: <CheckCircle className="size-6 text-accent" />,
    error: <XCircle className="size-6 text-destructive" />,
    info: <AlertCircle className="size-6 text-accent" />,
};

export default function Toast({ message, visible, type = "success" }: ToastProps) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] px-6 w-full max-w-md pointer-events-none"
                >
                    <div className="bg-foreground text-background rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3">
                        {icons[type]}
                        <p className="text-sm font-medium flex-1">{message}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
