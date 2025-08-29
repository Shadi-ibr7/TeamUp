-- ======================================
-- TEST DU SYSTÈME DE NOTIFICATIONS
-- ======================================
-- Exécutez ce script après avoir configuré les notifications

-- 1. Vérifier que les tables existent
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

-- 2. Vérifier que les triggers existent
SELECT 
  'Triggers de notifications:' as info,
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
AND trigger_name LIKE '%notification%'
ORDER BY trigger_name;

-- 3. Vérifier que les fonctions existent
SELECT 
  'Fonctions de notifications:' as info,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%notification%'
ORDER BY routine_name;

-- 4. Vérifier les politiques RLS
SELECT 
  'Politiques RLS pour les notifications:' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename LIKE '%notification%'
ORDER BY tablename, policyname;

-- 5. Vérifier les index
SELECT 
  'Index pour les notifications:' as info,
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE tablename LIKE '%notification%'
ORDER BY tablename, indexname;

-- 6. Test : Créer un utilisateur de test (si nécessaire)
-- INSERT INTO public.users (id, email, name) 
-- VALUES ('test-user-id', 'test@example.com', 'Utilisateur Test')
-- ON CONFLICT (id) DO NOTHING;

-- 7. Test : Créer un événement de test (si nécessaire)
-- INSERT INTO public.events (id, title, description, location, latitude, longitude, date, time, sport_type, organizer_id)
-- VALUES ('test-event-id', 'Événement Test', 'Description test', 'Paris', 48.8566, 2.3522, CURRENT_DATE, '14:00', 'Football', 'test-user-id')
-- ON CONFLICT (id) DO NOTHING;

-- 8. Test : Ajouter un participant (si nécessaire)
-- INSERT INTO public.event_participants (event_id, user_id, status)
-- VALUES ('test-event-id', 'test-user-id', 'confirmed')
-- ON CONFLICT (event_id, user_id) DO NOTHING;

-- 9. Test : Envoyer un message (décommentez pour tester)
-- INSERT INTO public.messages (event_id, user_id, content, message_type)
-- VALUES ('test-event-id', 'test-user-id', 'Message de test pour les notifications', 'text');

-- 10. Vérifier les notifications créées
SELECT 
  'Notifications créées:' as info,
  COUNT(*) as total_notifications,
  COUNT(CASE WHEN is_read = FALSE THEN 1 END) as unread_notifications,
  COUNT(CASE WHEN notification_type = 'message_received' THEN 1 END) as message_notifications
FROM public.notifications;

-- 11. Afficher les notifications non lues
SELECT 
  'Notifications non lues:' as info,
  id,
  title,
  body,
  notification_type,
  sent_at
FROM public.notifications 
WHERE is_read = FALSE 
ORDER BY sent_at DESC;

-- Message de fin
SELECT 'Test terminé ! Vérifiez les résultats ci-dessus.' as status; 