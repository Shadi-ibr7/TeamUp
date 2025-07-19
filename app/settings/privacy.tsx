import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, SafeAreaView, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';

interface PrivacySettings {
  profile_visible: boolean;
  show_online_status: boolean;
  show_location: boolean;
  show_events_attended: boolean;
  show_stats: boolean;
  allow_friend_requests: boolean;
  allow_event_invitations: boolean;
  allow_messages: boolean;
  show_in_search: boolean;
  analytics_tracking: boolean;
  crash_reporting: boolean;
  performance_data: boolean;
  location_tracking: boolean;
  activity_status: boolean;
  read_receipts: boolean;
}

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<PrivacySettings>({
    profile_visible: true,
    show_online_status: true,
    show_location: false,
    show_events_attended: true,
    show_stats: true,
    allow_friend_requests: true,
    allow_event_invitations: true,
    allow_messages: true,
    show_in_search: true,
    analytics_tracking: true,
    crash_reporting: true,
    performance_data: false,
    location_tracking: false,
    activity_status: true,
    read_receipts: true
  });

  const updateSetting = (key: keyof PrivacySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // TODO: Sauvegarder les paramètres en base de données
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulation
      Alert.alert('Succès', 'Paramètres de confidentialité sauvegardés !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder les paramètres');
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = () => {
    Alert.alert(
      '⚠️ Effacer toutes les données',
      'Cette action supprimera définitivement toutes vos données personnelles, historiques et paramètres.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmation finale',
              'Êtes-vous absolument certain ? Cette action est irréversible.',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Oui, effacer tout',
                  style: 'destructive',
                  onPress: () => {
                    // TODO: Implémenter l'effacement des données
                    Alert.alert('Info', 'Fonctionnalité en cours de développement');
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const viewDataUsage = () => {
    Alert.alert(
      'Utilisation des données',
      'Voici un résumé de vos données:\n\n• Profil: 1 KB\n• Messages: 25 KB\n• Événements: 12 KB\n• Photos: 2.1 MB\n\nTotal: ~2.15 MB',
      [{ text: 'OK' }]
    );
  };

  const blockUser = () => {
    Alert.alert(
      'Bloquer un utilisateur',
      'Entrez l\'ID ou le nom d\'utilisateur de la personne à bloquer.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Gérer la liste',
          onPress: () => {
            // TODO: Navigation vers la liste des utilisateurs bloqués
            Alert.alert('Info', 'Page de gestion des utilisateurs bloqués en cours de développement');
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
    dangerous = false 
  }: {
    title: string;
    description?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    dangerous?: boolean;
  }) => (
    <View className="flex-row justify-between items-center py-4">
      <View className="flex-1 mr-4">
        <Text className={`font-medium ${dangerous ? 'text-red-400' : 'text-white'}`}>
          {title}
        </Text>
        {description && (
          <Text className="text-gray-400 text-sm mt-1">{description}</Text>
        )}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#374151', true: dangerous ? '#EF4444' : '#3B82F6' }}
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
          <Text className="text-xl font-bold text-white">Confidentialité</Text>
          <View className="w-6" />
        </View>

        {/* Visibilité du profil */}
        <View className="px-6 py-6 border-b border-slate-700">
          <Text className="text-white text-lg font-semibold mb-4">Visibilité du profil</Text>
          
          <SettingRow
            title="Profil public"
            description="Votre profil est visible par tous les utilisateurs"
            value={settings.profile_visible}
            onValueChange={(value) => updateSetting('profile_visible', value)}
          />
          
          <SettingRow
            title="Statut en ligne"
            description="Afficher quand vous êtes en ligne"
            value={settings.show_online_status}
            onValueChange={(value) => updateSetting('show_online_status', value)}
          />
          
          <SettingRow
            title="Localisation approximative"
            description="Afficher votre ville sur votre profil"
            value={settings.show_location}
            onValueChange={(value) => updateSetting('show_location', value)}
          />
          
          <SettingRow
            title="Événements participés"
            description="Afficher l'historique de vos événements"
            value={settings.show_events_attended}
            onValueChange={(value) => updateSetting('show_events_attended', value)}
          />
          
          <SettingRow
            title="Statistiques"
            description="Afficher vos stats (nb événements, taux participation...)"
            value={settings.show_stats}
            onValueChange={(value) => updateSetting('show_stats', value)}
          />
        </View>

        {/* Interactions sociales */}
        <View className="px-6 py-6 border-b border-slate-700">
          <Text className="text-white text-lg font-semibold mb-4">Interactions sociales</Text>
          
          <SettingRow
            title="Demandes d'amis"
            description="Permettre aux autres de vous envoyer des demandes d'amis"
            value={settings.allow_friend_requests}
            onValueChange={(value) => updateSetting('allow_friend_requests', value)}
          />
          
          <SettingRow
            title="Invitations aux événements"
            description="Permettre aux autres de vous inviter à des événements"
            value={settings.allow_event_invitations}
            onValueChange={(value) => updateSetting('allow_event_invitations', value)}
          />
          
          <SettingRow
            title="Messages privés"
            description="Permettre aux autres de vous envoyer des messages"
            value={settings.allow_messages}
            onValueChange={(value) => updateSetting('allow_messages', value)}
          />
          
          <SettingRow
            title="Apparaître dans les recherches"
            description="Permettre aux autres de vous trouver via la recherche"
            value={settings.show_in_search}
            onValueChange={(value) => updateSetting('show_in_search', value)}
          />
        </View>

        {/* Messages et chat */}
        <View className="px-6 py-6 border-b border-slate-700">
          <Text className="text-white text-lg font-semibold mb-4">Messages et chat</Text>
          
          <SettingRow
            title="Statut d'activité"
            description="Afficher quand vous lisez les messages"
            value={settings.activity_status}
            onValueChange={(value) => updateSetting('activity_status', value)}
          />
          
          <SettingRow
            title="Accusés de lecture"
            description="Informer les autres quand vous lisez leurs messages"
            value={settings.read_receipts}
            onValueChange={(value) => updateSetting('read_receipts', value)}
          />
        </View>

        {/* Données et tracking */}
        <View className="px-6 py-6 border-b border-slate-700">
          <Text className="text-white text-lg font-semibold mb-4">Données et analytics</Text>
          
          <SettingRow
            title="Analytics et amélioration"
            description="Aider à améliorer l'app en partageant des données d'usage"
            value={settings.analytics_tracking}
            onValueChange={(value) => updateSetting('analytics_tracking', value)}
          />
          
          <SettingRow
            title="Rapports de crash"
            description="Envoyer automatiquement les rapports d'erreur"
            value={settings.crash_reporting}
            onValueChange={(value) => updateSetting('crash_reporting', value)}
          />
          
          <SettingRow
            title="Données de performance"
            description="Partager les données de performance de l'app"
            value={settings.performance_data}
            onValueChange={(value) => updateSetting('performance_data', value)}
          />
          
          <SettingRow
            title="Géolocalisation"
            description="Permettre le tracking de localisation pour les fonctionnalités"
            value={settings.location_tracking}
            onValueChange={(value) => updateSetting('location_tracking', value)}
            dangerous={true}
          />
        </View>

        {/* Gestion des données */}
        <View className="px-6 py-6 border-b border-slate-700">
          <Text className="text-white text-lg font-semibold mb-4">Gestion des données</Text>
          
          <TouchableOpacity
            onPress={viewDataUsage}
            className="flex-row items-center py-4 border-b border-slate-600"
          >
            <Ionicons name="pie-chart-outline" size={24} color="#3B82F6" />
            <View className="ml-4">
              <Text className="text-white font-medium">Utilisation des données</Text>
              <Text className="text-gray-400 text-sm">Voir combien de données vous utilisez</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={blockUser}
            className="flex-row items-center py-4 border-b border-slate-600"
          >
            <Ionicons name="ban-outline" size={24} color="#EF4444" />
            <View className="ml-4">
              <Text className="text-white font-medium">Utilisateurs bloqués</Text>
              <Text className="text-gray-400 text-sm">Gérer votre liste d'utilisateurs bloqués</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Politique et légal */}
        <View className="px-6 py-6 border-b border-slate-700">
          <Text className="text-white text-lg font-semibold mb-4">Politique et légal</Text>
          
          <TouchableOpacity className="flex-row items-center py-4 border-b border-slate-600">
            <Ionicons name="document-text-outline" size={24} color="#3B82F6" />
            <View className="ml-4">
              <Text className="text-white font-medium">Politique de confidentialité</Text>
              <Text className="text-gray-400 text-sm">Lire notre politique de confidentialité</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row items-center py-4 border-b border-slate-600">
            <Ionicons name="shield-checkmark-outline" size={24} color="#3B82F6" />
            <View className="ml-4">
              <Text className="text-white font-medium">Conditions d'utilisation</Text>
              <Text className="text-gray-400 text-sm">Consulter nos conditions d'utilisation</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Zone de danger */}
        <View className="px-6 py-6">
          <Text className="text-red-500 text-lg font-semibold mb-4">Zone de danger</Text>
          
          <TouchableOpacity
            onPress={clearAllData}
            className="bg-red-600 py-4 rounded-lg mb-4"
          >
            <Text className="text-white text-center font-semibold">Effacer toutes mes données</Text>
          </TouchableOpacity>
          
          <Text className="text-gray-400 text-sm text-center">
            Cette action supprimera définitivement toutes vos données personnelles et ne peut pas être annulée.
          </Text>
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