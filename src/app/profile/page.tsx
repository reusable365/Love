"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Heart, Sparkles, UserCheck, Flame, Bell, BellRing, CheckCircle2, Loader2, Eye, Trophy, Lock, Check } from "lucide-react";
import BackgroundOrbs from "@/components/BackgroundOrbs";
import BottomNav from "@/components/BottomNav";
import { useCoupleUser, PARTNER_NAMES, PARTNER_EMOJIS, CoupleUser } from "@/lib/useCoupleUser";
import { useMemories } from "@/hooks/useData";
import { differenceInDays, differenceInYears, differenceInMonths } from "date-fns";
import { subscribePartnerToPush, getNotificationPermissionStatus } from "@/lib/pushNotifications";
import { computeCoupleStats, computeCoupleBadges, CoupleBadge } from "@/lib/gamification";

export default function ProfilePage() {
    const { user, selectUser, otherUserName, isLoaded } = useCoupleUser();
    const { data: memories = [] } = useMemories();

    const [isSubscribing, setIsSubscribing] = useState(false);
    const [subStatus, setSubStatus] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState(false);

    useEffect(() => {
        getNotificationPermissionStatus().then((status) => {
            if (status === "granted") {
                setHasPermission(true);
            }
        });
    }, []);

    const handleEnableNotifications = async () => {
        if (!user) {
            setSubStatus("Choisis d'abord qui utilise ce téléphone");
            return;
        }

        setIsSubscribing(true);
        setSubStatus(null);

        const success = await subscribePartnerToPush(user);
        setIsSubscribing(false);

        if (success) {
            setHasPermission(true);
            setSubStatus("Notifications activées avec succès ! 💌");
        } else {
            setSubStatus("Impossible d'activer les notifications (autorise les notifications dans ton navigateur)");
        }

        setTimeout(() => setSubStatus(null), 4000);
    };

    const startDate = new Date(2002, 1, 10); // 10 Feb 2002
    const now = new Date();
    const totalDays = differenceInDays(now, startDate);
    const totalYears = differenceInYears(now, startDate);
    const monthsRemainder = differenceInMonths(now, startDate) % 12;

    const favoritesCount = memories.filter(m => m.is_favorite).length;

    // Countdown to 25 years (10 Feb 2027)
    const anniversary25 = new Date(2027, 1, 10);
    const daysUntil25 = Math.max(0, differenceInDays(anniversary25, now));

    // Gamification & Couple Statistics
    const coupleStats = useMemo(() => computeCoupleStats(memories), [memories]);
    const coupleBadges = useMemo(() => computeCoupleBadges(coupleStats), [coupleStats]);
    const [selectedBadgeId, setSelectedBadgeId] = useState<string | null>(null);
    const selectedBadge = useMemo(() => coupleBadges.find((b) => b.id === selectedBadgeId) || null, [coupleBadges, selectedBadgeId]);

    return (
        <div className="flex flex-col h-dvh bg-background relative overflow-hidden">
            <BackgroundOrbs />

            <div className="flex-1 flex flex-col relative z-10 items-center justify-between px-6 pt-12 pb-24 overflow-y-auto custom-scrollbar text-center">
                {/* Header */}
                <div className="flex flex-col items-center">
                    <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="mb-4"
                    >
                        <div className="size-20 rounded-full bg-gradient-to-tr from-primary/20 to-accent/20 flex items-center justify-center mx-auto shadow-lg border border-white/20">
                            <Heart className="size-10 text-primary" fill="currentColor" />
                        </div>
                    </motion.div>

                    <h1 className="text-3xl font-[var(--font-dm-serif)] text-foreground tracking-tight">
                        Stéphane & Caroline
                    </h1>
                    <p className="text-xs uppercase tracking-widest text-[#E8B4A6] font-semibold mt-1">
                        Notre sanctuaire d&apos;amour
                    </p>
                </div>

                {/* 👑 / 🌸 Phone Identity Switcher */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="w-full max-w-sm rounded-3xl p-4 glass-light border border-white/30 shadow-md flex flex-col gap-2.5 my-4"
                >
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground px-1">
                        <span className="flex items-center gap-1.5">
                            <UserCheck className="size-4 text-primary" />
                            Utilisateur sur ce téléphone :
                        </span>
                        <span className="font-bold text-foreground">
                            {user ? `${PARTNER_EMOJIS[user]} ${PARTNER_NAMES[user]}` : "Non défini"}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-background/50 p-1.5 rounded-2xl">
                        {(["stephane", "caroline"] as CoupleUser[]).map((p) => {
                            const isSelected = user === p;
                            return (
                                <button
                                    key={p}
                                    onClick={() => selectUser(p)}
                                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                        isSelected
                                            ? "bg-primary text-primary-foreground shadow-sm scale-100"
                                            : "text-muted-foreground hover:text-foreground opacity-70"
                                    }`}
                                >
                                    <span>{PARTNER_EMOJIS[p]}</span>
                                    <span>{PARTNER_NAMES[p]}</span>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* 🔔 Notifications Card */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="w-full max-w-sm rounded-3xl p-4 glass-light border border-white/30 shadow-md flex flex-col gap-3 mb-4"
                >
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground px-1">
                        <span className="flex items-center gap-1.5">
                            {hasPermission ? (
                                <BellRing className="size-4 text-primary animate-pulse" />
                            ) : (
                                <Bell className="size-4 text-primary" />
                            )}
                            Notifications des mots doux
                        </span>
                        {hasPermission && (
                            <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="size-3" /> Activées
                            </span>
                        )}
                    </div>

                    <p className="text-[11px] text-muted-foreground text-left px-1 leading-relaxed">
                        Reçois une notification instantanée dès que {otherUserName || "ton partenaire"} t&apos;écrit un mot d&apos;amour au dos de la photo.
                    </p>

                    <button
                        onClick={handleEnableNotifications}
                        disabled={isSubscribing}
                        className={`w-full py-2.5 px-4 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm ${
                            hasPermission
                                ? "bg-card/70 border border-primary/30 text-foreground hover:bg-card"
                                : "bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-95"
                        }`}
                    >
                        {isSubscribing ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                <span>Activation en cours...</span>
                            </>
                        ) : hasPermission ? (
                            <>
                                <BellRing className="size-4 text-primary" />
                                <span>Réactualiser mes notifications</span>
                            </>
                        ) : (
                            <>
                                <Bell className="size-4" />
                                <span>M&apos;avertir quand {otherUserName || "mon amour"} m&apos;écrit</span>
                            </>
                        )}
                    </button>

                    {subStatus && (
                        <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-[11px] font-medium text-primary px-1"
                        >
                            {subStatus}
                        </motion.p>
                    )}
                </motion.div>

                {/* Counter & Milestones */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="w-full max-w-sm flex flex-col gap-3"
                >
                    {/* Days Together Card */}
                    <div className="rounded-3xl p-5 bg-card/60 backdrop-blur-md border border-white/20 shadow-sm flex flex-col items-center">
                        <span className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-semibold">
                            Ensemble depuis le 10 février 2002
                        </span>
                        <div className="font-[var(--font-dm-serif)] text-4xl text-primary mt-1 mb-0.5">
                            {totalDays.toLocaleString("fr-FR")} jours
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {totalYears} ans et {monthsRemainder} mois d&apos;amour
                        </span>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl p-3.5 bg-card/50 backdrop-blur-sm border border-white/15 flex flex-col items-center">
                            <Sparkles className="size-5 text-primary mb-1" />
                            <span className="text-xl font-bold text-foreground">{memories.length}</span>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Souvenirs</span>
                        </div>
                        <div className="rounded-2xl p-3.5 bg-card/50 backdrop-blur-sm border border-white/15 flex flex-col items-center">
                            <Heart className="size-5 text-pink-400 fill-pink-400 mb-1" />
                            <span className="text-xl font-bold text-foreground">{favoritesCount}</span>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Coups de 🩷</span>
                        </div>
                    </div>

                    {/* 25 ans Countdown banner */}
                    <div className="rounded-2xl p-3.5 bg-gradient-to-r from-amber-500/10 via-primary/10 to-accent/10 border border-amber-500/20 flex items-center justify-between text-left">
                        <div className="flex items-center gap-2.5">
                            <div className="size-9 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                                <Flame className="size-5 fill-current" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-foreground">Noces d&apos;Argent (25 ans)</p>
                                <p className="text-[10px] text-muted-foreground">Le 10 février 2027</p>
                            </div>
                        </div>
                        <span className="text-xs font-extrabold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full">
                            J - {daysUntil25}
                        </span>
                    </div>

                    {/* 👑 vs 🌸 Le Duel de la Tendresse (Regards d'Amour) */}
                    <div className="w-full rounded-3xl p-4 glass-light border border-white/30 shadow-md flex flex-col gap-3 text-left">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                                <Eye className="size-4 text-primary" />
                                Regards d&apos;amour
                            </span>
                            <span className="text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full">
                                {coupleStats.totalViews} regards au total
                            </span>
                        </div>

                        {/* Partner breakdown columns */}
                        <div className="grid grid-cols-2 gap-2 text-center">
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-2.5 flex flex-col items-center">
                                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                                    👑 Stéphane
                                </span>
                                <span className="text-2xl font-[var(--font-dm-serif)] text-amber-600 dark:text-amber-400 mt-0.5">
                                    {coupleStats.stephaneTotalViews}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium">
                                    {coupleStats.stephanePercent}% des regards
                                </span>
                            </div>

                            <div className="bg-pink-500/10 border border-pink-500/20 rounded-2xl p-2.5 flex flex-col items-center">
                                <span className="text-xs font-bold text-pink-700 dark:text-pink-300 flex items-center gap-1">
                                    🌸 Caroline
                                </span>
                                <span className="text-2xl font-[var(--font-dm-serif)] text-pink-600 dark:text-pink-400 mt-0.5">
                                    {coupleStats.carolineTotalViews}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium">
                                    {coupleStats.carolinePercent}% des regards
                                </span>
                            </div>
                        </div>

                        {/* Dual Progress Bar */}
                        <div className="w-full h-2.5 rounded-full bg-stone-200/60 dark:bg-stone-800/60 overflow-hidden flex shadow-inner">
                            <motion.div
                                className="h-full bg-gradient-to-r from-amber-400 to-amber-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${coupleStats.stephanePercent}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                            <motion.div
                                className="h-full bg-gradient-to-r from-pink-400 to-rose-400"
                                initial={{ width: 0 }}
                                animate={{ width: `${coupleStats.carolinePercent}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                        </div>

                        {/* Dynamic Leader Commentary */}
                        <div className="bg-background/60 rounded-xl p-2.5 text-center border border-white/20">
                            <p className="text-[11px] font-medium text-foreground leading-snug">
                                {coupleStats.leaderComment}
                            </p>
                        </div>

                        {/* Daily Presence Check */}
                        <div className="flex items-center justify-around pt-1 border-t border-black/5 text-[10px]">
                            <span className={`flex items-center gap-1 font-semibold ${coupleStats.todayViews.stephane ? "text-emerald-600" : "text-muted-foreground"}`}>
                                👑 Steph : {coupleStats.todayViews.stephane ? "Passé aujourd'hui ✨" : "Pas encore venu"}
                            </span>
                            <span className="text-muted-foreground/30">•</span>
                            <span className={`flex items-center gap-1 font-semibold ${coupleStats.todayViews.caroline ? "text-emerald-600" : "text-muted-foreground"}`}>
                                🌸 Caro : {coupleStats.todayViews.caroline ? "Passée aujourd'hui ✨" : "Pas encore venue"}
                            </span>
                        </div>

                        {/* Complicité Parfaite Banner */}
                        {coupleStats.isPerfectDay && (
                            <div className="bg-gradient-to-r from-amber-500/15 via-pink-500/15 to-rose-500/15 border border-amber-400/30 rounded-2xl p-2.5 text-center flex items-center justify-center gap-1.5 shadow-xs animate-fade-in">
                                <Sparkles className="size-3.5 text-amber-500 animate-pulse shrink-0" />
                                <span className="text-[11px] font-bold text-foreground">
                                    Complicité Parfaite : Passés tous les deux aujourd&apos;hui ! 💕
                                </span>
                            </div>
                        )}
                    </div>

                    {/* ⭐ Le Souvenir Star (La photo la plus regardée) */}
                    {coupleStats.mostViewedMemory && (
                        <div className="w-full rounded-3xl p-3.5 glass-light border border-white/30 shadow-md flex items-center gap-3 text-left">
                            <div className="size-16 rounded-2xl overflow-hidden shrink-0 shadow-md relative bg-stone-100">
                                <img
                                    src={coupleStats.mostViewedMemory.memory.image_url}
                                    alt="Souvenir favori"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-1 left-1 bg-black/60 rounded-full px-1.5 py-0.2 text-[8px] text-white font-bold">
                                    ⭐ #1
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                    <Flame className="size-3.5 text-rose-500 fill-rose-500" />
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-rose-500">
                                        Souvenir le plus contemplé
                                    </span>
                                </div>
                                <p className="text-xs font-semibold text-foreground truncate mt-0.5">
                                    {coupleStats.mostViewedMemory.parsed.quote || "Notre souvenir chéri"}
                                </p>
                                <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground font-medium">
                                    <span>Total : <strong className="text-foreground">{coupleStats.mostViewedMemory.totalViews}</strong> vues</span>
                                    <span>•</span>
                                    <span>👑 {coupleStats.mostViewedMemory.parsed.stephane_views_count}</span>
                                    <span>•</span>
                                    <span>🌸 {coupleStats.mostViewedMemory.parsed.caroline_views_count}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 🏆 Trophées & Badges du Couple */}
                    <div className="w-full rounded-3xl p-4 glass-light border border-white/30 shadow-md flex flex-col gap-3 text-left">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                                <Trophy className="size-4 text-amber-500" />
                                Trophées d&apos;amour
                            </span>
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                {coupleBadges.filter(b => b.isUnlocked).length} / {coupleBadges.length} débloqués
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {coupleBadges.map((badge) => (
                                <motion.div
                                    key={badge.id}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setSelectedBadgeId(selectedBadgeId === badge.id ? null : badge.id)}
                                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                                        badge.isUnlocked
                                            ? "bg-gradient-to-br from-amber-500/10 via-primary/5 to-pink-500/10 border-amber-400/40 shadow-xs ring-1 ring-amber-400/20"
                                            : "bg-background/40 border-white/20 opacity-75"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-1">
                                        <span className="text-xl">{badge.emoji}</span>
                                        {badge.isUnlocked ? (
                                            <span className="text-[9px] font-extrabold text-amber-600 bg-amber-500/15 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                                                <Check className="size-2.5" /> Fait
                                            </span>
                                        ) : (
                                            <span className="text-[9px] font-bold text-muted-foreground/60 flex items-center gap-0.5">
                                                <Lock className="size-2.5" />
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-1">
                                        <p className="text-[11px] font-bold text-foreground leading-tight">{badge.title}</p>
                                        <p className="text-[9px] text-muted-foreground line-clamp-2 mt-0.5 leading-tight">{badge.description}</p>
                                    </div>

                                    {!badge.isUnlocked && (
                                        <div className="mt-2 w-full">
                                            <div className="flex justify-between text-[8px] text-muted-foreground font-medium mb-0.5">
                                                <span>Progression</span>
                                                <span>{badge.current}/{badge.target}</span>
                                            </div>
                                            <div className="w-full h-1.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all duration-500"
                                                    style={{ width: `${badge.progressPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {/* Selected Badge Dialog/Banner */}
                        {selectedBadge && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-center relative mt-1"
                            >
                                <button
                                    onClick={() => setSelectedBadgeId(null)}
                                    className="absolute top-2 right-2 text-muted-foreground hover:text-foreground text-xs"
                                >
                                    ✕
                                </button>
                                <p className="text-xs font-bold text-foreground">{selectedBadge.title}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">{selectedBadge.description}</p>
                                <p className="text-[11px] text-primary font-semibold mt-1 italic">
                                    &ldquo;{selectedBadge.rewardText}&rdquo;
                                </p>
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* Footer text */}
                <div className="pt-4">
                    <p className="text-[11px] text-muted-foreground/60">
                        Fait avec tout mon amour ❤️ pour l&apos;éternité
                    </p>
                </div>
            </div>

            <BottomNav />
        </div>
    );
}
