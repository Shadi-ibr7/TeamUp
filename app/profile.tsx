import { Ionicons } from '@expo/vector-icons';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/context/AuthContext';
import { EventService } from '../lib/services/events';
import { ProfileService, UserProfile, UserStats } from '../lib/services/profile';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [createdEvents, setCreatedEvents] = useState<any[]>([]);
  const [showCreatedEvents, setShowCreatedEvents] = useState(false);

  // Recharger les données à chaque fois qu'on revient sur la page
  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        console.log('Rechargement des données du profil...');
        loadProfileData();
      }
    }, [user])
  );

  const loadProfileData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      console.log('🔄 Rechargement des données du profil...');
      const profileData = await ProfileService.getUserProfile(user.id);
      
      if (profileData) {
        console.log('✅ Profil chargé:', {
          name: profileData.name,
          avatar_url: profileData.avatar_url,
          hasAvatar: !!profileData.avatar_url
        });
        
        setProfile(profileData);
      } else {
        console.log('⚠️ Aucun profil trouvé, utilisation de données par défaut');
        // Utiliser des données par défaut si le profil n'existe pas
        setProfile({
          id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utilisateur',
          email: user.email || '',
          bio: '',
          preferred_sports: [],
          skill_levels: {},
          availability: '',
          avatar_url: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }

      // Charger les vraies statistiques
      console.log('📊 Chargement des statistiques...');
      const userStats = await ProfileService.getUserStats(user.id);
      if (userStats) {
        console.log('✅ Statistiques chargées:', userStats);
        setStats(userStats);
      } else {
        console.log('⚠️ Aucune statistique trouvée, utilisation de valeurs par défaut');
        setStats({
          user_id: user.id,
          events_created: 0,
          events_participated: 0,
          participation_rate: 0,
          wins: 0,
          badges_earned: []
        });
      }

      // Charger l'historique des événements passés
      console.log('📅 Chargement de l\'historique...');
      const pastEventsData = await ProfileService.getUserPastEvents(user.id);
      setPastEvents(pastEventsData);
      console.log('✅ Historique chargé:', pastEventsData.length, 'événements');

      // Charger les événements créés par l'utilisateur
      console.log('🎯 Chargement des événements créés...');
      const createdEventsData = await EventService.getUserCreatedEvents(user.id);
      setCreatedEvents(createdEventsData);
      console.log('✅ Événements créés chargés:', createdEventsData.length, 'événements');

    } catch (error) {
      console.error('❌ Erreur lors du chargement du profil:', error);
      // En cas d'erreur, utiliser des données par défaut
      setProfile({
        id: user?.id || '',
        name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utilisateur',
        email: user?.email || '',
        bio: '',
        preferred_sports: [],
        skill_levels: {},
        availability: '',
        avatar_url: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      setStats({
        user_id: user?.id || '',
        events_created: 0,
        events_participated: 0,
        participation_rate: 0,
        wins: 0,
        badges_earned: []
      });
    } finally {
      setLoading(false);
    }
  };

  const getSkillColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-500';
      case 'Intermediate': return 'bg-yellow-500';
      case 'Advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner': return 'bg-green-500';
      case 'Intermediate': return 'bg-yellow-500';
      case 'Advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/welcome');
            } catch (error) {
              console.error('Erreur de déconnexion:', error);
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    router.push('/edit-profile');
  };

  const handleViewTeams = () => {
    // TODO: Implémenter la navigation vers les équipes
    console.log('View Teams clicked');
  };

  const handleShareProfile = () => {
    // TODO: Implémenter le partage de profil
    console.log('Share Profile clicked');
  };

  const handleGenerateQR = () => {
    // TODO: Implémenter la génération de QR code
    console.log('Generate QR clicked');
  };

  const handleSettings = () => {
    setShowSettingsMenu(true);
  };

  const handleAccountSettings = () => {
    setShowSettingsMenu(false);
    router.push('/settings/account');
  };

  const handleNotificationSettings = () => {
    setShowSettingsMenu(false);
    router.push('/settings/notifications');
  };

  const handlePrivacySettings = () => {
    setShowSettingsMenu(false);
    router.push('/settings/privacy');
  };

  // Supprimer un événement
  const handleDeleteEvent = async (eventId: string) => {
    Alert.alert(
      'Supprimer l\'événement',
      'Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              if (user?.id) {
                await EventService.deleteEvent(eventId, user.id);
                Alert.alert('Succès', 'Événement supprimé avec succès');
                // Recharger les événements
                await loadProfileData();
              }
            } catch (error: any) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', error.message || 'Impossible de supprimer l\'événement');
            }
          },
        },
      ]
    );
  };

  const badges = stats?.badges_earned || ['Organisateur régulier', 'Fair-play', 'Team Player', 'Ponctuel', 'Sportif du mois'];

  // Formater la date d'un événement
  const formatEventDate = (date: string, time?: string) => {
    const eventDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const isToday = eventDate.toDateString() === today.toDateString();
    const isTomorrow = eventDate.toDateString() === tomorrow.toDateString();

    if (isToday) {
      return `Aujourd'hui ${time || ''}`;
    } else if (isTomorrow) {
      return `Demain ${time || ''}`;
    } else {
      return `${eventDate.toLocaleDateString('fr-FR')} ${time || ''}`;
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-800 justify-center items-center">
        <Text className="text-white">Chargement du profil...</Text>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 bg-slate-800 justify-center items-center">
        <Text className="text-white">Erreur lors du chargement du profil</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#141A1F]">
      <StatusBar barStyle="light-content" backgroundColor="#141A1F" />
      
      <ScrollView className="flex-1">
        {/* Header avec photo et info de base */}
        <View className="bg-[#141A1F] px-4 py-6">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-[#FFFFFF] text-2xl font-bold">Profile</Text>
            <TouchableOpacity onPress={handleSettings}>
              <Ionicons name="settings-outline" size={24} color="#9EB0BD" />
            </TouchableOpacity>
          </View>
          
          <View className="items-center">
            <View className="relative mb-4">
              <View className="w-32 h-32 rounded-full bg-[#2B3840] items-center justify-center border-4 border-[#C4D9EB] overflow-hidden">
                {profile?.avatar_url && profile.avatar_url.trim() !== '' ? (
                  <Image
                    source={{ 
                      uri: profile.avatar_url,
                      cache: 'reload'
                    }}
                    className="w-full h-full"
                    onLoad={() => {
                      console.log('✅ Image chargée avec succès');
                    }}
                    onError={() => {
                      console.log('❌ Erreur de chargement image, suppression URL');
                      // Supprimer l'URL invalide
                      if (user?.id) {
                        ProfileService.updateUserProfile(user.id, { avatar_url: '' });
                        setProfile(prev => prev ? { ...prev, avatar_url: '' } : null);
                      }
                    }}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      borderRadius: 64 
                    }}
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full items-center justify-center">
                    <Ionicons name="person" size={60} color="#9EB0BD" />
                    <Text className="text-[#9EB0BD] text-xs mt-1">Aucune photo</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity 
                onPress={() => router.push('/edit-profile')}
                className="absolute bottom-0 right-0 bg-[#C4D9EB] rounded-full p-2"
              >
                <Ionicons name="camera" size={20} color="#141A1F" />
              </TouchableOpacity>
            </View>
            
            <Text className="text-[#FFFFFF] text-2xl font-bold mb-1">{profile.name}</Text>
            <Text className="text-[#9EB0BD] text-base mb-4">{user?.email}</Text>
            
            <View className="flex-row space-x-4">
              <TouchableOpacity 
                onPress={() => router.push('/edit-profile')}
                className="bg-[#C4D9EB] px-6 py-2 rounded-full mr-3"
              >
                <Text className="text-[#141A1F] font-semibold">Modifier le profil</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleShareProfile}
                className="bg-[#2B3840] px-6 py-2 rounded-full"
              >
                <Text className="text-[#FFFFFF] font-semibold">Partager</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Statistiques */}
        <View className="bg-[#2B3840] mx-4 rounded-2xl p-4 mb-4">
          <Text className="text-[#FFFFFF] text-lg font-bold mb-4">Statistiques</Text>
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-[#C4D9EB] text-2xl font-bold">{stats?.events_created || 0}</Text>
              <Text className="text-[#9EB0BD] text-sm">Événements</Text>
            </View>
            <View className="items-center">
              <Text className="text-[#C4D9EB] text-2xl font-bold">{stats?.events_participated || 0}</Text>
              <Text className="text-[#9EB0BD] text-sm">Participations</Text>
            </View>
            <View className="items-center">
              <Text className="text-[#C4D9EB] text-2xl font-bold">{stats?.wins || 0}</Text>
              <Text className="text-[#9EB0BD] text-sm">Amis</Text>
            </View>
          </View>
          {stats?.participation_rate !== undefined && (
            <View className="mt-4 pt-4 border-t border-[#141A1F]">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[#9EB0BD] text-sm">Taux de participation</Text>
                <Text className="text-[#C4D9EB] font-bold">{stats.participation_rate}%</Text>
              </View>
              <View className="w-full bg-[#141A1F] rounded-full h-2">
                <View 
                  className="bg-[#C4D9EB] h-2 rounded-full" 
                  style={{ width: `${Math.min(stats.participation_rate, 100)}%` }}
                />
              </View>
            </View>
          )}
        </View>

        {/* Sports favoris */}
        <View className="bg-[#2B3840] mx-4 rounded-2xl p-4 mb-4">
          <Text className="text-[#FFFFFF] text-lg font-bold mb-4">Sports favoris</Text>
          <View className="flex-row flex-wrap">
            {profile?.preferred_sports && profile.preferred_sports.length > 0 ? (
              profile.preferred_sports.map((sport, index) => (
                <View key={index} className="bg-[#C4D9EB] rounded-full px-3 py-1 mr-2 mb-2">
                  <Text className="text-[#141A1F] font-medium">{sport}</Text>
                </View>
              ))
            ) : (
              <Text className="text-[#9EB0BD] text-sm">Aucun sport favori défini</Text>
            )}
          </View>
        </View>

        {/* Niveau de compétence */}
        <View className="bg-[#2B3840] mx-4 rounded-2xl p-4 mb-4">
          <Text className="text-[#FFFFFF] text-lg font-bold mb-4">Niveau de compétence</Text>
          <View className="space-y-3">
            {profile?.skill_levels && Object.keys(profile.skill_levels).length > 0 ? (
              Object.entries(profile.skill_levels).map(([sport, level], index) => (
                <View key={index} className="flex-row items-center justify-between">
                  <Text className="text-[#FFFFFF] font-medium">{sport}</Text>
                  <View className={`px-3 py-1 rounded-full ${getLevelColor(level)}`}>
                    <Text className="text-[#FFFFFF] text-xs font-medium">{level}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text className="text-[#9EB0BD] text-sm">Aucun niveau de compétence défini</Text>
            )}
          </View>
        </View>

        {/* Badges gagnés */}
        {stats?.badges_earned && stats.badges_earned.length > 0 && (
          <View className="bg-[#2B3840] mx-4 rounded-2xl p-4 mb-4">
            <Text className="text-[#FFFFFF] text-lg font-bold mb-4">Badges gagnés</Text>
            <View className="flex-row flex-wrap">
              {stats.badges_earned.map((badge, index) => (
                <View key={index} className="bg-[#C4D9EB] rounded-full px-3 py-1 mr-2 mb-2">
                  <Text className="text-[#141A1F] font-medium text-xs">{badge}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Mes événements créés */}
        <View className="bg-[#2B3840] mx-4 rounded-2xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-[#FFFFFF] text-lg font-bold">Mes événements créés</Text>
            <TouchableOpacity 
              onPress={() => setShowCreatedEvents(!showCreatedEvents)}
              className="flex-row items-center"
            >
              <Text className="text-[#C4D9EB] text-sm mr-1">
                {showCreatedEvents ? 'Masquer' : 'Voir'}
              </Text>
              <Ionicons 
                name={showCreatedEvents ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="#C4D9EB" 
              />
            </TouchableOpacity>
          </View>
          
          {showCreatedEvents && (
            <View>
              {createdEvents.length === 0 ? (
                <View className="items-center py-6">
                  <Ionicons name="calendar-outline" size={48} color="#9EB0BD" />
                  <Text className="text-[#9EB0BD] text-base mt-2">Aucun événement créé</Text>
                  <TouchableOpacity 
                    className="bg-[#C4D9EB] rounded-full px-4 py-2 mt-3"
                    onPress={() => router.push('/create-event')}
                  >
                    <Text className="text-[#141A1F] font-semibold">Créer un événement</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="space-y-3">
                  {createdEvents.slice(0, 3).map((event) => (
                    <TouchableOpacity
                      key={event.id}
                      className="bg-[#141A1F] rounded-xl p-3"
                      onPress={() => router.push(`/events/${event.id}`)}
                    >
                      <View className="flex-row items-center">
                        {event.image_url ? (
                          <Image 
                            source={{ uri: event.image_url }} 
                            className="w-12 h-12 rounded-lg mr-3"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-12 h-12 bg-[#2B3840] rounded-lg items-center justify-center mr-3">
                            <Ionicons name="calendar" size={24} color="#9EB0BD" />
                          </View>
                        )}
                        
                        <View className="flex-1">
                          <Text className="text-[#FFFFFF] font-semibold text-base">{event.title}</Text>
                          <Text className="text-[#9EB0BD] text-sm">
                            {formatEventDate(event.date, event.time)}
                          </Text>
                          <Text className="text-[#9EB0BD] text-sm">
                            {event.current_participants}/{event.max_participants} participants
                          </Text>
                        </View>
                        
                        <View className="flex-row">
                          <TouchableOpacity 
                            className="bg-[#C4D9EB] rounded-full p-2 mr-2"
                            onPress={() => router.push(`/edit-event/${event.id}`)}
                          >
                            <Ionicons name="create-outline" size={16} color="#141A1F" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            className="bg-[#ff6b6b] rounded-full p-2"
                            onPress={() => handleDeleteEvent(event.id)}
                          >
                            <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                  
                  {createdEvents.length > 3 && (
                    <TouchableOpacity 
                      className="bg-[#C4D9EB] rounded-xl p-3 items-center"
                      onPress={() => router.push('/my-events')}
                    >
                      <Text className="text-[#141A1F] font-semibold">
                        Voir tous mes événements ({createdEvents.length})
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Actions rapides */}
        <View className="bg-[#2B3840] mx-4 rounded-2xl p-4 mb-4">
          <Text className="text-[#FFFFFF] text-lg font-bold mb-4">Actions rapides</Text>
          <View className="space-y-3">
            <TouchableOpacity 
              onPress={() => router.push('/create-event')}
              className="flex-row items-center py-3"
            >
              <Ionicons name="add-circle-outline" size={24} color="#C4D9EB" />
              <Text className="text-[#FFFFFF] ml-3 font-medium">Créer un événement</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleGenerateQR}
              className="flex-row items-center py-3"
            >
              <Ionicons name="qr-code-outline" size={24} color="#C4D9EB" />
              <Text className="text-[#FFFFFF] ml-3 font-medium">Générer QR Code</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => router.push('/settings/account')}
              className="flex-row items-center py-3"
            >
              <Ionicons name="settings-outline" size={24} color="#C4D9EB" />
              <Text className="text-[#FFFFFF] ml-3 font-medium">Paramètres</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <SafeAreaView edges={['bottom']} className="bg-[#141A1F]">
        <View className="bg-[#2B3840] flex-row justify-around items-center py-2 px-2 border-t border-[#2B3840]">
          <Link href="/" asChild>
            <TouchableOpacity className="items-center">
              <Ionicons name="home-outline" size={24} color="#9EB0BD" />
              <Text className="text-[#9EB0BD] text-xs mt-1">Home</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/events" asChild>
            <TouchableOpacity className="items-center">
              <Ionicons name="calendar-outline" size={24} color="#9EB0BD" />
              <Text className="text-[#9EB0BD] text-xs mt-1">Events</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/discover" asChild>
            <TouchableOpacity className="items-center">
              <Ionicons name="location-outline" size={24} color="#9EB0BD" />
              <Text className="text-[#9EB0BD] text-xs mt-1">Discover</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/chat" asChild>
            <TouchableOpacity className="items-center">
              <Ionicons name="chatbubble-outline" size={24} color="#9EB0BD" />
              <Text className="text-[#9EB0BD] text-xs mt-1">Chat</Text>
            </TouchableOpacity>
          </Link>
          <TouchableOpacity className="items-center">
            <Ionicons name="person" size={24} color="#C4D9EB" />
            <Text className="text-[#C4D9EB] text-xs mt-1 font-medium">Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Menu des paramètres */}
      <Modal
        visible={showSettingsMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSettingsMenu(false)}
      >
        <TouchableOpacity 
          className="flex-1 bg-black/50 justify-center items-center"
          activeOpacity={1}
          onPress={() => setShowSettingsMenu(false)}
        >
          <View className="bg-[#2B3840] rounded-2xl p-6 mx-8 w-80">
            <Text className="text-[#FFFFFF] text-xl font-bold mb-6 text-center">Paramètres</Text>
            
            <TouchableOpacity 
              onPress={handleAccountSettings}
              className="flex-row items-center py-4 border-b border-[#141A1F]"
            >
              <Ionicons name="person-outline" size={24} color="#C4D9EB" />
              <Text className="text-[#FFFFFF] ml-4 font-medium">Compte</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleNotificationSettings}
              className="flex-row items-center py-4 border-b border-[#141A1F]"
            >
              <Ionicons name="notifications-outline" size={24} color="#C4D9EB" />
              <Text className="text-[#FFFFFF] ml-4 font-medium">Notifications</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handlePrivacySettings}
              className="flex-row items-center py-4 border-b border-[#141A1F]"
            >
              <Ionicons name="shield-outline" size={24} color="#C4D9EB" />
              <Text className="text-[#FFFFFF] ml-4 font-medium">Confidentialité</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleSignOut}
              className="flex-row items-center py-4"
            >
              <Ionicons name="log-out-outline" size={24} color="#ff4444" />
              <Text className="text-[#ff4444] ml-4 font-medium">Déconnexion</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => setShowSettingsMenu(false)}
              className="bg-[#141A1F] py-3 rounded-lg mt-4"
            >
              <Text className="text-[#FFFFFF] text-center font-semibold">Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
} 