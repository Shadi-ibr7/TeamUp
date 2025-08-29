-- Script pour mettre à jour les coordonnées des événements existants
-- Ce script utilise des coordonnées approximatives pour Paris et sa région

-- Mettre à jour les événements qui n'ont pas de coordonnées
UPDATE events
SET 
  latitude = CASE 
    WHEN location LIKE '%Paris%' THEN 48.8566 + (RANDOM() * 0.1 - 0.05)
    WHEN location LIKE '%Boulogne%' THEN 48.8396 + (RANDOM() * 0.02 - 0.01)
    WHEN location LIKE '%Neuilly%' THEN 48.8846 + (RANDOM() * 0.02 - 0.01)
    WHEN location LIKE '%Levallois%' THEN 48.8936 + (RANDOM() * 0.02 - 0.01)
    WHEN location LIKE '%Issy%' THEN 48.8240 + (RANDOM() * 0.02 - 0.01)
    WHEN location LIKE '%Courbevoie%' THEN 48.8973 + (RANDOM() * 0.02 - 0.01)
    WHEN location LIKE '%Puteaux%' THEN 48.8846 + (RANDOM() * 0.02 - 0.01)
    WHEN location LIKE '%Nanterre%' THEN 48.8924 + (RANDOM() * 0.02 - 0.01)
    WHEN location LIKE '%Saint-Denis%' THEN 48.9362 + (RANDOM() * 0.02 - 0.01)
    WHEN location LIKE '%Montreuil%' THEN 48.8634 + (RANDOM() * 0.02 - 0.01)
    WHEN location LIKE '%Vincennes%' THEN 48.8473 + (RANDOM() * 0.02 - 0.01)
    WHEN location LIKE '%Clichy%' THEN 48.9038 + (RANDOM() * 0.02 - 0.01)
    ELSE 48.8566 + (RANDOM() * 0.2 - 0.1) -- Paris par défaut avec variation
  END,
  longitude = CASE 
    WHEN location LIKE '%Paris%' THEN 2.3522 + (RANDOM() * 0.1 - 0.05)
    WHEN location LIKE '%Boulogne%' THEN 2.2399 + (RANDOM() * 0.02 - 0.01)
    WHEN location LIKE '%Neuilly%' THEN 2.2688 + (RANDOM() * 0.02 - 0.01)
    WHEN location LIKE '%Levallois%' THEN 2.2870 + (RANDOM() * 0.02 - 0.01)
    WHEN location LIKE '%Issy%' THEN 2.2700 + (RANDOM() * 0.02 - 0.01)
    WHEN location LIKE '%Courbevoie%' THEN 2.2523 + (RANDOM() * 0.02 - 0.01)
    WHEN location LIKE '%Puteaux%' THEN 2.2388 + (RANDOM() * 0.02 - 0.01)
    WHEN location LIKE '%Nanterre%' THEN 2.2068 + (RANDOM() * 0.02 - 0.01)
    WHEN location LIKE '%Saint-Denis%' THEN 2.3574 + (RANDOM() * 0.02 - 0.01)
    WHEN location LIKE '%Montreuil%' THEN 2.4487 + (RANDOM() * 0.02 - 0.01)
    WHEN location LIKE '%Vincennes%' THEN 2.4373 + (RANDOM() * 0.02 - 0.01)
    WHEN location LIKE '%Clichy%' THEN 2.3064 + (RANDOM() * 0.02 - 0.01)
    ELSE 2.3522 + (RANDOM() * 0.2 - 0.1) -- Paris par défaut avec variation
  END
WHERE latitude IS NULL OR longitude IS NULL;

-- Vérifier le résultat
SELECT id, title, location, latitude, longitude 
FROM events 
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 10;

