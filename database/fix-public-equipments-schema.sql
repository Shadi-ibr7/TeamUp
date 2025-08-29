-- ====================================
-- CORRECTION DU SCHÉMA public_equipments
-- ====================================

-- Supprimer la table existante et la recréer avec le bon schéma
DROP TABLE IF EXISTS public.public_equipments CASCADE;

-- Créer la table public_equipments avec toutes les colonnes
CREATE TABLE public.public_equipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT,
    sub_type TEXT,
    address TEXT,
    city TEXT,
    department TEXT,
    postal_code TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    property_type TEXT,
    manager_name TEXT,
    manager_contact TEXT,
    accessibility TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer des index pour améliorer les performances
CREATE INDEX idx_public_equipments_external_id ON public.public_equipments(external_id);
CREATE INDEX idx_public_equipments_type ON public.public_equipments(type);
CREATE INDEX idx_public_equipments_city ON public.public_equipments(city);
CREATE INDEX idx_public_equipments_department ON public.public_equipments(department);
CREATE INDEX idx_public_equipments_property_type ON public.public_equipments(property_type);
CREATE INDEX idx_public_equipments_location ON public.public_equipments(latitude, longitude);

-- Activer RLS (Row Level Security)
ALTER TABLE public.public_equipments ENABLE ROW LEVEL SECURITY;

-- Créer les politiques RLS
CREATE POLICY "Public equipments are publicly readable"
ON public.public_equipments FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage public equipments"
ON public.public_equipments FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Créer le trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_public_equipments_updated_at
    BEFORE UPDATE ON public.public_equipments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Message de confirmation
SELECT 'Table public_equipments recréée avec succès avec toutes les colonnes!' as status;