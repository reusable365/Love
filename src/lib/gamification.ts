import { differenceInDays } from "date-fns";
import { Memory } from "@/lib/supabase";
import { parseMemoryData, MemoryParsedData } from "@/lib/memoryNotes";
import { CoupleUser } from "@/lib/useCoupleUser";

export interface CoupleStats {
    stephaneTotalViews: number;
    carolineTotalViews: number;
    totalViews: number;
    stephanePercent: number;
    carolinePercent: number;
    leader: CoupleUser | "tie";
    leaderDifference: number;
    leaderComment: string;
    mostViewedMemory: {
        memory: Memory;
        parsed: MemoryParsedData;
        totalViews: number;
    } | null;
    topMemories: Array<{
        memory: Memory;
        parsed: MemoryParsedData;
        totalViews: number;
    }>;
    favoritesCount: number;
    notesCount: number;
    sharedMemoriesCount: number; // Memories viewed by BOTH partners
    distinctMemoriesViewed: number;
    unviewedMemoriesCount: number;
    daysTogether: number;
    todayViews: {
        stephane: boolean;
        caroline: boolean;
    };
    isPerfectDay: boolean; // Both Stephane and Caroline visited today
}

export interface CoupleBadge {
    id: string;
    title: string;
    description: string;
    emoji: string;
    category: "views" | "love" | "notes" | "milestone";
    current: number;
    target: number;
    isUnlocked: boolean;
    progressPercent: number;
    rewardText: string;
}

const START_DATE = new Date(2002, 1, 10); // 10 Feb 2002

export function computeCoupleStats(memories: Memory[]): CoupleStats {
    let stephaneTotalViews = 0;
    let carolineTotalViews = 0;
    let favoritesCount = 0;
    let notesCount = 0;
    let sharedMemoriesCount = 0;
    let distinctMemoriesViewed = 0;

    const todayStr = new Date().toLocaleDateString("fr-CA");
    let stephaneViewedToday = false;
    let carolineViewedToday = false;

    const memoryViewsList: Array<{
        memory: Memory;
        parsed: MemoryParsedData;
        totalViews: number;
    }> = [];

    for (const mem of memories) {
        const parsed = parseMemoryData(mem.caption);
        const sViews = parsed.stephane_views_count || 0;
        const cViews = parsed.caroline_views_count || 0;
        const tot = sViews + cViews;

        stephaneTotalViews += sViews;
        carolineTotalViews += cViews;

        if (mem.is_favorite) {
            favoritesCount++;
        }

        if (parsed.note_stephane?.trim()) notesCount++;
        if (parsed.note_caroline?.trim()) notesCount++;

        if (sViews > 0 && cViews > 0) {
            sharedMemoriesCount++;
        }

        if (tot > 0) {
            distinctMemoriesViewed++;
        }

        if (parsed.stephane_seen_at && new Date(parsed.stephane_seen_at).toLocaleDateString("fr-CA") === todayStr) {
            stephaneViewedToday = true;
        }

        if (parsed.caroline_seen_at && new Date(parsed.caroline_seen_at).toLocaleDateString("fr-CA") === todayStr) {
            carolineViewedToday = true;
        }

        if (tot > 0) {
            memoryViewsList.push({
                memory: mem,
                parsed,
                totalViews: tot,
            });
        }
    }

    // Sort by total views descending
    memoryViewsList.sort((a, b) => b.totalViews - a.totalViews);

    const mostViewedMemory = memoryViewsList.length > 0 ? memoryViewsList[0] : null;
    const topMemories = memoryViewsList.slice(0, 5);

    const totalViews = stephaneTotalViews + carolineTotalViews;
    const stephanePercent = totalViews > 0 ? Math.round((stephaneTotalViews / totalViews) * 100) : 50;
    const carolinePercent = totalViews > 0 ? 100 - stephanePercent : 50;

    let leader: CoupleUser | "tie" = "tie";
    const leaderDifference = Math.abs(stephaneTotalViews - carolineTotalViews);
    let leaderComment = totalViews === 0
        ? "✨ Démarrez l'aventure : posez vos premiers regards sur vos photos !"
        : "💖 Équilibre parfait : même intensité d'amour et de regards !";

    if (stephaneTotalViews > carolineTotalViews) {
        leader = "stephane";
        leaderComment = `👑 Stéphane mène la danse des regards (+${leaderDifference} ${leaderDifference > 1 ? "vues" : "vue"}) !`;
    } else if (carolineTotalViews > stephaneTotalViews) {
        leader = "caroline";
        leaderComment = `🌸 Caroline contemple le plus vos souvenirs (+${leaderDifference} ${leaderDifference > 1 ? "vues" : "vue"}) !`;
    }

    const daysTogether = differenceInDays(new Date(), START_DATE);
    const unviewedMemoriesCount = Math.max(0, memories.length - distinctMemoriesViewed);
    const isPerfectDay = stephaneViewedToday && carolineViewedToday;

    return {
        stephaneTotalViews,
        carolineTotalViews,
        totalViews,
        stephanePercent,
        carolinePercent,
        leader,
        leaderDifference,
        leaderComment,
        mostViewedMemory,
        topMemories,
        favoritesCount,
        notesCount,
        sharedMemoriesCount,
        distinctMemoriesViewed,
        unviewedMemoriesCount,
        daysTogether,
        todayViews: {
            stephane: stephaneViewedToday,
            caroline: carolineViewedToday,
        },
        isPerfectDay,
    };
}

