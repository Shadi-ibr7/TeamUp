-- ======================================
-- SCHÉMA COMPLET MIS À JOUR AVEC GÉOLOCALISATION ET NOTIFICATIONS
-- ======================================

-- Activer les extensions nécessaires pour la géolocalisation
create extension if not exists cube;
create extension if not exists earthdistance;

-- Configuration du bucket de stockage pour les avatars
-- Les avatars des utilisateurs sont utilisés dans le chat et les profils
-- Le même bucket stocke aussi les images partagées dans les chats
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  15728640, -- 15MB limit (augmenté pour les images d'événements et du chat)
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic']
) ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 15728640,
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
  image_url TEXT,
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
  message_type TEXT CHECK (message_type IN ('text', 'image')) DEFAULT 'text',
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ajouter les colonnes manquantes à la table messages existante (si elles n'existent pas)
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS message_type TEXT CHECK (message_type IN ('text', 'image')) DEFAULT 'text';

ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS image_url TEXT;

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
CREATE INDEX IF NOT EXISTS idx_messages_image_url ON public.messages(image_url) WHERE image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_type ON public.messages(message_type);

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

-- Fonction pour rechercher les événements à proximité (CORRIGÉE)
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
    AND e.date >= CURRENT_DATE
    AND e.latitude IS NOT NULL
    AND e.longitude IS NOT NULL
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

DROP POLICY IF EXISTS "Organizers can delete their events" ON public.events;
CREATE POLICY "Organizers can delete their events" ON public.events
  FOR DELETE USING (auth.uid() = organizer_id);

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
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can view event messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can view event messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON public.messages;

-- Politiques plus permissives pour les messages de chat
CREATE POLICY "Authenticated users can view event messages" ON public.messages
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');

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

-- ======================================
-- SYSTÈME DE NOTIFICATIONS
-- ======================================

-- 1. Table des tokens de notification des utilisateurs
CREATE TABLE IF NOT EXISTS public.user_notification_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  device_token TEXT NOT NULL,
  device_type TEXT CHECK (device_type IN ('ios', 'android', 'web')) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_token)
);

-- 2. Table des notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  notification_type TEXT CHECK (notification_type IN ('event_created', 'message_received', 'event_reminder', 'participant_joined')) NOT NULL,
  related_event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  related_message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table des préférences de notification des utilisateurs
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  event_notifications BOOLEAN DEFAULT TRUE,
  message_notifications BOOLEAN DEFAULT TRUE,
  event_reminders BOOLEAN DEFAULT TRUE,
  participant_updates BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index pour les notifications
