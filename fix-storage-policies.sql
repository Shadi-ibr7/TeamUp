-- Politiques RLS pour le bucket avatars
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Permettre aux utilisateurs de télécharger leurs propres avatars
CREATE POLICY "Users can upload their own avatars"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 2. Permettre la lecture publique des avatars
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- 3. Permettre aux utilisateurs de mettre à jour leurs propres avatars
CREATE POLICY "Users can update their own avatars"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Permettre aux utilisateurs de supprimer leurs propres avatars
CREATE POLICY "Users can delete their own avatars"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. POLITIQUE PERMISSIVE POUR LES IMAGES D'ÉVÉNEMENTS
-- Permet à tous les utilisateurs authentifiés d'uploader des images d'événements
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- 6. Permettre la mise à jour d'images d'événements par les utilisateurs authentifiés
CREATE POLICY "Authenticated users can update event images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
);

-- 7. Permettre la suppression d'images d'événements par les utilisateurs authentifiés
CREATE POLICY "Authenticated users can delete event images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.role() = 'authenticated'
); 