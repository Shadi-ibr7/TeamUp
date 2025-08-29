-- Script pour forcer la re-synchronisation des équipements
-- À exécuter après avoir nettoyé la base

-- 1. Vérifier l'état actuel
SELECT COUNT(*) as total_equipments FROM public_equipments;

-- 2. Supprimer tous les équipements existants
DELETE FROM public_equipments;

-- 3. Vérifier que la table est vide
SELECT COUNT(*) as total_equipments FROM public_equipments;

-- 4. Réinitialiser les séquences si nécessaire
-- ALTER SEQUENCE public_equipments_id_seq RESTART WITH 1;

-- 5. Vérifier les politiques RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'public_equipments';

-- Note: Après l'exécution de ce script, l'application devra re-synchroniser
-- les données depuis l'API Data ES. L'application récupérera automatiquement
-- de nouveaux équipements avec de vrais noms lors de la prochaine utilisation. 