CREATE INDEX IF NOT EXISTS idx_user_notification_tokens_user_id ON public.user_notification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_tokens_active ON public.user_notification_tokens(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_event_id ON public.notifications(related_event_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON public.user_notification_preferences(user_id);

-- RLS pour les notifications
ALTER TABLE public.user_notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes pour éviter les conflits
DROP POLICY IF EXISTS "Users can manage their own notification tokens" ON public.user_notification_tokens;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can manage their own notification preferences" ON public.user_notification_preferences;

-- Recréer les politiques RLS pour les notifications
CREATE POLICY "Users can manage their own notification tokens" ON public.user_notification_tokens
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own notification preferences" ON public.user_notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Fonction pour créer automatiquement des préférences de notification par défaut
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS on_user_created_notification_preferences ON public.users;

-- Recréer le trigger pour créer automatiquement des préférences de notification
CREATE TRIGGER on_user_created_notification_preferences
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();

-- Fonction pour notifier les utilisateurs intéressés par un nouveau sport
CREATE OR REPLACE FUNCTION notify_users_about_new_event()
RETURNS TRIGGER AS $$
DECLARE
  interested_user RECORD;
BEGIN
  -- Trouver tous les utilisateurs qui ont ce sport dans leurs préférences
  FOR interested_user IN 
    SELECT DISTINCT u.id, u.name, unt.device_token
    FROM public.users u
    JOIN public.user_notification_tokens unt ON u.id = unt.user_id
    JOIN public.user_notification_preferences unp ON u.id = unp.user_id
    WHERE 
      NEW.sport_type = ANY(u.preferred_sports)
      AND unt.is_active = TRUE
      AND unp.event_notifications = TRUE
      AND u.id != NEW.organizer_id  -- Ne pas notifier l'organisateur
  LOOP
    -- Insérer la notification
    INSERT INTO public.notifications (
      user_id,
      title,
      body,
      data,
      notification_type,
      related_event_id
    ) VALUES (
      interested_user.id,
      'Nouvel événement ' || NEW.sport_type,
      'Un nouvel événement ' || NEW.sport_type || ' a été créé près de chez vous : ' || NEW.title,
      jsonb_build_object(
        'event_id', NEW.id,
        'event_title', NEW.title,
        'sport_type', NEW.sport_type,
        'location', NEW.location,
        'date', NEW.date,
        'time', NEW.time
      ),
      'event_created',
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS on_event_created_notify_users ON public.events;

-- Recréer le trigger pour notifier lors de la création d'un événement
CREATE TRIGGER on_event_created_notify_users
  AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION notify_users_about_new_event();

-- Fonction pour notifier les participants d'un événement quand un message est envoyé
CREATE OR REPLACE FUNCTION notify_participants_about_message()
RETURNS TRIGGER AS $$
DECLARE
  participant RECORD;
  sender_name TEXT;
BEGIN
  -- Récupérer le nom de l'expéditeur
  SELECT name INTO sender_name
  FROM public.users
  WHERE id = NEW.user_id;
  
  -- Trouver tous les participants de l'événement (sauf l'expéditeur)
  FOR participant IN 
    SELECT DISTINCT u.id, u.name, unt.device_token
    FROM public.users u
    JOIN public.event_participants ep ON u.id = ep.user_id
    JOIN public.user_notification_tokens unt ON u.id = unt.user_id
    JOIN public.user_notification_preferences unp ON u.id = unp.user_id
    WHERE 
      ep.event_id = NEW.event_id
      AND ep.status = 'confirmed'
      AND unt.is_active = TRUE
      AND unp.message_notifications = TRUE
      AND u.id != NEW.user_id  -- Ne pas notifier l'expéditeur
  LOOP
    -- Insérer la notification
    INSERT INTO public.notifications (
      user_id,
      title,
      body,
      data,
      notification_type,
      related_event_id,
      related_message_id
    ) VALUES (
      participant.id,
      'Nouveau message dans le chat',
      sender_name || ' a envoyé un message dans le chat de l''événement',
      jsonb_build_object(
        'event_id', NEW.event_id,
        'message_id', NEW.id,
        'sender_id', NEW.user_id,
        'sender_name', sender_name,
        'message_type', NEW.message_type,
        'has_image', CASE WHEN NEW.image_url IS NOT NULL THEN TRUE ELSE FALSE END
      ),
      'message_received',
      NEW.event_id,
      NEW.id
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supprimer le trigger existant s'il existe
DROP TRIGGER IF EXISTS on_message_sent_notify_participants ON public.messages;

-- Recréer le trigger pour notifier lors de l'envoi d'un message
CREATE TRIGGER on_message_sent_notify_participants
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION notify_participants_about_message();

-- Fonction pour marquer une notification comme lue
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = TRUE
  WHERE id = notification_uuid AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour marquer toutes les notifications comme lues
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET is_read = TRUE
  WHERE user_id = auth.uid() AND is_read = FALSE;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les notifications non lues d'un utilisateur
CREATE OR REPLACE FUNCTION get_unread_notifications()
RETURNS TABLE (
  id UUID,
  title TEXT,
  body TEXT,
  data JSONB,
  notification_type TEXT,
  related_event_id UUID,
  related_message_id UUID,
  sent_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.title,
    n.body,
    n.data,
    n.notification_type,
    n.related_event_id,
    n.related_message_id,
    n.sent_at
  FROM public.notifications n
  WHERE n.user_id = auth.uid() AND n.is_read = FALSE
  ORDER BY n.sent_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir le nombre de notifications non lues
CREATE OR REPLACE FUNCTION get_unread_notifications_count()
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_result
  FROM public.notifications
  WHERE user_id = auth.uid() AND is_read = FALSE;
  
  RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ======================================
-- CONFIGURATION DU STOCKAGE (À FAIRE MANUELLEMENT)
-- ======================================
-- 
-- ATTENTION : Les politiques de stockage doivent être configurées via l'interface Supabase
-- car la table storage.objects nécessite des permissions spéciales.
--
-- Voici comment procéder :
--
-- 1. Allez dans Supabase Dashboard → Storage → Policies
-- 2. Cliquez sur le bucket "avatars"
-- 3. Ajoutez ces politiques manuellement :
--
-- POLITIQUE 1 : "Users can upload their own avatars"
-- - Operation : INSERT
-- - Policy definition : bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
--
-- POLITIQUE 2 : "Avatar images are publicly accessible"
-- - Operation : SELECT
-- - Policy definition : bucket_id = 'avatars'
--
-- POLITIQUE 3 : "Users can update their own avatars"
-- - Operation : UPDATE
-- - Policy definition : bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
--
-- POLITIQUE 4 : "Users can delete their own avatars"
-- - Operation : DELETE
-- - Policy definition : bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
--
-- POLITIQUE 5 : "Authenticated users can upload event images"
-- - Operation : INSERT
-- - Policy definition : bucket_id = 'avatars' AND auth.role() = 'authenticated'
--
-- POLITIQUE 6 : "Authenticated users can update event images"
-- - Operation : UPDATE
-- - Policy definition : bucket_id = 'avatars' AND auth.role() = 'authenticated'
--
-- POLITIQUE 7 : "Authenticated users can delete event images"
-- - Operation : DELETE
-- - Policy definition : bucket_id = 'avatars' AND auth.role() = 'authenticated'
--
-- POLITIQUE 8 : "Users can upload chat images"
-- - Operation : INSERT
-- - Policy definition : bucket_id = 'avatars' AND name LIKE 'chat/%' AND auth.role() = 'authenticated'
--
-- POLITIQUE 9 : "Chat images are publicly accessible"
-- - Operation : SELECT
-- - Policy definition : bucket_id = 'avatars' AND name LIKE 'chat/%'
--
-- POLITIQUE 10 : "Users can update chat images"
-- - Operation : UPDATE
-- - Policy definition : bucket_id = 'avatars' AND name LIKE 'chat/%' AND auth.role() = 'authenticated'
--
-- POLITIQUE 11 : "Users can delete chat images"
-- - Operation : DELETE
-- - Policy definition : bucket_id = 'avatars' AND name LIKE 'chat/%' AND auth.role() = 'authenticated'
--
-- ======================================

-- ======================================
-- DIAGNOSTICS ET VÉRIFICATIONS
-- ======================================

-- Vérifier l'état de la base de données
SELECT 
  'État de la base de données:' as info,
  COUNT(*) as total_events,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_events,
  COUNT(CASE WHEN latitude IS NOT NULL AND longitude IS NOT NULL THEN 1 END) as events_with_coordinates,
  COUNT(CASE WHEN date >= CURRENT_DATE THEN 1 END) as future_events
FROM events;

-- Vérifier les tables de notifications
SELECT 
  'Tables de notifications:' as info,
  table_name,
  column_count
FROM (
  SELECT 'user_notification_tokens' as table_name, COUNT(*) as column_count
  FROM information_schema.columns 
  WHERE table_name = 'user_notification_tokens' AND table_schema = 'public'
  UNION ALL
  SELECT 'notifications' as table_name, COUNT(*) as column_count
  FROM information_schema.columns 
  WHERE table_name = 'notifications' AND table_schema = 'public'
  UNION ALL
  SELECT 'user_notification_preferences' as table_name, COUNT(*) as column_count
  FROM information_schema.columns 
  WHERE table_name = 'user_notification_preferences' AND table_schema = 'public'
) t;

-- Vérifier les triggers de notifications
SELECT 
  'Triggers de notifications:' as info,
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE '%notification%'
ORDER BY trigger_name;

-- Vérifier les fonctions de notifications
SELECT 
  'Fonctions de notifications:' as info,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%notification%'
ORDER BY routine_name;

-- Vérifier les politiques RLS pour les messages
SELECT 
  'Politiques RLS pour les messages:' as info,
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename = 'messages'
ORDER BY cmd, policyname;

-- Vérifier la structure de la table messages avec support des images
SELECT 
  'Structure de la table messages:' as info,
  column_name, 
  data_type, 
  is_nullable, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'messages' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Compter les messages existants
SELECT 
  'Statistiques des messages:' as info,
  COUNT(*) as total_messages,
  COUNT(DISTINCT event_id) as events_with_messages,
  COUNT(DISTINCT user_id) as users_who_messaged,
  COUNT(CASE WHEN message_type = 'image' THEN 1 END) as image_messages
FROM public.messages;

-- Vérifier la configuration du bucket de stockage
SELECT 
  'Configuration du bucket avatars:' as info,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets 
WHERE id = 'avatars';

-- Message de confirmation final
SELECT 'Schéma complet mis à jour avec succès ! Toutes les fonctionnalités sont maintenant disponibles : géolocalisation, chat avec images, et système de notifications automatiques. Aucune erreur de conflit.' as final_status;