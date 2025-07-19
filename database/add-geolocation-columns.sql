-- Ajouter les colonnes de géolocalisation à la table events si elles n'existent pas
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Mettre à jour les événements existants avec des coordonnées par défaut (Paris) si elles sont NULL
UPDATE events 
SET 
  latitude = 48.8566 + (RANDOM() - 0.5) * 0.1,
  longitude = 2.3522 + (RANDOM() - 0.5) * 0.1
WHERE latitude IS NULL OR longitude IS NULL; 