"use client";

import exifr from "exifr";

interface PhotoMetadata {
    date?: Date;
    location?: string;
    latitude?: number;
    longitude?: number;
}

/**
 * Extract EXIF metadata from a photo file.
 * Returns date taken and GPS location (reverse geocoded to city name).
 */
export async function extractPhotoMetadata(file: File): Promise<PhotoMetadata> {
    try {
        const exif = await exifr.parse(file, {
            pick: ["DateTimeOriginal", "CreateDate", "GPSLatitude", "GPSLongitude", "latitude", "longitude"],
        });

        if (!exif) return {};

        const result: PhotoMetadata = {};

        // Date
        const rawDate = exif.DateTimeOriginal || exif.CreateDate;
        if (rawDate) {
            result.date = rawDate instanceof Date ? rawDate : new Date(rawDate);
        }

        // GPS
        const lat = exif.latitude ?? exif.GPSLatitude;
        const lng = exif.longitude ?? exif.GPSLongitude;

        if (lat && lng && typeof lat === "number" && typeof lng === "number") {
            result.latitude = lat;
            result.longitude = lng;
            // Reverse geocode
            result.location = await reverseGeocode(lat, lng);
        }

        return result;
    } catch (err) {
        console.warn("EXIF extraction failed:", err);
        return {};
    }
}

/**
 * Reverse geocode GPS coordinates to a human-readable location.
 * Uses free OpenStreetMap Nominatim API (no key required).
 */
async function reverseGeocode(lat: number, lng: number): Promise<string | undefined> {
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10&accept-language=fr`,
            { headers: { "User-Agent": "PlumeBiographer/1.0" } }
        );

        if (!res.ok) return undefined;

        const data = await res.json();
        const addr = data.address;

        // Build a concise location: City, Country
        const city = addr?.city || addr?.town || addr?.village || addr?.municipality || addr?.county;
        const country = addr?.country;

        if (city && country) return `${city}, ${country}`;
        if (city) return city;
        if (country) return country;
        return data.display_name?.split(",").slice(0, 2).join(",").trim();
    } catch {
        console.warn("Reverse geocoding failed");
        return undefined;
    }
}

/**
 * Format a date for display (e.g., "14 Juin 2019")
 */
export function formatPhotoDate(dateStr: string | undefined): string | null {
    if (!dateStr) return null;
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return null;
        return date.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    } catch {
        return null;
    }
}
