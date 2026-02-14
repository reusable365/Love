const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Charge les variables .env.local
dotenv.config({ path: '.env.local' });

// RÉCUPÉRATION DES CLÉS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// ⚠️ IMPORTANT : On utilise la SERVICE_ROLE_KEY pour avoir tous les droits d'écriture
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Erreur: Clés Supabase manquantes dans .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// CONFIGURATION
const LOCAL_PHOTOS_FOLDER = './mes_photos'; // Assure-toi que ce dossier existe !
const BUCKET_NAME = 'vault';

// --- TA LISTE DE LIENS ---
const YOUTUBE_LINKS = [
    'https://youtu.be/gFkUVik35U8?si=dtUS8dYI8oe7R8Qp',
    'https://youtu.be/kOyppPxwji0?si=JLawLDkorOU2nEs0',
    'https://youtu.be/7zp7tHh6h28?si=5AGPpaQO6F6lsNjS',
    'https://youtu.be/UqyT8IEBkvY?si=cZXbS6JY2jaWfgrU',
    'https://youtu.be/G-DRT6rLQIA?si=RFAiEBbdpGwWJYS2',
    'https://youtu.be/98W9QuMq-2k?si=goESZ9T0PLe0-CqA'
];

async function fetchYoutubeMetadata(url) {
    try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const response = await fetch(oembedUrl);
        if (!response.ok) return null;
        const data = await response.json();
        return {
            title: data.title,
            author_name: data.author_name
        };
    } catch (e) {
        console.warn(`⚠️ Impossible de récupérer les infos pour ${url}`);
        return null;
    }
}

async function smartSeed() {
    console.log('🚀 Démarrage de l\'importation réelle...');

    // 0. NETTOYAGE PRÉALABLE (Active pour supprimer les démos !)
    console.log('🧹 Grand nettoyage de printemps...');
    await supabase.from('soundtracks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('memories').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // 1. UPLOAD DES PHOTOS (Depuis ton dossier ordi)
    if (fs.existsSync(LOCAL_PHOTOS_FOLDER)) {
        const files = fs.readdirSync(LOCAL_PHOTOS_FOLDER);
        console.log(`📸 J'ai trouvé ${files.length} photos dans le dossier "${LOCAL_PHOTOS_FOLDER}".`);

        for (const fileName of files) {
            if (fileName.startsWith('.')) continue; // Ignore les fichiers cachés

            console.log(`➡️  Envoi de : ${fileName}...`);
            const filePath = path.join(LOCAL_PHOTOS_FOLDER, fileName);
            const fileBuffer = fs.readFileSync(filePath);

            // A. Upload vers Storage
            const { error: uploadError } = await supabase.storage
                .from(BUCKET_NAME)
                .upload(`photos/${fileName}`, fileBuffer, { upsert: true });

            if (uploadError) {
                console.error(`❌ Erreur upload ${fileName}:`, uploadError.message);
                continue;
            }

            // B. Récupération URL
            const { data: { publicUrl } } = supabase.storage
                .from(BUCKET_NAME)
                .getPublicUrl(`photos/${fileName}`);

            // C. Création entrée Base de Données
            const { error: dbError } = await supabase.from('memories').insert({
                image_url: publicUrl,
                caption: `Souvenir : ${fileName}`,
                is_daily_pick: false
            });

            if (dbError) console.error(`❌ Erreur DB pour ${fileName}:`, dbError.message);
        }
        console.log('✅ Toutes les photos sont en ligne !');
    } else {
        console.warn(`⚠️  ATTENTION : Le dossier "${LOCAL_PHOTOS_FOLDER}" n'existe pas. Création du dossier vide...`);
        fs.mkdirSync(LOCAL_PHOTOS_FOLDER);
    }

    // 2. IMPORT DES MUSIQUES AVEC INFOS AUTOMATIQUES
    console.log('🎵 Analyse de ta playlist YouTube...');
    const soundtracksToInsert = [];

    for (const [index, link] of YOUTUBE_LINKS.entries()) {
        console.log(`🔎 Recherche infos pour : ${link}`);
        const meta = await fetchYoutubeMetadata(link);

        soundtracksToInsert.push({
            title: meta ? meta.title : `Chanson mystère ${index + 1}`,
            artist: meta ? meta.author_name : 'Artiste inconnu',
            type: 'youtube',
            src_url: link,
            // La première musique de la liste sera la surprise du jour
            is_daily_pick: index === 0
        });
    }

    console.log(`🎶 Envoi de ${soundtracksToInsert.length} chansons vers la base...`);
    const { error: musicError } = await supabase.from('soundtracks').insert(soundtracksToInsert);

    if (musicError) {
        console.error('❌ Erreur musique:', musicError.message);
    } else {
        console.log('✅ Liste de lecture mise à jour !');
    }

    console.log('✨ Terminé ! Ton coffre-fort est rempli.');
}

smartSeed().catch(console.error);