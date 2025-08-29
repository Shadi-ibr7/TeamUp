-- =====================================================
-- SYSTÈME DE RÉSERVATION DE TERRAINS PUBLICS
-- =====================================================

-- 1. Table des équipements sportifs publics (cache des données Data ES)
CREATE TABLE IF NOT EXISTS public.public_equipments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id VARCHAR(255) UNIQUE NOT NULL, -- ID de l'API Data ES
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  subtype TEXT,
  address TEXT,
  city VARCHAR(100),
  department VARCHAR(3),
  postal_code VARCHAR(10),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  manager_name TEXT,
  manager_contact TEXT,
  property_type VARCHAR(50) DEFAULT 'Public', -- Public, Privé, etc.
  accessibility TEXT,
  facilities JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des réservations de terrains publics
CREATE TABLE IF NOT EXISTS public.public_reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  equipment_id UUID REFERENCES public.public_equipments(id) ON DELETE CASCADE NOT NULL,
  organizer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  sport_type VARCHAR(100) NOT NULL,
  description TEXT,
  max_participants INTEGER DEFAULT 10,
  status VARCHAR(20) CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')) DEFAULT 'pending',
  validation_mode VARCHAR(20) DEFAULT 'automatic', -- automatic, manual
  validated_by UUID REFERENCES public.users(id),
  validated_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  lock_expires_at TIMESTAMP WITH TIME ZONE, -- Pour éviter les conflits
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table des notifications de réservation
CREATE TABLE IF NOT EXISTS public.reservation_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID REFERENCES public.public_reservations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'status_change', 'reminder', 'confirmation'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table d'audit des validations
CREATE TABLE IF NOT EXISTS public.reservation_audit (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_id UUID REFERENCES public.public_reservations(id) ON DELETE CASCADE NOT NULL,
  action VARCHAR(50) NOT NULL, -- 'created', 'approved', 'rejected', 'cancelled'
  performed_by UUID REFERENCES public.users(id),
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reason TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_public_equipments_external_id ON public.public_equipments(external_id);
CREATE INDEX IF NOT EXISTS idx_public_equipments_location ON public.public_equipments USING GIST (ll_to_earth(latitude::float8, longitude::float8));
CREATE INDEX IF NOT EXISTS idx_public_equipments_type ON public.public_equipments(type);
CREATE INDEX IF NOT EXISTS idx_public_equipments_department ON public.public_equipments(department);

CREATE INDEX IF NOT EXISTS idx_public_reservations_equipment_id ON public.public_reservations(equipment_id);
CREATE INDEX IF NOT EXISTS idx_public_reservations_organizer_id ON public.public_reservations(organizer_id);
CREATE INDEX IF NOT EXISTS idx_public_reservations_status ON public.public_reservations(status);
CREATE INDEX IF NOT EXISTS idx_public_reservations_time_range ON public.public_reservations(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_public_reservations_lock_expires ON public.public_reservations(lock_expires_at) WHERE lock_expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reservation_notifications_reservation_id ON public.reservation_notifications(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_notifications_user_id ON public.reservation_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_reservation_notifications_is_read ON public.reservation_notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_reservation_audit_reservation_id ON public.reservation_audit(reservation_id);
CREATE INDEX IF NOT EXISTS idx_reservation_audit_performed_at ON public.reservation_audit(performed_at);

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour vérifier les conflits de réservation
CREATE OR REPLACE FUNCTION check_reservation_conflicts(
  p_equipment_id UUID,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_exclude_reservation_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO conflict_count
  FROM public.public_reservations
  WHERE equipment_id = p_equipment_id
    AND status IN ('pending', 'approved')
    AND (
      (start_time <= p_start_time AND end_time > p_start_time) OR
      (start_time < p_end_time AND end_time >= p_end_time) OR
      (start_time >= p_start_time AND end_time <= p_end_time)
    )
    AND (p_exclude_reservation_id IS NULL OR id != p_exclude_reservation_id);
  
  RETURN conflict_count > 0;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer une réservation avec verrouillage
CREATE OR REPLACE FUNCTION create_reservation_with_lock(
  p_equipment_id UUID,
  p_organizer_id UUID,
  p_start_time TIMESTAMP WITH TIME ZONE,
  p_end_time TIMESTAMP WITH TIME ZONE,
  p_sport_type VARCHAR(100),
  p_description TEXT DEFAULT NULL,
  p_max_participants INTEGER DEFAULT 10,
  p_lock_duration_minutes INTEGER DEFAULT 10
)
RETURNS UUID AS $$
DECLARE
  reservation_id UUID;
  has_conflicts BOOLEAN;
BEGIN
  -- Vérifier les conflits
  SELECT check_reservation_conflicts(p_equipment_id, p_start_time, p_end_time)
  INTO has_conflicts;
  
  IF has_conflicts THEN
    RAISE EXCEPTION 'Conflit de réservation détecté pour ce créneau';
  END IF;
  
  -- Créer la réservation avec verrouillage
  INSERT INTO public.public_reservations (
    equipment_id,
    organizer_id,
    start_time,
    end_time,
    sport_type,
    description,
    max_participants,
    lock_expires_at
  ) VALUES (
    p_equipment_id,
    p_organizer_id,
    p_start_time,
    p_end_time,
    p_sport_type,
    p_description,
    p_max_participants,
    NOW() + INTERVAL '1 minute' * p_lock_duration_minutes
  ) RETURNING id INTO reservation_id;
  
  -- Enregistrer l'audit
  INSERT INTO public.reservation_audit (
    reservation_id,
    action,
    performed_by
  ) VALUES (
    reservation_id,
    'created',
    p_organizer_id
  );
  
  RETURN reservation_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour valider/rejeter une réservation
CREATE OR REPLACE FUNCTION update_reservation_status(
  p_reservation_id UUID,
  p_new_status VARCHAR(20),
  p_validated_by UUID,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE public.public_reservations
  SET 
    status = p_new_status,
    validated_by = p_validated_by,
    validated_at = NOW(),
    rejection_reason = p_rejection_reason,
    lock_expires_at = NULL, -- Libérer le verrou
    updated_at = NOW()
  WHERE id = p_reservation_id;
  
  -- Enregistrer l'audit
  INSERT INTO public.reservation_audit (
    reservation_id,
    action,
    performed_by,
    reason
  ) VALUES (
    p_reservation_id,
    p_new_status,
    p_validated_by,
    p_rejection_reason
  );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les verrous expirés
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS INTEGER AS $$
DECLARE
  cleaned_count INTEGER;
BEGIN
  UPDATE public.public_reservations
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE lock_expires_at < NOW()
    AND status = 'pending';
  
  GET DIAGNOSTICS cleaned_count = ROW_COUNT;
  
  -- Enregistrer l'audit pour les réservations annulées
  INSERT INTO public.reservation_audit (
    reservation_id,
    action,
    performed_by,
    reason
  )
  SELECT 
    id,
    'cancelled',
    organizer_id,
    'Verrou expiré - réservation automatiquement annulée'
  FROM public.public_reservations
  WHERE lock_expires_at < NOW()
    AND status = 'cancelled'
    AND updated_at = NOW();
  
  RETURN cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_public_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_public_reservations_updated_at
  BEFORE UPDATE ON public.public_reservations
  FOR EACH ROW
  EXECUTE FUNCTION update_public_reservations_updated_at();

-- =====================================================
-- DONNÉES D'EXEMPLE
-- =====================================================

-- Insérer quelques équipements d'exemple (simulation de l'API Data ES)
INSERT INTO public.public_equipments (
  external_id,
  name,
  type,
  subtype,
  address,
  city,
  department,
  postal_code,
  latitude,
  longitude,
  manager_name,
  manager_contact,
  property_type
) VALUES 
(
  'ES_001',
  'Terrain de Football Municipal',
  'Terrain de football',
  'Terrain en gazon naturel',
  '123 Avenue de la République',
  'Paris',
  '75',
  '75001',
  48.8566,
  2.3522,
  'Mairie de Paris',
  'sports@paris.fr',
  'Public'
),
(
  'ES_002',
  'Court de Tennis Central',
  'Court de tennis',
  'Court en dur',
  '456 Boulevard Saint-Germain',
  'Paris',
  '75',
  '75006',
  48.8534,
  2.3488,
  'Mairie de Paris',
  'tennis@paris.fr',
  'Public'
),
(
  'ES_003',
  'Gymnase Municipal',
  'Gymnase',
  'Gymnase multisport',
  '789 Rue de Rivoli',
  'Paris',
  '75',
  '75001',
  48.8606,
  2.3376,
  'Mairie de Paris',
  'gymnase@paris.fr',
  'Public'
)
ON CONFLICT (external_id) DO NOTHING; 