-- Correction des politiques de stockage pour permettre l'upload d'images d'événements
-- Ce fichier doit être exécuté dans Supabase SQL Editor

-- Activer RLS sur storage.objects si ce n'est pas déjà fait
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques pour les images d'événements
DROP POLICY IF EXISTS "Users can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Event images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can update event images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete event images" ON storage.objects;

-- Politiques RLS pour les images d'événements
CREATE POLICY "Users can upload event images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND name LIKE 'events/%'
  AND auth.uid()::text = (storage.foldername(name))[2] -- Le user ID est dans le 2ème segment
);

CREATE POLICY "Event images are publicly accessible"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'avatars' 
  AND name LIKE 'events/%'
);

CREATE POLICY "Users can update event images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND name LIKE 'events/%'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Users can delete event images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND name LIKE 'events/%'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Politique plus permissive pour les tests (à supprimer en production)
-- Permet à tous les utilisateurs authentifiés d'uploader des images d'événements
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND name LIKE 'events/%'
  AND auth.role() = 'authenticated'
);

-- Politique pour permettre la lecture publique de toutes les images du bucket avatars
CREATE POLICY "All avatar bucket images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars'); 