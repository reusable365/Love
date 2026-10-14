const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Clés Supabase manquantes dans .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Fisher-Yates Shuffle
function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

async function reseedCycle() {
    console.log('🚀 Démarrage de la reprogrammation du cycle...');

    // 1. Récupérer toutes les photos
    const { data: memories, error: fetchErr } = await supabase
        .from('memories')
        .select('id, caption')
        .order('id');

    if (fetchErr || !memories || memories.length === 0) {
        console.error('❌ Erreur récupération memories:', fetchErr);
        process.exit(1);
    }

    console.log(`📸 ${memories.length} souvenirs trouvés.`);

    // 2. Réinitialiser tous les is_daily_pick à false
    console.log('🧹 Réinitialisation des is_daily_pick...');
    const { error: resetPickErr } = await supabase
        .from('memories')
        .update({ is_daily_pick: false })
        .eq('is_daily_pick', true);

    if (resetPickErr) {
        console.warn('⚠️ Avertissement reset is_daily_pick:', resetPickErr);
    }

    // 3. Mélanger aléatoirement toutes les photos
    const shuffled = shuffleArray(memories);
    console.log('🔀 Photos mélangées de façon aléatoire.');

    // 4. Assigner les dates à partir d'aujourd'hui
    // Heure de midi (12:00:00) pour éviter tout problème de décalage de fuseau horaire
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    console.log(`📅 Programmation du ${today.toLocaleDateString('fr-FR')} jusqu'au ...`);

    let updatedCount = 0;
    // Mise à jour par lots pour être rapide et fiable
    const batchSize = 25;
    for (let i = 0; i < shuffled.length; i += batchSize) {
        const batch = shuffled.slice(i, i + batchSize);
        await Promise.all(
            batch.map(async (mem, batchIdx) => {
                const dayOffset = i + batchIdx;
                const targetDate = new Date(today);
                targetDate.setDate(today.getDate() + dayOffset);

                const { error: updateErr } = await supabase
                    .from('memories')
                    .update({
                        created_at: targetDate.toISOString(),
                        is_daily_pick: false // Aucun pick fixe
                    })
                    .eq('id', mem.id);

                if (updateErr) {
                    console.error(`❌ Erreur pour ${mem.id}:`, updateErr.message);
                } else {
                    updatedCount++;
                }
            })
        );
        process.stdout.write(`   ${updatedCount}/${shuffled.length} programmés...\r`);
    }

    const lastDay = new Date(today);
    lastDay.setDate(today.getDate() + shuffled.length - 1);

    console.log(`\n✅ Terminé ! ${updatedCount} photos programmées.`);
    console.log(`🌟 Début : ${today.toLocaleDateString('fr-FR')}`);
    console.log(`🌟 Fin : ${lastDay.toLocaleDateString('fr-FR')}`);
    console.log(`👉 Photo d'aujourd'hui : "${shuffled[0].caption}" (id: ${shuffled[0].id})`);
}

reseedCycle();
