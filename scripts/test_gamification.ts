import test from "node:test";
import assert from "node:assert/strict";
import {
    parseMemoryData,
    serializeMemoryData,
    incrementMemoryView,
    getTotalViews,
    getAffectionLevel,
    MemoryParsedData,
} from "../src/lib/memoryNotes";
import {
    computeCoupleStats,
    computeCoupleBadges,
    CoupleStats,
} from "../src/lib/gamification";
import type { Memory } from "../src/lib/supabase";

// ─── 1. parseMemoryData ───

test("parseMemoryData: handles null, undefined, empty string and whitespace", () => {
    const fromNull = parseMemoryData(null, "fallback");
    assert.equal(fromNull.quote, "fallback");
    assert.equal(fromNull.stephane_views_count, 0);
    assert.equal(fromNull.caroline_views_count, 0);
    assert.equal(fromNull.stephane_seen_at, null);
    assert.equal(fromNull.caroline_seen_at, null);

    const fromUndefined = parseMemoryData(undefined, "fallback");
    assert.equal(fromUndefined.quote, "fallback");
    assert.equal(fromUndefined.stephane_views_count, 0);

    const fromEmpty = parseMemoryData("   ", "fallback");
    assert.equal(fromEmpty.quote, "fallback");
});

test("parseMemoryData: filters filename captions", () => {
    const jpg = parseMemoryData("IMG_2024.JPG", "Beau moment");
    assert.equal(jpg.quote, "Beau moment");
    assert.equal(jpg.stephane_views_count, 0);

    const souvenirPrefix = parseMemoryData("Souvenir : voyage.png", "Beau moment");
    assert.equal(souvenirPrefix.quote, "Beau moment");
});

test("parseMemoryData: parses plain text captions", () => {
    const parsed = parseMemoryData("Coucher de soleil sur les toits de Rome", "fallback");
    assert.equal(parsed.quote, "Coucher de soleil sur les toits de Rome");
    assert.equal(parsed.stephane_views_count, 0);
    assert.equal(parsed.caroline_views_count, 0);
    assert.equal(parsed.note_stephane, "");
    assert.equal(parsed.note_caroline, "");
});

test("parseMemoryData: backfills legacy structured JSON with seen_at timestamps", () => {
    const legacy = JSON.stringify({
        quote: "Notre première danse",
        note_stephane: "Émouvant",
        note_caroline: "",
        stephane_seen_at: "2026-10-15T10:00:00.000Z",
        caroline_seen_at: null,
    });
    const parsed = parseMemoryData(legacy);
    assert.equal(parsed.quote, "Notre première danse");
    assert.equal(parsed.note_stephane, "Émouvant");
    assert.equal(parsed.stephane_views_count, 1, "Should backfill 1 view when seen_at existed without counter");
    assert.equal(parsed.caroline_views_count, 0, "Should remain 0 when seen_at was null");
});

test("parseMemoryData: parses modern JSON with explicit views and string-encoded views", () => {
    const modern = JSON.stringify({
        quote: "Voyage en Islande",
        note_stephane: "Magique",
        note_caroline: "Inoubliable",
        stephane_views_count: 8,
        caroline_views_count: 14,
        stephane_seen_at: "2026-10-20T12:00:00.000Z",
        caroline_seen_at: "2026-10-20T14:00:00.000Z",
    });
    const parsed = parseMemoryData(modern);
    assert.equal(parsed.stephane_views_count, 8);
    assert.equal(parsed.caroline_views_count, 14);
    assert.equal(parsed.note_caroline, "Inoubliable");

    // String numbers safety test
    const stringNumbers = JSON.stringify({
        quote: "Photo test",
        stephane_views_count: "5",
        caroline_views_count: "9",
    });
    const parsedStr = parseMemoryData(stringNumbers);
    assert.equal(parsedStr.stephane_views_count, 5);
    assert.equal(parsedStr.caroline_views_count, 9);
});

test("parseMemoryData: handles corrupted JSON gracefully", () => {
    const corrupted = "{ quote: unclosed invalid json";
    const parsed = parseMemoryData(corrupted, "fallback");
    assert.equal(parsed.quote, corrupted);
    assert.equal(parsed.stephane_views_count, 0);
});

// ─── 2. serializeMemoryData & Round-trip ───

