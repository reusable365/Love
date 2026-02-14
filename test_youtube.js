// Petit script de test pour vérifier la lecture des liens YouTube
const links = [
    "https://youtu.be/gFkUVik35U8?si=dtUS8dYI8oe7R8Qp",
    "https://youtu.be/kOyppPxwji0?si=JLawLDkorOU2nEs0",
    "https://youtu.be/7zp7tHh6h28?si=5AGPpaQO6F6lsNjS",
    "https://youtu.be/UqyT8IEBkvY?si=cZXbS6JY2jaWfgrU",
    "https://youtu.be/G-DRT6rLQIA?si=RFAiEBbdpGwWJYS2",
    "https://youtu.be/98W9QuMq-2k?si=goESZ9T0PLe0-CqA"
];

function extractYouTubeId(url) {
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

console.log("🔍 Vérification de la lecture des liens YouTube :");
links.forEach(link => {
    const id = extractYouTubeId(link);
    console.log(`✅ Lien : ${link}\n   🆔 ID extrait : ${id || "❌ ÉCHEC"}\n`);
});
