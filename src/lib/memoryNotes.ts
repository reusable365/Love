export interface MemoryParsedData {
    quote: string;
    note_stephane: string;
    note_caroline: string;
    stephane_seen_at: string | null;
    caroline_seen_at: string | null;
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
    };

    if (!rawCaption) {
        return defaultData;
    }

    // Try parsing as structured JSON
    if (rawCaption.trim().startsWith("{") && rawCaption.trim().endsWith("}")) {
        try {
            const parsed = JSON.parse(rawCaption);
            return {
                quote: parsed.quote && !FILENAME_REGEX.test(parsed.quote) ? parsed.quote : fallbackQuote,
                note_stephane: parsed.note_stephane || "",
                note_caroline: parsed.note_caroline || "",
                stephane_seen_at: parsed.stephane_seen_at || null,
                caroline_seen_at: parsed.caroline_seen_at || null,
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
