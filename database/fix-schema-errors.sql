-- ======================================
-- CORRECTION DES ERREURS DE SCHÉMA
-- ======================================

-- 1. Ajouter la colonne image_url à la table events (si elle n'existe pas)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Créer l'index sur image_url (maintenant que la colonne existe)
CREATE INDEX IF NOT EXISTS idx_events_image_url ON public.events(image_url) WHERE image_url IS NOT NULL;

-- 3. Mettre à jour la configuration du bucket de stockage
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  10485760, -- 10MB limit (augmenté pour les images d'événements)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic'];

-- 4. Activer RLS sur storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. Supprimer les anciennes politiques de stockage
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete event images" ON storage.objects;

-- 6. Créer les nouvelles politiques de stockage
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 7. POLITIQUES PERMISSIVES POUR LES IMAGES D'ÉVÉNEMENTS
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can update event images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete event images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- 8. Créer ou mettre à jour les fonctions
CREATE OR REPLACE FUNCTION format_event_date(event_date DATE, event_time TIME)
RETURNS TEXT AS $$
BEGIN
  RETURN TO_CHAR(event_date, 'DD/MM/YYYY') || ' à ' || TO_CHAR(event_time, 'HH24:MI');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
  total_events INTEGER,
  events_created INTEGER,
  friends_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT ep.event_id)::INTEGER as total_events,
    COUNT(DISTINCT e.id)::INTEGER as events_created,
    (SELECT COUNT(*)::INTEGER FROM public.event_participants ep2 
     WHERE ep2.user_id = user_uuid AND ep2.status = 'confirmed') as friends_count
  FROM public.event_participants ep
  LEFT JOIN public.events e ON e.organizer_id = user_uuid
  WHERE ep.user_id = user_uuid AND ep.status = 'confirmed';
END;
$$ LANGUAGE plpgsql;

-- 9. Mettre à jour la fonction events_nearby pour inclure image_url
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
    (ll_to_earth(lat::float8, lng::float8) <-> ll_to_earth(e.latitude::float8, e.longitude::float8)) / 1000 as distance_km
  FROM public.events e
  WHERE e.is_active = TRUE
    AND (ll_to_earth(lat::float8, lng::float8) <-> ll_to_earth(e.latitude::float8, e.longitude::float8)) / 1000 <= radius_km
  ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Message de confirmation
SELECT 'Correction du schéma terminée avec succès!' as status; 