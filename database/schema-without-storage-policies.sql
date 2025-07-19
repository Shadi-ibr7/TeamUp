-- ======================================
-- SCHÉMA COMPLET SANS POLITIQUES DE STOCKAGE
-- ======================================

-- Activer les extensions nécessaires pour la géolocalisation
create extension if not exists cube;
create extension if not exists earthdistance;

-- Configuration du bucket de stockage pour les avatars
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

-- 1. Table des utilisateurs (extension de auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  preferred_sports TEXT[] DEFAULT '{}',
  skill_levels JSONB DEFAULT '{}',
  availability TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des événements sportifs
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  date DATE NOT NULL,
  "time" TIME NOT NULL,
  sport_type TEXT NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 10,
  current_participants INTEGER NOT NULL DEFAULT 1,
  organizer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter la colonne image_url à la table events existante (si elle n'existe pas)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. Table des participants aux événements
CREATE TABLE IF NOT EXISTS public.event_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'declined')) DEFAULT 'confirmed',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- 4. Table des messages de chat
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table des localisations utilisateur (pour la géolocalisation)
CREATE TABLE IF NOT EXISTS public.user_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_sport_type ON public.events(sport_type);
CREATE INDEX IF NOT EXISTS idx_events_location ON public.events USING GIST (ll_to_earth(latitude::float8, longitude::float8));
CREATE INDEX IF NOT EXISTS idx_events_image_url ON public.events(image_url) WHERE image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_participants_event_id ON public.event_participants(event_id);
CREATE INDEX IF NOT EXISTS idx_event_participants_user_id ON public.event_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_event_id ON public.messages(event_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Fonctions pour gérer les participants
CREATE OR REPLACE FUNCTION increment_participants(event_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.events 
  SET current_participants = current_participants + 1
  WHERE id = event_id AND current_participants < max_participants;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_participants(event_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.events 
  SET current_participants = GREATEST(current_participants - 1, 1)
  WHERE id = event_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour rechercher les événements à proximité
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

-- Fonction pour formater les dates d'événements
CREATE OR REPLACE FUNCTION format_event_date(event_date DATE, event_time TIME)
RETURNS TEXT AS $$
BEGIN
  RETURN TO_CHAR(event_date, 'DD/MM/YYYY') || ' à ' || TO_CHAR(event_time, 'HH24:MI');
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques d'un utilisateur
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

-- Triggers pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
    CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON public.users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_events_updated_at') THEN
    CREATE TRIGGER update_events_updated_at
      BEFORE UPDATE ON public.events
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les utilisateurs
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;
CREATE POLICY "Users can view all profiles" ON public.users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Politiques RLS pour les événements
DROP POLICY IF EXISTS "Anyone can view active events" ON public.events;
CREATE POLICY "Anyone can view active events" ON public.events
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Users can create events" ON public.events;
CREATE POLICY "Users can create events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "Organizers can update their events" ON public.events;
CREATE POLICY "Organizers can update their events" ON public.events
  FOR UPDATE USING (auth.uid() = organizer_id);

-- Politiques RLS pour les participants
DROP POLICY IF EXISTS "Users can view event participants" ON public.event_participants;
CREATE POLICY "Users can view event participants" ON public.event_participants
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join events" ON public.event_participants;
CREATE POLICY "Users can join events" ON public.event_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave events" ON public.event_participants;
CREATE POLICY "Users can leave events" ON public.event_participants
  FOR DELETE USING (auth.uid() = user_id);

-- Politiques RLS pour les messages
DROP POLICY IF EXISTS "Users can view event messages" ON public.messages;
CREATE POLICY "Users can view event messages" ON public.messages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politiques RLS pour les localisations
DROP POLICY IF EXISTS "Users can view nearby locations" ON public.user_locations;
CREATE POLICY "Users can view nearby locations" ON public.user_locations
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own location" ON public.user_locations;
CREATE POLICY "Users can update own location" ON public.user_locations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own location" ON public.user_locations;
CREATE POLICY "Users can update own location" ON public.user_locations
  FOR UPDATE USING (auth.uid() = user_id);

-- Fonction pour créer automatiquement un profil utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer automatiquement un profil utilisateur
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Message de confirmation
SELECT 'Schéma créé avec succès! Configurez les politiques de stockage via l''interface Supabase.' as status; 