test("serializeMemoryData: round-trip consistency", () => {
    const data: MemoryParsedData = {
        quote: "Soirée sous les étoiles",
        note_stephane: "Je t'aime",
        note_caroline: "Moi aussi",
        stephane_seen_at: "2026-11-01T20:00:00.000Z",
        caroline_seen_at: "2026-11-01T21:00:00.000Z",
        stephane_views_count: 3,
        caroline_views_count: 4,
    };
    const serialized = serializeMemoryData(data);
    const roundTrip = parseMemoryData(serialized);
    assert.deepEqual(roundTrip, data);
});

// ─── 3. incrementMemoryView ───

test("incrementMemoryView: correctly increments per partner and preserves data", () => {
    // 1st step: start with plain text
    const step1 = incrementMemoryView("Notre premier café", "stephane");
    assert.equal(step1.updatedData.quote, "Notre premier café");
    assert.equal(step1.updatedData.stephane_views_count, 1);
    assert.equal(step1.updatedData.caroline_views_count, 0);
    assert.ok(step1.updatedData.stephane_seen_at);
    assert.equal(step1.updatedData.caroline_seen_at, null);

    // 2nd step: Caroline views the memory
    const step2 = incrementMemoryView(step1.newCaption, "caroline");
    assert.equal(step2.updatedData.quote, "Notre premier café");
    assert.equal(step2.updatedData.stephane_views_count, 1);
    assert.equal(step2.updatedData.caroline_views_count, 1);
    assert.ok(step2.updatedData.caroline_seen_at);

    // 3rd step: Stéphane views it again
    const step3 = incrementMemoryView(step2.newCaption, "stephane");
    assert.equal(step3.updatedData.stephane_views_count, 2);
    assert.equal(step3.updatedData.caroline_views_count, 1);

    // 4th step: ensure quote & notes are never lost
    const withNote = serializeMemoryData({
        ...step3.updatedData,
        note_stephane: "Toujours aussi beau !",
    });
    const step4 = incrementMemoryView(withNote, "caroline");
    assert.equal(step4.updatedData.note_stephane, "Toujours aussi beau !");
    assert.equal(step4.updatedData.caroline_views_count, 2);
});

// ─── 4. getTotalViews & getAffectionLevel ───

test("getTotalViews & getAffectionLevel: maps affection tiers", () => {
    assert.equal(getAffectionLevel(0).tier, 0);
    assert.equal(getAffectionLevel(0).label, "À découvrir");

    assert.equal(getAffectionLevel(1).tier, 1);
    assert.equal(getAffectionLevel(1).label, "Découverte");
    assert.equal(getAffectionLevel(4).tier, 1);

    assert.equal(getAffectionLevel(5).tier, 2);
    assert.equal(getAffectionLevel(5).label, "Nostalgie douce");
    assert.equal(getAffectionLevel(9).tier, 2);

    assert.equal(getAffectionLevel(10).tier, 3);
    assert.equal(getAffectionLevel(10).label, "Coup de foudre");
    assert.equal(getAffectionLevel(19).tier, 3);

    assert.equal(getAffectionLevel(20).tier, 4);
    assert.equal(getAffectionLevel(20).label, "Trésor absolu");
    assert.equal(getAffectionLevel(100).tier, 4);
});

// ─── 5. computeCoupleStats ───

test("computeCoupleStats: handles empty memories gracefully without error", () => {
    const emptyStats = computeCoupleStats([]);
    assert.equal(emptyStats.totalViews, 0);
    assert.equal(emptyStats.stephaneTotalViews, 0);
    assert.equal(emptyStats.carolineTotalViews, 0);
    assert.equal(emptyStats.stephanePercent, 50);
    assert.equal(emptyStats.carolinePercent, 50);
    assert.equal(emptyStats.leader, "tie");
    assert.equal(emptyStats.mostViewedMemory, null);
    assert.equal(emptyStats.topMemories.length, 0);
    assert.equal(emptyStats.distinctMemoriesViewed, 0);
    assert.equal(emptyStats.unviewedMemoriesCount, 0);
    assert.equal(emptyStats.isPerfectDay, false);
});

