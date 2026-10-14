"use client";

import { useEffect, useRef } from "react";

interface ConfettiHeartsProps {
    active: boolean;
    duration?: number;
}

interface Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    opacity: number;
    rotation: number;
    rotationSpeed: number;
    color: string;
    char: string;
}

export default function ConfettiHearts({ active, duration = 4000 }: ConfettiHeartsProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (!active) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationFrameId: number;
        let isRunning = true;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: Particle[] = [];
        const emojis = ["❤️", "🩷", "💖", "✨", "💍", "🌸", "🥂", "⭐"];
        const colors = ["#E8B4A6", "#F472B6", "#EC4899", "#FBBF24", "#F59E0B"];

        const particleCount = 60;
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: canvas.width / 2 + (Math.random() - 0.5) * 150,
                y: canvas.height * 0.7,
                size: Math.random() * 16 + 14,
                speedX: (Math.random() - 0.5) * 10,
                speedY: -(Math.random() * 12 + 6),
                opacity: 1,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                char: emojis[Math.floor(Math.random() * emojis.length)],
            });
        }

        const render = () => {
            if (!isRunning) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            let aliveCount = 0;
            particles.forEach((p) => {
                p.x += p.speedX;
                p.y += p.speedY;
                p.speedY += 0.25; // gravity
                p.speedX *= 0.98; // air drag
                p.rotation += p.rotationSpeed;
                p.opacity -= 0.007;

                if (p.opacity > 0 && p.y < canvas.height + 50) {
                    aliveCount++;
                    ctx.save();
                    ctx.translate(p.x, p.y);
                    ctx.rotate((p.rotation * Math.PI) / 180);
                    ctx.globalAlpha = Math.max(0, p.opacity);
                    ctx.font = `${p.size}px serif`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.fillText(p.char, 0, 0);
                    ctx.restore();
                }
            });

            if (aliveCount > 0) {
                animationFrameId = requestAnimationFrame(render);
            }
        };

        render();

        const timer = setTimeout(() => {
            isRunning = false;
        }, duration);

        return () => {
            isRunning = false;
            cancelAnimationFrame(animationFrameId);
            clearTimeout(timer);
        };
    }, [active, duration]);

    if (!active) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[80]"
            style={{ width: "100%", height: "100%" }}
        />
    );
}
