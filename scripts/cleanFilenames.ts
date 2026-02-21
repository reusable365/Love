import { getSupabase } from "@/lib/supabase";

export async function cleanupFilenames() {
    const sb = getSupabase();
    const { data: memories } = await sb.from("memories").select("id, caption");

    let updatedCount = 0;
    if (memories) {
        for (const mem of memories) {
            if (mem.caption && /.*\.(jpe?g|png|heic|webp|gif)$/i.test(mem.caption)) {
                await sb.from("memories").update({ caption: "" }).eq("id", mem.id);
                updatedCount++;
            }
        }
    }
    console.log(`[CLEANUP] Scrubbed ${updatedCount} generic filename captions.`);
}
