"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSupabase, Memory, Soundtrack } from "@/lib/supabase";

/* ═══════════════════════════════════════════════
   MEMORIES
   ═══════════════════════════════════════════════ */

export function useMemories() {
    return useQuery<Memory[]>({
        queryKey: ["memories"],
        queryFn: async () => {
            const { data, error } = await getSupabase()
                .from("memories")
                .select("*")
                .order("created_at", { ascending: false })
                .order("id", { ascending: true });
            if (error) throw error;
            return data ?? [];
        },
    });
}

export function useDailyPickMemory() {
    return useQuery<Memory | null>({
        queryKey: ["memories", "daily-pick"],
        queryFn: async () => {
            const { data, error } = await getSupabase()
                .from("memories")
                .select("*")
                .eq("is_daily_pick", true)
                .limit(1)
                .maybeSingle();
            if (error) throw error;
            return data;
        },
    });
}

export function useSetDailyPickMemory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (memoryId: string) => {
            const sb = getSupabase();
            const { error: setError } = await sb
                .from("memories")
                .update({ is_daily_pick: true })
                .eq("id", memoryId);
            if (setError) throw setError;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["memories"] });
        },
    });
}

export function useClearDailyPickMemory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const { error } = await getSupabase()
                .from("memories")
                .update({ is_daily_pick: false })
                .eq("is_daily_pick", true);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["memories"] });
        },
    });
}

export function useAddMemory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            image_url,
            caption,
            is_daily_pick = false,
        }: {
            image_url: string;
            caption: string;
            is_daily_pick?: boolean;
        }) => {
            const sb = getSupabase();
            // No need to manually reset others, the DB trigger handles it.

            const { data, error } = await sb
                .from("memories")
                .insert({ image_url, caption, is_daily_pick })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["memories"] });
        },
    });
}

/* ═══════════════════════════════════════════════
   SOUNDTRACKS
   ═══════════════════════════════════════════════ */

export function useSoundtracks() {
    return useQuery<Soundtrack[]>({
        queryKey: ["soundtracks"],
        queryFn: async () => {
            const { data, error } = await getSupabase()
                .from("soundtracks")
                .select("*")
                .order("title", { ascending: true })
                .order("id", { ascending: true });
            if (error) throw error;
            return data ?? [];
        },
    });
}

export function useDailyPickSoundtrack() {
    return useQuery<Soundtrack | null>({
        queryKey: ["soundtracks", "daily-pick"],
        queryFn: async () => {
            const { data, error } = await getSupabase()
                .from("soundtracks")
                .select("*")
                .eq("is_daily_pick", true)
                .limit(1)
                .maybeSingle();
            if (error) throw error;
            return data;
        },
    });
}

export function useSetDailyPickSoundtrack() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (soundtrackId: string) => {
            const sb = getSupabase();
            const { error: setError } = await sb
                .from("soundtracks")
                .update({ is_daily_pick: true })
                .eq("id", soundtrackId);
            if (setError) throw setError;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["soundtracks"] });
        },
    });
}

export function useClearDailyPickSoundtrack() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async () => {
            const { error } = await getSupabase()
                .from("soundtracks")
                .update({ is_daily_pick: false })
                .eq("is_daily_pick", true);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["soundtracks"] });
        },
    });
}

export function useAddSoundtrack() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            title,
            artist,
            type,
            src_url,
            is_daily_pick = false,
        }: {
            title: string;
            artist: string;
            type: "mp3" | "youtube";
            src_url: string;
            is_daily_pick?: boolean;
        }) => {
            const sb = getSupabase();
            // No need to manually reset others, the DB trigger handles it.

            const { data, error } = await sb
                .from("soundtracks")
                .insert({ title, artist, type, src_url, is_daily_pick })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["soundtracks"] });
        },
    });
}
