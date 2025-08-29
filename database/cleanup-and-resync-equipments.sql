-- Script pour nettoyer et re-synchroniser les équipements sportifs
-- Supprime les doublons et prépare la base pour de vraies données

-- 1. Supprimer tous les équipements existants (doublons)
DELETE FROM public_equipments;

-- 2. Réinitialiser la séquence d'ID si elle existe
-- (Cela dépend de votre configuration de base de données)

-- 3. Vérifier que la table est vide
SELECT COUNT(*) as total_equipments FROM public_equipments;

-- 4. Créer un index pour optimiser les futures requêtes
CREATE INDEX IF NOT EXISTS idx_public_equipments_type ON public_equipments(type);
CREATE INDEX IF NOT EXISTS idx_public_equipments_location ON public_equipments(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_public_equipments_property ON public_equipments(property_type);

-- 5. Vérifier les politiques RLS
-- Les politiques existantes devraient être suffisantes

-- Note: Après l'exécution de ce script, l'application devra re-synchroniser
-- les données depuis l'API Data ES pour obtenir de vrais noms de terrains 