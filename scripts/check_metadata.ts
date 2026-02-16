
import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDailyPhotoMetadata() {
    console.log("Checking daily photo metadata...");

    const { data: memory, error } = await supabase
        .from("memories")
        .select("*")
        .eq("is_daily_pick", true)
        .maybeSingle();

    if (error) {
        console.error("Error fetching daily pick:", error);
        return;
    }

    if (!memory) {
        console.log("No daily pick found.");
        return;
    }

    console.log("Current Daily Pick:");
    console.log(`ID: ${memory.id}`);
    console.log(`Caption: ${memory.caption}`);
    console.log(`photo_date: ${memory.photo_date}`);
    console.log(`photo_location: ${memory.photo_location}`);
    console.log(`created_at: ${memory.created_at}`);
}

checkDailyPhotoMetadata();
