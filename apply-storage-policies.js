// Script pour appliquer les politiques de stockage Supabase
// Nécessite SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans les variables d'environnement

const { createClient } = require('@supabase/supabase-js');

// Configuration Supabase (utiliser les clés de service pour les opérations admin)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes:');
  console.error('   - SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('💡 Pour obtenir ces clés:');
  console.error('   1. Allez dans votre projet Supabase');
  console.error('   2. Settings > API');
  console.error('   3. Copiez Project URL et service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyStoragePolicies() {
  console.log('🔧 Application des politiques de stockage...');
  
  try {
    // Politiques SQL à exécuter
    const policies = [
      // Politique permissive pour l'upload d'images d'événements
      `
      DROP POLICY IF EXISTS "Authenticated users can upload event images" ON storage.objects;
      CREATE POLICY "Authenticated users can upload event images"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
      );
      `,
      
      // Politique pour la mise à jour d'images d'événements
      `
      DROP POLICY IF EXISTS "Authenticated users can update event images" ON storage.objects;
      CREATE POLICY "Authenticated users can update event images"
      ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
      );
      `,
      
      // Politique pour la suppression d'images d'événements
      `
      DROP POLICY IF EXISTS "Authenticated users can delete event images" ON storage.objects;
      CREATE POLICY "Authenticated users can delete event images"
      ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'avatars' 
        AND auth.role() = 'authenticated'
      );
      `
    ];

    for (const policy of policies) {
      const { error } = await supabase.rpc('exec_sql', { sql: policy });
      if (error) {
        console.error('❌ Erreur lors de l\'application de la politique:', error);
      } else {
        console.log('✅ Politique appliquée avec succès');
      }
    }

    console.log('🎉 Toutes les politiques ont été appliquées !');
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'application des politiques:', error);
  }
}

// Exécuter le script
applyStoragePolicies(); 