test("computeCoupleStats: computes leader, duels, shared memories and daily presence", () => {
    const todayISO = new Date().toISOString();
    const mockMemories: Memory[] = [
        {
            id: "mem-1",
            image_url: "https://example.com/1.jpg",
            caption: JSON.stringify({
                quote: "Plage au coucher du soleil",
                stephane_views_count: 12,
                caroline_views_count: 6,
                stephane_seen_at: todayISO,
                caroline_seen_at: null,
                note_stephane: "Merveilleux",
                note_caroline: "Oui tellement",
            }),
            is_favorite: true,
            is_daily_pick: false,
            user_id: "user-1",
            created_at: "2026-01-01T00:00:00Z",
        },
        {
            id: "mem-2",
            image_url: "https://example.com/2.jpg",
            caption: JSON.stringify({
                quote: "Balade en forêt",
                stephane_views_count: 3,
                caroline_views_count: 5,
                stephane_seen_at: null,
                caroline_seen_at: todayISO,
                note_stephane: "",
                note_caroline: "Bisou mon amour",
            }),
            is_favorite: false,
            is_daily_pick: false,
            user_id: "user-1",
            created_at: "2026-01-02T00:00:00Z",
        },
        {
            id: "mem-3",
            image_url: "https://example.com/3.jpg",
            caption: "plain text without views",
            is_favorite: true,
            is_daily_pick: false,
            user_id: "user-1",
            created_at: "2026-01-03T00:00:00Z",
        },
    ];

    const stats = computeCoupleStats(mockMemories);

    assert.equal(stats.stephaneTotalViews, 15);
    assert.equal(stats.carolineTotalViews, 11);
    assert.equal(stats.totalViews, 26);
    assert.equal(stats.stephanePercent, 58);
    assert.equal(stats.carolinePercent, 42);
    assert.equal(stats.leader, "stephane");
    assert.equal(stats.leaderDifference, 4);
    assert.ok(stats.leaderComment.includes("Stéphane"));

    // Notes: mem-1 has 2 notes (Steph + Caro), mem-2 has 1 note (Caro) = 3 total notes
    assert.equal(stats.notesCount, 3);
    assert.equal(stats.favoritesCount, 2);
    assert.equal(stats.sharedMemoriesCount, 2); // mem-1 and mem-2 viewed by both
    assert.equal(stats.distinctMemoriesViewed, 2);
    assert.equal(stats.unviewedMemoriesCount, 1); // mem-3 has 0 views

    // Both viewed today
    assert.equal(stats.todayViews.stephane, true);
    assert.equal(stats.todayViews.caroline, true);
    assert.equal(stats.isPerfectDay, true);

    // Top memory
    assert.ok(stats.mostViewedMemory);
    assert.equal(stats.mostViewedMemory.memory.id, "mem-1");
    assert.equal(stats.mostViewedMemory.totalViews, 18);
});

// ─── 6. computeCoupleBadges ───

test("computeCoupleBadges: unlocks badges based on stats milestones", () => {
    const stats: CoupleStats = {
        stephaneTotalViews: 15, // >= 15
        carolineTotalViews: 14, // < 15
        totalViews: 29,
        stephanePercent: 52,
        carolinePercent: 48,
        leader: "stephane",
        leaderDifference: 1,
        leaderComment: "Stéphane mène",
        mostViewedMemory: {
            memory: {} as Memory,
            parsed: {} as MemoryParsedData,
            totalViews: 11, // >= 10
        },
        topMemories: [],
        favoritesCount: 5, // >= 5
        notesCount: 3, // >= 3
        sharedMemoriesCount: 5, // >= 5
        distinctMemoriesViewed: 10, // >= 10
        unviewedMemoriesCount: 2,
        daysTogether: 9000, // >= 8000
        todayViews: { stephane: true, caroline: true },
        isPerfectDay: true, // synchro
    };

    const badges = computeCoupleBadges(stats);
    const badgeMap = Object.fromEntries(badges.map((b) => [b.id, b]));

    assert.equal(badgeMap["badge_steph_gaze"].isUnlocked, true);
    assert.equal(badgeMap["badge_caro_gaze"].isUnlocked, false);
    assert.equal(badgeMap["badge_favorites"].isUnlocked, true);
    assert.equal(badgeMap["badge_love_notes"].isUnlocked, true);
    assert.equal(badgeMap["badge_soulmates"].isUnlocked, true);
    assert.equal(badgeMap["badge_obsession"].isUnlocked, true);
    assert.equal(badgeMap["badge_vault_explorer"].isUnlocked, true);
    assert.equal(badgeMap["badge_days_8000"].isUnlocked, true);
    assert.equal(badgeMap["badge_perfect_sync"].isUnlocked, true);
});
