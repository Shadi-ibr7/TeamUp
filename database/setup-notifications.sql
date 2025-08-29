-- ======================================
-- CONFIGURATION DU SYSTÈME DE NOTIFICATIONS
-- ======================================
-- Exécutez ce script dans Supabase SQL Editor

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

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_user_notification_tokens_user_id ON public.user_notification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_tokens_active ON public.user_notification_tokens(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_event_id ON public.notifications(related_event_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user_id ON public.user_notification_preferences(user_id);

-- Row Level Security (RLS)
ALTER TABLE public.user_notification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour les notifications
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

-- Trigger pour créer automatiquement des préférences de notification
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_user_created_notification_preferences') THEN
    CREATE TRIGGER on_user_created_notification_preferences
      AFTER INSERT ON public.users
      FOR EACH ROW EXECUTE FUNCTION create_default_notification_preferences();
  END IF;
END $$;

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

-- Trigger pour notifier lors de l'envoi d'un message
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_message_sent_notify_participants') THEN
    CREATE TRIGGER on_message_sent_notify_participants
      AFTER INSERT ON public.messages
      FOR EACH ROW EXECUTE FUNCTION notify_participants_about_message();
  END IF;
END $$;

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

-- Message de confirmation
SELECT 'Système de notifications configuré avec succès ! Les notifications de chat fonctionneront maintenant automatiquement.' as status; 