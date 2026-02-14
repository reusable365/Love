/**
 * Seeded Random Number Generator (Mulberry32)
 * Given the same seed, always returns the same deterministic pseudo-random sequence.
 * Used so both partners see the same "random" daily pick without storing it in DB.
 */
function mulberry32(seed: number): () => number {
    return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Create a seeded random number generator based on today's date (YYYY-MM-DD).
 * Both partners will get the same seed → same picks.
 */
export function getSeededRandom(dateStr?: string): () => number {
    // "fr-CA" format gives YYYY-MM-DD in local time
    const today = dateStr ?? new Date().toLocaleDateString("fr-CA");
    // Convert date string to a numeric seed using a simple hash
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
        const char = today.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32-bit int
    }
    return mulberry32(Math.abs(hash));
}

/**
 * Pick one element from an array using seeded random.
 */
export function seededPick<T>(items: T[], rng: () => number): T {
    const index = Math.floor(rng() * items.length);
    return items[index];
}
