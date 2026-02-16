
import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function refreshMusic() {
    console.log("Activating Music Refresh...");

    // 1. Clear current daily pick
    const { error: clearError } = await supabase
        .from("soundtracks")
        .update({ is_daily_pick: false })
        .eq("is_daily_pick", true);

    if (clearError) {
        console.error("Error clearing music:", clearError);
        return;
    }

    // 2. Fetch all tracks
    const { data: tracks, error: fetchError } = await supabase
        .from("soundtracks")
        .select("id");

    if (fetchError || !tracks || tracks.length === 0) {
        console.error("Error fetching tracks:", fetchError);
        return;
    }

    // 3. Pick random
    const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
    console.log("Selected track ID:", randomTrack.id);

    // 4. Set as daily pick
    const { error: setError } = await supabase
        .from("soundtracks")
        .update({ is_daily_pick: true })
        .eq("id", randomTrack.id);

    if (setError) {
        console.error("Error setting daily music:", setError);
    } else {
        console.log("Successfully refreshed daily music! 🎵");
    }
}

refreshMusic();
