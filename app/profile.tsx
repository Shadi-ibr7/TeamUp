import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/context/AuthContext';
import { useTheme } from '../lib/context/ThemeContext';
import { EventService } from '../lib/services/events';
import { ProfileService, UserProfile, UserStats } from '../lib/services/profile';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isDarkMode, colors } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [createdEvents, setCreatedEvents] = useState<any[]>([]);
  const [showCreatedEvents, setShowCreatedEvents] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) {
        loadProfileData();
      }
    }, [user])
  );

  const loadProfileData = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const profileData = await ProfileService.getUserProfile(user.id);
      if (profileData) {
        setProfile(profileData);
      } else {
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

      const userStats = await ProfileService.getUserStats(user.id);
      setStats(userStats || {
        user_id: user.id,
        events_created: 0,
        events_participated: 0,
        participation_rate: 0,
        wins: 0,
        badges_earned: []
      });

      const pastEventsData = await ProfileService.getUserPastEvents(user.id);
      setPastEvents(pastEventsData);

      const createdEventsData = await EventService.getUserCreatedEvents(user.id);
      setCreatedEvents(createdEventsData);
    } catch (error) {
      console.error('Erreur profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const getSportIcon = (sport: string) => {
    const icons: { [key: string]: string } = {
      'Football': '⚽', 'Basketball': '🏀', 'Tennis': '🎾', 'Running': '🏃‍♂️', 'Cycling': '🚴‍♂️', 'Swimming': '🏊‍♂️'
    };
    return icons[sport] || '🏟️';
  };

  const getSportColor = (sport: string) => {
    const colors: { [key: string]: string } = {
      'Football': '#22c55e', 'Basketball': '#f59e0b', 'Tennis': '#0891b2', 'Running': '#d97706', 'Cycling': '#16a34a', 'Swimming': '#0284c7'
    };
    return colors[sport] || '#6b7280';
  };

  const formatEventDate = (date: string, time?: string) => {
    const eventDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    let dateStr = '';
    if (eventDate.toDateString() === today.toDateString()) dateStr = 'Aujourd\'hui';
    else if (eventDate.toDateString() === tomorrow.toDateString()) dateStr = 'Demain';
    else dateStr = eventDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    if (time) dateStr += ` à ${time}`;
    return dateStr;
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {/* StatusBar géré globalement */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: isDarkMode ? colors.mutedForeground : '#666' }}>Chargement du profil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Background géré globalement par _layout.tsx */}

          {/* Header simple */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: isDarkMode ? colors.foreground : '#111' }}>Profil</Text>
            <TouchableOpacity onPress={() => setShowSettingsMenu(true)} style={{ padding: 8, borderRadius: 999, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
              <Ionicons name="settings-outline" size={22} color={isDarkMode ? colors.foreground : '#111'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            {/* Carte profil */}
            <View style={{ backgroundColor: isDarkMode ? colors.card : 'rgba(255,255,255,0.6)', borderRadius: 16, borderWidth: 1, borderColor: isDarkMode ? colors.border : 'rgba(0,0,0,0.08)', padding: 16, marginBottom: 16, alignItems: 'center' }}>
              <View style={{ position: 'relative', marginBottom: 16 }}>
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={{ width: 96, height: 96, borderRadius: 48 }} />
                ) : (
                  <View style={{ width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: isDarkMode ? colors.input : 'rgba(0,122,255,0.2)' }}>
                    <Ionicons name="person" size={48} color={colors.primary} />
                  </View>
                )}
                <TouchableOpacity style={{ position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary }}>
                  <Ionicons name="camera" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 8, color: isDarkMode ? colors.foreground : '#111' }}>{profile?.name || 'Utilisateur'}</Text>
              <Text style={{ textAlign: 'center', color: isDarkMode ? colors.mutedForeground : '#666', marginBottom: 8 }}>{profile?.bio || 'Aucune bio pour le moment'}</Text>
              <TouchableOpacity onPress={() => router.push('/edit-profile')} style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: isDarkMode ? colors.input : 'rgba(0,0,0,0.06)' }}>
                <Text style={{ color: isDarkMode ? colors.foreground : '#111', fontWeight: '600' }}>Modifier le profil</Text>
              </TouchableOpacity>
            </View>

            {/* Statistiques */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12, color: isDarkMode ? colors.foreground : '#111' }}>Statistiques</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {[{icon:'calendar', value: stats?.events_participated||0, label:'Participations'}, {icon:'trophy', value: stats?.events_created||0, label:'Créés'}, {icon:'star', value: stats?.wins||0, label:'Victoires'}].map((s, idx) => (
                  <View key={idx} style={{ flex: 1, alignItems: 'center', backgroundColor: isDarkMode ? colors.card : 'rgba(255,255,255,0.6)', borderRadius: 14, borderWidth: 1, borderColor: isDarkMode ? colors.border : 'rgba(0,0,0,0.08)', padding: 12 }}>
                    <Ionicons name={s.icon as any} size={22} color={colors.primary} />
                    <Text style={{ fontSize: 20, fontWeight: '700', marginTop: 6, color: isDarkMode ? colors.foreground : '#111' }}>{s.value}</Text>
                    <Text style={{ fontSize: 12, color: isDarkMode ? colors.mutedForeground : '#666' }}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Sports préférés */}
            {profile?.preferred_sports && profile.preferred_sports.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12, color: isDarkMode ? colors.foreground : '#111' }}>Sports préférés</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {profile.preferred_sports.map((sport, index) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: getSportColor(sport) + '20' }}>
                      <Text style={{ fontSize: 18, marginRight: 8 }}>{getSportIcon(sport)}</Text>
                      <Text style={{ fontWeight: '600', color: isDarkMode ? colors.foreground : '#111' }}>{sport}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Événements récents */}
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: isDarkMode ? colors.foreground : '#111' }}>Événements récents</Text>
                <TouchableOpacity onPress={() => setShowCreatedEvents(!showCreatedEvents)}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary }}>{showCreatedEvents ? 'Voir participations' : 'Voir créés'}</Text>
                </TouchableOpacity>
              </View>
              <View style={{ gap: 12 }}>
                {(showCreatedEvents ? createdEvents : pastEvents).slice(0, 3).map((event) => (
                  <TouchableOpacity key={event.id} onPress={() => router.push(`/events/${event.id}`)}>
                    <View style={{ backgroundColor: isDarkMode ? colors.card : 'rgba(255,255,255,0.6)', borderRadius: 14, borderWidth: 1, borderColor: isDarkMode ? colors.border : 'rgba(0,0,0,0.08)', padding: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: getSportColor(event.sport_type) }}>
                          <Text style={{ fontSize: 18 }}> {getSportIcon(event.sport_type)} </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontWeight: '600', color: isDarkMode ? colors.foreground : '#111' }}>{event.title}</Text>
                          <Text style={{ fontSize: 12, color: isDarkMode ? colors.mutedForeground : '#666' }}>{formatEventDate(event.date, event.time)}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={isDarkMode ? colors.mutedForeground : '#666'} />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Actions rapides */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12, color: isDarkMode ? colors.foreground : '#111' }}>Actions rapides</Text>
              <View style={{ gap: 12 }}>
                <TouchableOpacity onPress={() => router.push('/create-event')} style={{ paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: isDarkMode ? colors.input : 'rgba(0,0,0,0.06)' }}>
                  <Text style={{ fontWeight: '700', color: isDarkMode ? colors.foreground : '#111' }}>Créer un événement</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/events')} style={{ paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: isDarkMode ? colors.input : 'rgba(0,0,0,0.06)' }}>
                  <Text style={{ fontWeight: '700', color: isDarkMode ? colors.foreground : '#111' }}>Voir tous les événements</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/discover')} style={{ paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: isDarkMode ? colors.input : 'rgba(0,0,0,0.06)' }}>
                  <Text style={{ fontWeight: '700', color: isDarkMode ? colors.foreground : '#111' }}>Découvrir</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Modal paramètres */}
          <Modal visible={showSettingsMenu} transparent animationType="slide" onRequestClose={() => setShowSettingsMenu(false)}>
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
              <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onTouchEnd={() => setShowSettingsMenu(false)} />
              <View style={{ margin: 16, padding: 16, borderRadius: 16, backgroundColor: isDarkMode ? colors.card : 'rgba(255,255,255,0.95)' }}>
                <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12, color: isDarkMode ? colors.foreground : '#111' }}>Paramètres</Text>
                <View style={{ gap: 8 }}>
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }} onPress={() => { setShowSettingsMenu(false); router.push('/settings/account'); }}>
                    <Ionicons name="person-outline" size={24} color={colors.primary} />
                    <Text style={{ marginLeft: 12, flex: 1, color: isDarkMode ? colors.foreground : '#111' }}>Compte</Text>
                    <Ionicons name="chevron-forward" size={20} color={isDarkMode ? colors.mutedForeground : '#666'} />
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }} onPress={() => { setShowSettingsMenu(false); router.push('/settings/notifications'); }}>
                    <Ionicons name="notifications-outline" size={24} color={colors.primary} />
                    <Text style={{ marginLeft: 12, flex: 1, color: isDarkMode ? colors.foreground : '#111' }}>Notifications</Text>
                    <Ionicons name="chevron-forward" size={20} color={isDarkMode ? colors.mutedForeground : '#666'} />
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }} onPress={() => { setShowSettingsMenu(false); router.push('/settings/privacy'); }}>
                    <Ionicons name="shield-outline" size={24} color={colors.primary} />
                    <Text style={{ marginLeft: 12, flex: 1, color: isDarkMode ? colors.foreground : '#111' }}>Confidentialité</Text>
                    <Ionicons name="chevron-forward" size={20} color={isDarkMode ? colors.mutedForeground : '#666'} />
                  </TouchableOpacity>
                  <View style={{ borderTopWidth: 1, borderColor: isDarkMode ? colors.border : 'rgba(0,0,0,0.08)', paddingTop: 12 }}>
                    <TouchableOpacity onPress={handleSignOut} style={{ paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.destructive }}>
                      <Text style={{ color: '#fff', fontWeight: '700' }}>Se déconnecter</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </Modal>
    </SafeAreaView>
  );
} 