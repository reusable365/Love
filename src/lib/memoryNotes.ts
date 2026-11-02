import { CoupleUser } from "./useCoupleUser";

export interface MemoryParsedData {
    quote: string;
    note_stephane: string;
    note_caroline: string;
    stephane_seen_at: string | null;
    caroline_seen_at: string | null;
    stephane_views_count: number;
    caroline_views_count: number;
}

const FILENAME_REGEX = /.*\.(jpe?g|png|heic|webp|gif)$/i;

/**
 * Safely parses the memory caption.
 * Supports legacy string captions as well as structured JSON.
 */
export function parseMemoryData(rawCaption?: string | null, fallbackQuote: string = ""): MemoryParsedData {
    const defaultData: MemoryParsedData = {
        quote: fallbackQuote,
        note_stephane: "",
        note_caroline: "",
        stephane_seen_at: null,
        caroline_seen_at: null,
        stephane_views_count: 0,
        caroline_views_count: 0,
    };

    if (!rawCaption || !rawCaption.trim()) {
        return defaultData;
    }

    // Try parsing as structured JSON
    if (rawCaption.trim().startsWith("{") && rawCaption.trim().endsWith("}")) {
        try {
            const parsed = JSON.parse(rawCaption);
            const stephSeen = parsed.stephane_seen_at || null;
            const caroSeen = parsed.caroline_seen_at || null;

            // Backfill: if seen_at was previously stored before views counting existed, count at least 1
            const rawS = parsed.stephane_views_count;
            const sViews = (typeof rawS === "number" && !isNaN(rawS))
                ? Math.max(0, Math.floor(rawS))
                : (typeof rawS === "string" && !isNaN(Number(rawS)) && rawS.trim() !== "")
                    ? Math.max(0, Math.floor(Number(rawS)))
                    : (stephSeen ? 1 : 0);

            const rawC = parsed.caroline_views_count;
            const cViews = (typeof rawC === "number" && !isNaN(rawC))
                ? Math.max(0, Math.floor(rawC))
                : (typeof rawC === "string" && !isNaN(Number(rawC)) && rawC.trim() !== "")
                    ? Math.max(0, Math.floor(Number(rawC)))
                    : (caroSeen ? 1 : 0);

            return {
                quote: parsed.quote && !FILENAME_REGEX.test(parsed.quote) ? parsed.quote : fallbackQuote,
                note_stephane: parsed.note_stephane || "",
                note_caroline: parsed.note_caroline || "",
                stephane_seen_at: stephSeen,
                caroline_seen_at: caroSeen,
                stephane_views_count: sViews,
                caroline_views_count: cViews,
            };
        } catch {
            // Fallback to plain text
        }
    }

    // Legacy plain text caption
    if (FILENAME_REGEX.test(rawCaption) || rawCaption.startsWith("Souvenir : ")) {
        return defaultData;
    }

    return {
        ...defaultData,
        quote: rawCaption.trim(),
    };
}

/**
 * Serializes the structured data back into a string to save in memory.caption.
 */
export function serializeMemoryData(data: MemoryParsedData): string {
    return JSON.stringify(data);
}

/**
 * Increments view count for a partner and updates timestamp.
 */
export function incrementMemoryView(
    rawCaption: string | null | undefined,
    partner: CoupleUser,
    fallbackQuote: string = ""
): { newCaption: string; updatedData: MemoryParsedData } {
    const current = parseMemoryData(rawCaption, fallbackQuote);
    const updated: MemoryParsedData = {
        ...current,
        [partner === "stephane" ? "stephane_views_count" : "caroline_views_count"]:
            (partner === "stephane" ? current.stephane_views_count : current.caroline_views_count) + 1,
        [partner === "stephane" ? "stephane_seen_at" : "caroline_seen_at"]: new Date().toISOString(),
    };

    return {
        newCaption: serializeMemoryData(updated),
        updatedData: updated,
    };
}

export function getTotalViews(data: MemoryParsedData): number {
    return (data.stephane_views_count || 0) + (data.caroline_views_count || 0);
}

export interface AffectionLevel {
    label: string;
    emoji: string;
    tier: number;
    color: string;
    bgBadge: string;
}

/**
 * Computes an affection tier for a photo based on total views.
 */
export function getAffectionLevel(totalViews: number): AffectionLevel {
    if (totalViews >= 20) {
        return {
            label: "Trésor absolu",
            emoji: "🔥",
            tier: 4,
            color: "text-rose-500",
            bgBadge: "bg-rose-500/15 text-rose-600 border-rose-500/30",
        };
    }
    if (totalViews >= 10) {
        return {
            label: "Coup de foudre",
            emoji: "💖",
            tier: 3,
            color: "text-pink-500",
            bgBadge: "bg-pink-500/15 text-pink-600 border-pink-500/30",
        };
    }
    if (totalViews >= 5) {
        return {
            label: "Nostalgie douce",
            emoji: "💫",
            tier: 2,
            color: "text-amber-500",
            bgBadge: "bg-amber-500/15 text-amber-600 border-amber-500/30",
        };
    }
    if (totalViews >= 1) {
        return {
            label: "Découverte",
            emoji: "🌱",
            tier: 1,
            color: "text-emerald-500",
            bgBadge: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
        };
    }
    return {
        label: "À découvrir",
        emoji: "✨",
        tier: 0,
        color: "text-stone-400",
        bgBadge: "bg-stone-500/10 text-stone-500 border-stone-400/20",
    };
}
