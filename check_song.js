import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Check the current daily pick song
const { data } = await sb.from("soundtracks").select("*").eq("is_daily_pick", true);
console.log("\n⭐ Current daily pick song:\n", JSON.stringify(data, null, 2));

// Also list all songs with their src_url
const { data: all } = await sb.from("soundtracks").select("id, title, artist, src_url, type").order("title");
console.log("\n🎵 All songs with URLs:\n");
all.forEach((s, i) => {
    console.log(`${i + 1}. ${s.title} — ${s.artist}`);
    console.log(`   Type: ${s.type} | URL: ${s.src_url}\n`);
});