export function computeCoupleBadges(stats: CoupleStats): CoupleBadge[] {
    const maxSingleMemoryViews = stats.mostViewedMemory ? stats.mostViewedMemory.totalViews : 0;

    const badges: CoupleBadge[] = [
        {
            id: "badge_steph_gaze",
            title: "Regard d'Or 👑",
            description: "Stéphane contemple les souvenirs au moins 15 fois",
            emoji: "👑",
            category: "views",
            current: stats.stephaneTotalViews,
            target: 15,
            isUnlocked: stats.stephaneTotalViews >= 15,
            progressPercent: Math.min(100, Math.round((stats.stephaneTotalViews / 15) * 100)),
            rewardText: "Stéphane a les yeux de l'amour !",
        },
        {
            id: "badge_caro_gaze",
            title: "Regard de Fée 🌸",
            description: "Caroline contemple les souvenirs au moins 15 fois",
            emoji: "🌸",
            category: "views",
            current: stats.carolineTotalViews,
            target: 15,
            isUnlocked: stats.carolineTotalViews >= 15,
            progressPercent: Math.min(100, Math.round((stats.carolineTotalViews / 15) * 100)),
            rewardText: "Caroline veille tendrement sur le passé !",
        },
        {
            id: "badge_favorites",
            title: "Collection de Cœurs 🩷",
            description: "Ajouter 5 souvenirs aux Coups de 🩷",
            emoji: "💖",
            category: "love",
            current: stats.favoritesCount,
            target: 5,
            isUnlocked: stats.favoritesCount >= 5,
            progressPercent: Math.min(100, Math.round((stats.favoritesCount / 5) * 100)),
            rewardText: "Un panthéon de vos plus beaux moments.",
        },
        {
            id: "badge_love_notes",
            title: "Boîte aux Mots Doux 💌",
            description: "Écrire au moins 3 mots au dos des souvenirs",
            emoji: "💌",
            category: "notes",
            current: stats.notesCount,
            target: 3,
            isUnlocked: stats.notesCount >= 3,
            progressPercent: Math.min(100, Math.round((stats.notesCount / 3) * 100)),
            rewardText: "Des paroles d'amour gravées pour toujours.",
        },
        {
            id: "badge_soulmates",
            title: "Âmes Miroirs 🌙",
            description: "Avoir 5 souvenirs regardés par vous DEUX",
            emoji: "✨",
            category: "love",
            current: stats.sharedMemoriesCount,
            target: 5,
            isUnlocked: stats.sharedMemoriesCount >= 5,
            progressPercent: Math.min(100, Math.round((stats.sharedMemoriesCount / 5) * 100)),
            rewardText: "Une complicité qui regarde dans la même direction.",
        },
        {
            id: "badge_obsession",
            title: "Coup de Foudre Absolu 🔥",
            description: "Une photo contemplée plus de 10 fois au total",
            emoji: "🔥",
            category: "views",
            current: maxSingleMemoryViews,
            target: 10,
            isUnlocked: maxSingleMemoryViews >= 10,
            progressPercent: Math.min(100, Math.round((maxSingleMemoryViews / 10) * 100)),
            rewardText: "Ce souvenir est votre trésor intemporel.",
        },
        {
            id: "badge_vault_explorer",
            title: "Explorateurs du Coffre 🏛️",
            description: "Avoir contemplé au moins 10 souvenirs différents",
            emoji: "🧭",
            category: "views",
            current: stats.distinctMemoriesViewed,
            target: 10,
            isUnlocked: stats.distinctMemoriesViewed >= 10,
            progressPercent: Math.min(100, Math.round((stats.distinctMemoriesViewed / 10) * 100)),
            rewardText: "Vous revivez chaque chapitre de votre histoire.",
        },
        {
            id: "badge_days_8000",
            title: "Flamme Éternelle 💍",
            description: "Plus de 8 000 jours ensemble (depuis le 10/02/2002)",
            emoji: "♾️",
            category: "milestone",
            current: stats.daysTogether,
            target: 8000,
            isUnlocked: stats.daysTogether >= 8000,
            progressPercent: Math.min(100, Math.round((stats.daysTogether / 8000) * 100)),
            rewardText: "Plus de 24 ans d'amour et toujours la même étincelle !",
        },
        {
            id: "badge_perfect_sync",
            title: "Coup de Cœur Synchro 💫",
            description: "Passer tous les deux admirer vos photos le même jour",
            emoji: "💫",
            category: "love",
            current: stats.isPerfectDay ? 1 : 0,
            target: 1,
            isUnlocked: stats.isPerfectDay,
            progressPercent: stats.isPerfectDay ? 100 : 0,
            rewardText: "Une journée où vos cœurs ont vibré à l'unisson !",
        },
    ];

    return badges;
}
