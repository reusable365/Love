import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Pick "Trois Cafés Gourmands - À nos souvenirs" — a feel-good French song that definitely works for embed
const TARGET_TITLE = "Trois Cafés Gourmands";

const { data: songs } = await sb.from("soundtracks").select("id, title, artist").order("title");
const song = songs.find(s => s.title.includes(TARGET_TITLE));

if (!song) {
    console.error("❌ Song not found");
    process.exit(1);
}

console.log(`🎵 Switching to: "${song.title}" — ${song.artist}`);

// Clear current pick
await sb.from("soundtracks").update({ is_daily_pick: false }).eq("is_daily_pick", true);

// Set new pick
const { error } = await sb.from("soundtracks").update({ is_daily_pick: true }).eq("id", song.id);

if (error) {
    console.error("❌", error.message);
} else {
    console.log("✅ Done! Refresh the page 🎶");
}
