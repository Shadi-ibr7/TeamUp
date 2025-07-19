import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';

interface NotificationSettings {
  push_enabled: boolean;
  email_enabled: boolean;
  new_events: boolean;
  event_updates: boolean;
  event_reminders: boolean;
  new_messages: boolean;
  friend_requests: boolean;
  event_invitations: boolean;
  marketing: boolean;
  reminders_1h: boolean;
  reminders_24h: boolean;
  reminders_1week: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
  quiet_hours_enabled: boolean;
  quiet_start: string;
  quiet_end: string;
}

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    push_enabled: true,
    email_enabled: true,
    new_events: true,
    event_updates: true,
    event_reminders: true,
    new_messages: true,
    friend_requests: true,
    event_invitations: true,
    marketing: false,
    reminders_1h: true,
    reminders_24h: true,
    reminders_1week: false,
    sound_enabled: true,
    vibration_enabled: true,
    quiet_hours_enabled: false,
    quiet_start: '22:00',
    quiet_end: '08:00'
  });

  const updateSetting = (key: keyof NotificationSettings, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // TODO: Sauvegarder les paramètres en base de données
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation
      Alert.alert('Succès', 'Paramètres de notifications sauvegardés !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder les paramètres');
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    Alert.alert(
      'Réinitialiser',
      'Voulez-vous vraiment restaurer les paramètres par défaut ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          onPress: () => {
            setSettings({
              push_enabled: true,
              email_enabled: true,
              new_events: true,
              event_updates: true,
              event_reminders: true,
              new_messages: true,
              friend_requests: true,
              event_invitations: true,
              marketing: false,
              reminders_1h: true,
              reminders_24h: true,
              reminders_1week: false,
              sound_enabled: true,
              vibration_enabled: true,
              quiet_hours_enabled: false,
              quiet_start: '22:00',
              quiet_end: '08:00'
            });
          }
        }
      ]
    );
  };

  const SettingRow = ({ 
    title, 
    description, 
    value, 
    onValueChange, 
    disabled = false 
  }: {
    title: string;
    description?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    disabled?: boolean;
  }) => (
    <View className={`flex-row justify-between items-center py-4 ${disabled ? 'opacity-50' : ''}`}>
      <View className="flex-1 mr-4">
        <Text className="text-white font-medium">{title}</Text>
        {description && (
          <Text className="text-gray-400 text-sm mt-1">{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: '#374151', true: '#3B82F6' }}
        thumbColor={value ? '#ffffff' : '#9CA3AF'}
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-800">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 py-4 border-b border-slate-700">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Notifications</Text>
          <TouchableOpacity onPress={resetToDefaults}>
            <Ionicons name="refresh-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Paramètres généraux */}
        <View className="px-6 py-6 border-b border-slate-700">
          <Text className="text-white text-lg font-semibold mb-4">Paramètres généraux</Text>
          
          <SettingRow
            title="Notifications push"
            description="Recevoir des notifications sur votre appareil"
            value={settings.push_enabled}
            onValueChange={(value) => updateSetting('push_enabled', value)}
          />
          
          <SettingRow
            title="Notifications par email"
            description="Recevoir des notifications par email"
            value={settings.email_enabled}
            onValueChange={(value) => updateSetting('email_enabled', value)}
          />
          
          <SettingRow
            title="Son"
            description="Jouer un son pour les notifications"
            value={settings.sound_enabled}
            onValueChange={(value) => updateSetting('sound_enabled', value)}
            disabled={!settings.push_enabled}
          />
          
          <SettingRow
            title="Vibration"
            description="Vibrer lors des notifications"
            value={settings.vibration_enabled}
            onValueChange={(value) => updateSetting('vibration_enabled', value)}
            disabled={!settings.push_enabled}
          />
        </View>

        {/* Événements */}
        <View className="px-6 py-6 border-b border-slate-700">
          <Text className="text-white text-lg font-semibold mb-4">Événements</Text>
          
          <SettingRow
            title="Nouveaux événements"
            description="Être notifié des nouveaux événements dans votre zone"
            value={settings.new_events}
            onValueChange={(value) => updateSetting('new_events', value)}
            disabled={!settings.push_enabled && !settings.email_enabled}
          />
          
          <SettingRow
            title="Mises à jour d'événements"
            description="Changements d'horaire, lieu, annulations"
            value={settings.event_updates}
            onValueChange={(value) => updateSetting('event_updates', value)}
            disabled={!settings.push_enabled && !settings.email_enabled}
          />
          
          <SettingRow
            title="Rappels d'événements"
            description="Rappels avant vos événements"
            value={settings.event_reminders}
            onValueChange={(value) => updateSetting('event_reminders', value)}
            disabled={!settings.push_enabled && !settings.email_enabled}
          />
          
          <SettingRow
            title="Invitations à des événements"
            description="Quand quelqu'un vous invite à un événement"
            value={settings.event_invitations}
            onValueChange={(value) => updateSetting('event_invitations', value)}
            disabled={!settings.push_enabled && !settings.email_enabled}
          />
        </View>

        {/* Rappels */}
        <View className="px-6 py-6 border-b border-slate-700">
          <Text className="text-white text-lg font-semibold mb-4">Rappels d'événements</Text>
          
          <SettingRow
            title="1 heure avant"
            description="Rappel 1 heure avant l'événement"
            value={settings.reminders_1h}
            onValueChange={(value) => updateSetting('reminders_1h', value)}
            disabled={!settings.event_reminders}
          />
          
          <SettingRow
            title="24 heures avant"
            description="Rappel la veille de l'événement"
            value={settings.reminders_24h}
            onValueChange={(value) => updateSetting('reminders_24h', value)}
            disabled={!settings.event_reminders}
          />
          
          <SettingRow
            title="1 semaine avant"
            description="Rappel une semaine avant l'événement"
            value={settings.reminders_1week}
            onValueChange={(value) => updateSetting('reminders_1week', value)}
            disabled={!settings.event_reminders}
          />
        </View>

        {/* Social */}
        <View className="px-6 py-6 border-b border-slate-700">
          <Text className="text-white text-lg font-semibold mb-4">Social</Text>
          
          <SettingRow
            title="Nouveaux messages"
            description="Messages dans les chats d'événements"
            value={settings.new_messages}
            onValueChange={(value) => updateSetting('new_messages', value)}
            disabled={!settings.push_enabled && !settings.email_enabled}
          />
          
          <SettingRow
            title="Demandes d'amis"
            description="Nouvelles demandes d'ajout en ami"
            value={settings.friend_requests}
            onValueChange={(value) => updateSetting('friend_requests', value)}
            disabled={!settings.push_enabled && !settings.email_enabled}
          />
        </View>

        {/* Marketing */}
        <View className="px-6 py-6 border-b border-slate-700">
          <Text className="text-white text-lg font-semibold mb-4">Marketing</Text>
          
          <SettingRow
            title="Promotions et conseils"
            description="Recevoir des conseils et offres spéciales"
            value={settings.marketing}
            onValueChange={(value) => updateSetting('marketing', value)}
            disabled={!settings.email_enabled}
          />
        </View>

        {/* Heures silencieuses */}
        <View className="px-6 py-6 border-b border-slate-700">
          <Text className="text-white text-lg font-semibold mb-4">Heures silencieuses</Text>
          
          <SettingRow
            title="Activer les heures silencieuses"
            description="Pas de notifications pendant ces heures"
            value={settings.quiet_hours_enabled}
            onValueChange={(value) => updateSetting('quiet_hours_enabled', value)}
            disabled={!settings.push_enabled}
          />
          
          {settings.quiet_hours_enabled && (
            <View className="mt-4 bg-slate-700 p-4 rounded-lg">
              <Text className="text-white font-medium mb-2">Période silencieuse</Text>
              <Text className="text-gray-400 text-sm">
                De {settings.quiet_start} à {settings.quiet_end}
              </Text>
              <TouchableOpacity className="mt-2">
                <Text className="text-blue-500">Modifier les heures</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Test */}
        <View className="px-6 py-6 border-b border-slate-700">
          <Text className="text-white text-lg font-semibold mb-4">Test</Text>
          
          <TouchableOpacity
            onPress={() => Alert.alert('Test', 'Notification de test envoyée !')}
            className="bg-slate-700 py-4 rounded-lg flex-row items-center justify-center"
          >
            <Ionicons name="notifications-outline" size={20} color="white" />
            <Text className="text-white font-medium ml-2">Envoyer une notification de test</Text>
          </TouchableOpacity>
        </View>

        {/* Bouton de sauvegarde */}
        <View className="px-6 py-6">
          <TouchableOpacity
            onPress={saveSettings}
            disabled={loading}
            className="bg-blue-600 py-4 rounded-lg"
          >
            <Text className="text-white text-center font-semibold text-lg">
              {loading ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 