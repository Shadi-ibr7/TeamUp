-- Script pour mettre à jour les coordonnées des événements de l'utilisateur
-- Exécutez ce script dans votre Supabase SQL Editor

-- 1. Mettre à jour les événements avec des coordonnées aléatoires autour de Paris
-- (Simulation de géocodification pour les événements existants)
UPDATE events 
SET 
  latitude = 48.8566 + (RANDOM() - 0.5) * 0.05,  -- ±0.05 degrés autour de Paris
  longitude = 2.3522 + (RANDOM() - 0.5) * 0.05
WHERE organizer_id = auth.uid()
  AND (latitude IS NULL OR longitude IS NULL OR latitude = 48.8566);

-- 2. Vérifier les événements mis à jour
SELECT 
  id,
  title,
  location,
  latitude,
  longitude,
  date,
  time,
  sport_type,
  is_active
FROM events 
WHERE organizer_id = auth.uid()
ORDER BY created_at DESC;

-- 3. Tester si vos événements apparaissent maintenant dans events_nearby
SELECT 
  'Vos événements dans un rayon de 50km de Paris:' as test_info,
  COUNT(*) as events_found
FROM events_nearby(48.8566, 2.3522, 50)
WHERE organizer_id = auth.uid();

-- 4. Afficher vos événements avec leurs nouvelles coordonnées
SELECT 
  id,
  title,
  location,
  latitude,
  longitude,
  distance_km
FROM events_nearby(48.8566, 2.3522, 50)
WHERE organizer_id = auth.uid()
ORDER BY distance_km;

-- Message de confirmation
SELECT 'Vos événements ont été mis à jour avec de nouvelles coordonnées. Vérifiez votre carte !' as status; 