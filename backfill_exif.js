/**
 * BACKFILL SCRIPT — Extract EXIF metadata from existing photos
 * 
 * This script:
 * 1. Fetches all memories that don't have a photo_date
 * 2. Downloads each image and extracts EXIF data (date, GPS)
 * 3. Reverse geocodes GPS to a city name
 * 4. Updates the database with the extracted metadata
 * 
 * Usage: node backfill_exif.js
 */

import { createClient } from "@supabase/supabase-js";
import exifr from "exifr";
import { config } from "dotenv";

// Load .env.local
config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function reverseGeocode(lat, lng) {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&accept-language=fr`,
            { headers: { "User-Agent": "PlumeBiographer/1.0" } }
        );
        if (!res.ok) return undefined;
        const data = await res.json();
        const addr = data.address;
        const city = addr?.city || addr?.town || addr?.village || addr?.municipality || addr?.county;
        const country = addr?.country;
        if (city && country) return `${city}, ${country}`;
        if (city) return city;
        if (country) return country;
        return data.display_name?.split(",").slice(0, 2).join(",").trim();
    } catch {
        return undefined;
    }
}

async function extractExifFromUrl(imageUrl) {
    try {
        const res = await fetch(imageUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buffer = await res.arrayBuffer();

        const exif = await exifr.parse(buffer, {
            pick: ["DateTimeOriginal", "CreateDate", "GPSLatitude", "GPSLongitude", "latitude", "longitude"],
        });

        if (!exif) return {};

        const result = {};

        // Date
        const rawDate = exif.DateTimeOriginal || exif.CreateDate;
        if (rawDate) {
            result.photo_date = (rawDate instanceof Date ? rawDate : new Date(rawDate)).toISOString();
        }

        // GPS
        const lat = exif.latitude ?? exif.GPSLatitude;
        const lng = exif.longitude ?? exif.GPSLongitude;

        if (lat && lng && typeof lat === "number" && typeof lng === "number") {
            result.photo_location = await reverseGeocode(lat, lng);
        }

        return result;
    } catch (err) {
        console.warn(`  ⚠ EXIF extraction failed: ${err.message}`);
        return {};
    }
}

async function main() {
    console.log("🔍 Fetching memories without photo_date...\n");

    const { data: memories, error } = await supabase
        .from("memories")
        .select("id, image_url, caption, photo_date, photo_location")
        .is("photo_date", null)
        .order("created_at", { ascending: true });

    if (error) {
        console.error("❌ Failed to fetch memories:", error);
        return;
    }

    console.log(`📸 Found ${memories.length} photos without metadata.\n`);

    let updated = 0;
    let skipped = 0;

    for (const mem of memories) {
        const shortCaption = (mem.caption || "Sans titre").substring(0, 40);
        process.stdout.write(`  Processing "${shortCaption}"... `);

        const metadata = await extractExifFromUrl(mem.image_url);

        if (!metadata.photo_date && !metadata.photo_location) {
            console.log("❌ No EXIF data found");
            skipped++;
            continue;
        }

        const updateFields = {};
        if (metadata.photo_date) updateFields.photo_date = metadata.photo_date;
        if (metadata.photo_location) updateFields.photo_location = metadata.photo_location;

        const { error: updateError } = await supabase
            .from("memories")
            .update(updateFields)
            .eq("id", mem.id);

        if (updateError) {
            console.log(`❌ DB update failed: ${updateError.message}`);
        } else {
            console.log(`✅ ${metadata.photo_date ? new Date(metadata.photo_date).toLocaleDateString("fr-FR") : ""} ${metadata.photo_location || ""}`);
            updated++;
        }

        // Rate limit for Nominatim (1 req/sec)
        if (metadata.photo_location) {
            await new Promise(r => setTimeout(r, 1100));
        }
    }

    console.log(`\n${"═".repeat(50)}`);
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭ Skipped (no EXIF): ${skipped}`);
    console.log(`📸 Total processed: ${memories.length}`);
}

main();
