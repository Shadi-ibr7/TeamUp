-- ======================================
-- CORRECTION DES POLITIQUES RLS POUR LES NOTIFICATIONS
-- ======================================
-- Ce script supprime d'abord les politiques existantes puis les recrée

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

-- Vérifier que les politiques ont été créées
SELECT 
  'Politiques RLS pour les notifications:' as info,
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive
FROM pg_policies 
WHERE tablename LIKE '%notification%'
ORDER BY tablename, policyname;

-- Message de confirmation
SELECT 'Politiques RLS pour les notifications corrigées avec succès !' as status; 