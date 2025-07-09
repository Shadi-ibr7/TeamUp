// Configuration Supabase pour TeamUp
// 
// 1. Créez un projet sur https://supabase.com
// 2. Récupérez vos clés dans Settings > API
// 3. Créez un fichier .env à la racine du projet avec :
//
// EXPO_PUBLIC_SUPABASE_URL=votre_url_projet
// EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_clé_anon

export const config = {
  supabase: {
    url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL',
 