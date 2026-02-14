/**
 * Extract YouTube video ID from various URL formats.
 * Supports: youtube.com/watch?v=, youtu.be/, youtube.com/embed/, etc.
 */
export function extractYouTubeId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return null;
}

/**
 * Get YouTube thumbnail URL from video ID.
 */
export function getYouTubeThumbnail(
    videoId: string,
    quality: "default" | "mqdefault" | "hqdefault" | "maxresdefault" = "mqdefault"
): string {
    return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}
