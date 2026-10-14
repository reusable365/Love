import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BD4_W9g3CC3XlqzxLdp-f46NyIM60vSulspifctMlzzx74UzqUon9cjmG6TpIiht2q4_08v40sTBDQHxWdyW0iU";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "eHSj2PpTQYbON5wiXnQtXFr2bqvqqgjVL23InYfFSBI";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:stephanecadario@gmail.com";

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { recipient, senderName, senderEmoji, noteSnippet } = body;

        if (!recipient) {
            return NextResponse.json({ error: "Missing recipient" }, { status: 400 });
        }

        const sb = createClient(supabaseUrl, supabaseServiceKey);

        // Fetch recipient's push subscription from Supabase Storage
        const filePath = `subscriptions/${recipient}.json`;
        const { data: fileData, error: downloadError } = await sb.storage
            .from("vault")
            .download(filePath);

        if (downloadError || !fileData) {
            console.log(`No push subscription found for ${recipient}`);
            return NextResponse.json({ success: false, reason: "no_subscription" });
        }

        const subscriptionText = await fileData.text();
        const subscription = JSON.parse(subscriptionText);

        const title = `${senderEmoji || "💌"} Mot doux de ${senderName || "ton amour"}`;
        const preview = noteSnippet
            ? (noteSnippet.length > 90 ? noteSnippet.slice(0, 90) + "..." : noteSnippet)
            : "Un nouveau mot doux vient d'être écrit pour toi 💖";

        const pushPayload = JSON.stringify({
            title,
            body: preview,
            icon: "/icon.svg",
            url: "/",
        });

        await webpush.sendNotification(subscription, pushPayload);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error("Error sending push notification:", err);
        return NextResponse.json({ error: err.message || "Failed to send push" }, { status: 500 });
    }
}
