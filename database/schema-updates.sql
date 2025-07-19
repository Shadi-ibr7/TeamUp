-- ======================================
-- AJOUTS ET CORRECTIONS POUR LE SCHÉMA EXISTANT
-- ======================================

-- 1. Ajouter une colonne pour les images d'événements dans la table events
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 2. Supprimer les politiques de stockage existantes pour éviter les conflits
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update event images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete event images" ON storage.objects;

-- 3. Créer les nouvelles politiques de stockage permissives
-- Politique pour permettre l'upload d'avatars par les utilisateurs
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique pour permettre la lecture publique des avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- Politique pour permettre la mise à jour d'avatars par les utilisateurs
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique pour permettre la suppression d'avatars par les utilisateurs
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. POLITIQUES PERMISSIVES POUR LES IMAGES D'ÉVÉNEMENTS
-- Permet à tous les utilisateurs authentifiés d'uploader des images d'événements
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Permet la mise à jour d'images d'événements par les utilisateurs authentifiés
CREATE POLICY "Authenticated users can update event images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- Permet la suppression d'images d'événements par les utilisateurs authentifiés
CREATE POLICY "Authenticated users can delete event images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- 5. Ajouter une politique pour permettre la mise à jour des événements avec images
DROP POLICY IF EXISTS "Organizers can update their events with images" ON public.events;
CREATE POLICY "Organizers can update their events with images" ON public.events
  FOR UPDATE USING (auth.uid() = organizer_id);

-- 6. Fonction pour formater les dates d'événements (si elle n'existe pas)
CREATE OR REPLACE FUNCTION format_event_date(event_date DATE, event_time TIME)
RETURNS TEXT AS $$
BEGIN
  RETURN TO_CHAR(event_date, 'DD/MM/YYYY') || ' à ' || TO_CHAR(event_time, 'HH24:MI');
END;
$$ LANGUAGE plpgsql;

-- 7. Index pour améliorer les performances des recherches d'événements avec images
CREATE INDEX IF NOT EXISTS idx_events_image_url ON public.events(image_url) WHERE image_url IS NOT NULL;

-- 8. Fonction pour obtenir les statistiques d'un utilisateur
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

-- 9. Vérifier que le bucket avatars existe et est configuré correctement
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

-- 10. Activer RLS sur storage.objects si ce n'est pas déjà fait
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Message de confirmation
SELECT 'Mise à jour du schéma terminée avec succès!' as status; 