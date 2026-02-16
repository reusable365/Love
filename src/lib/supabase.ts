import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

/**
 * Lazy Supabase client — only instantiated on first call (client-side).
 * Avoids crashing during SSR / build when env vars are placeholders.
 */
export function getSupabase(): SupabaseClient {
    if (!_supabase) {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

        if (!url.startsWith("http")) {
            console.warn(
                "⚠️ NEXT_PUBLIC_SUPABASE_URL is not set. " +
                "Please fill in your .env.local file with your Supabase credentials."
            );
            // Return a dummy client that won't crash — queries will simply fail gracefully
            _supabase = createClient("https://placeholder.supabase.co", key || "placeholder");
        } else {
            _supabase = createClient(url, key);
        }
    }
    return _supabase;
}

/* ─── Types ─── */
export interface Memory {
    id: string;
    image_url: string;
    caption: string;
    is_daily_pick: boolean;
    is_favorite: boolean;
    user_id: string;
    created_at: string;
    photo_date?: string;
    photo_location?: string;
}

export interface Soundtrack {
    id: string;
    title: string;
    artist: string;
    type: "mp3" | "youtube";
    src_url: string;
    is_daily_pick: boolean;
    user_id: string;
}
