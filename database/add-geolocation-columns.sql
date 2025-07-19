-- Ajouter les colonnes de géolocalisation à la table events
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Ajouter un index pour optimiser les requêtes géospatiales
CREATE INDEX IF NOT EXISTS idx_events_location ON events(latitude, longitude);

-- Ajouter une contrainte pour s'assurer que les coordonnées sont valides
ALTER TABLE events 
ADD CONSTRAINT check_latitude CHECK (latitude >= -90 AND latitude <= 90),
ADD CONSTRAINT check_longitude CHECK (longitude >= -180 AND longitude <= 180);

-- Mettre à jour les événements existants avec des coordonnées par défaut (Paris)
UPDATE events 
SET 
  latitude = 48.8566 + (RANDOM() - 0.5) * 0.1,
  longitude = 2.3522 + (RANDOM() - 0.5) * 0.1
WHERE latitude IS NULL OR longitude IS NULL;

-- Créer une fonction pour calculer la distance entre deux points
CREATE OR REPLACE FUNCTION calculate_distance(
  lat1 DECIMAL,
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  RETURN 6371 * acos(
    cos(radians(lat1)) * cos(radians(lat2)) * cos(radians(lon2) - radians(lon1)) +
    sin(radians(lat1)) * sin(radians(lat2))
  );
END;
$$ LANGUAGE plpgsql;

-- Créer une fonction pour récupérer les événements dans un rayon donné
CREATE OR REPLACE FUNCTION get_events_within_radius(
  user_lat DECIMAL,
  user_lon DECIMAL,
  radius_km DECIMAL DEFAULT 10
) RETURNS TABLE (
  id INTEGER,
  title TEXT,
  location TEXT,
  distance DECIMAL,
  sport_type TEXT,
  date DATE,
  time TIME,
  max_participants INTEGER,
  current_participants INTEGER,
  price DECIMAL,
  description TEXT,
  image_url TEXT,
  latitude DECIMAL,
  longitude DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.location,
    calculate_distance(user_lat, user_lon, e.latitude, e.longitude) as distance,
    e.sport_type,
    e.date,
    e.time,
    e.max_participants,
    e.current_participants,
    e.price,
    e.description,
    e.image_url,
    e.latitude,
    e.longitude
  FROM events e
  WHERE e.status = 'active'
    AND e.date >= CURRENT_DATE
    AND e.latitude IS NOT NULL
    AND e.longitude IS NOT NULL
    AND calculate_distance(user_lat, user_lon, e.latitude, e.longitude) <= radius_km
  ORDER BY distance ASC;
END;
$$ LANGUAGE plpgsql; 