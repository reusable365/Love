import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
    try {
        const { image_url } = await req.json();

        if (!image_url) {
            return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
        }

        // Fetch the image to send to Gemini
        const imageResponse = await fetch(image_url);
        if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
        }
        const imageBuffer = await imageResponse.arrayBuffer();

        // Convert Buffer to Base64
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

        // Initialize Gemini
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const prompt = `Voici une photo ajoutée dans notre coffre-fort numérique de souvenirs de couple.
Analyse discrètement le contenu visuel (personnes, expressions, décor, météo ou ambiance).
Écris une SEULE phrase très courte, romantique et poétique (façon "Good Vibe") qui pourrait servir de belle légende souvenir au dos de cette photo.
Ton ton doit être complice, bienveillant, et s'adresser à "nous" ou au conjoint.
Ne mets aucun guillemet autour de ta phrase, et sois créatif par rapport à ce que tu vois.
Exemples de format attendu:
- "Même sous la pluie de Paris, tu restes mon seul rayon de soleil."
- "Nos éclats de rire face à cet océan valent tout l'or du monde."
- "Prendre un café n'a jamais été aussi doux qu'à tes côtés ce matin-là."
À toi, donne-moi juste la phrase :`;

        const request = {
            model: "gemini-1.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        { inlineData: { data: base64Image, mimeType: mimeType } },
                        { text: prompt }
                    ]
                }
            ]
        };

        const response = await ai.models.generateContent(request);
        let quote = response.text?.trim() || "Un bel instant capturé à deux.";

        // Remove quotes if the AI adds them despite instructions
        quote = quote.replace(/^["']|["']$/g, '').trim();

        return NextResponse.json({ quote });

    } catch (error) {
        console.error("Gemini Vision API error:", error);
        return NextResponse.json({ error: "Failed to generate quote", details: (error as Error).message }, { status: 500 });
    }
}
