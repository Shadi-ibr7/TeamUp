-- Corriger la fonction events_nearby pour retourner le bon type de données
CREATE OR REPLACE FUNCTION events_nearby(
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  radius_km INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  date DATE,
  "time" TIME,
  sport_type TEXT,
  max_participants INTEGER,
  current_participants INTEGER,
  organizer_id UUID,
  image_url TEXT,
  distance_km DECIMAL(10, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.title,
    e.description,
    e.location,
    e.latitude,
    e.longitude,
    e.date,
    e."time",
    e.sport_type,
    e.max_participants,
    e.current_participants,
    e.organizer_id,
    e.image_url,
    CAST((ll_to_earth(lat::float8, lng::float8) <-> ll_to_earth(e.latitude::float8, e.longitude::float8)) / 1000 AS DECIMAL(10, 2)) as distance_km
  FROM public.events e
  WHERE e.is_active = TRUE
    AND (ll_to_earth(lat::float8, lng::float8) <-> ll_to_earth(e.latitude::float8, e.longitude::float8)) / 1000 <= radius_km
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql; 