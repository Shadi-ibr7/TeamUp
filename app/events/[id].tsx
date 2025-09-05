import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, Linking, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/context/AuthContext';
import { EventService } from '../../lib/services/events';

export default function EventDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (id) {
      loadEventData();
    }
  }, [id]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      const event = await EventService.getEventById(id as string);
      setEventData(event);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'événement:', error);
      setEventData(mockEventData);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = async () => {
    if (!user || !eventData) return;
    setIsJoining(true);
    try {
      await EventService.joinEvent(eventData.id, user.id);
      Alert.alert('Succès', 'Vous avez rejoint l\'événement ! Un groupe de chat a été créé automatiquement.', [{ text: 'OK', onPress: () => router.push("/chat") }]);
      loadEventData();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de rejoindre l\'événement');
    } finally {
      setIsJoining(false);
    }
  };

  const mockEventData = {
    id: id,
    title: "Football Championship",
    description: "Join us for an exciting football championship match. All skill levels welcome!",
    date: new Date().toISOString(),
    time: "18:00",
    location: "Central Stadium, Downtown",
    current_participants: 22,
    max_participants: 24,
    sport_type: "Football",
    price: 0,
    organizer: { name: "Sports Club FC" },
    participants: [
      { user: { name: "John Doe", avatar_url: null } },
      { user: { name: "Jane Smith", avatar_url: null } },
      { user: { name: "Mike Johnson", avatar_url: null } },
      { user: { name: "Sarah Wilson", avatar_url: null } }
    ]
  };

  const formatEventDate = (date: string, time?: string) => {
    const eventDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    let dateStr = '';
    if (eventDate.toDateString() === today.toDateString()) dateStr = 'Today';
    else if (eventDate.toDateString() === tomorrow.toDateString()) dateStr = 'Tomorrow';
    else dateStr = eventDate.toLocaleDateString('fr-FR');
    if (time) dateStr += `, ${time}`;
    return dateStr;
  };

  const openInMaps = () => {
    const label = encodeURIComponent(eventData.location);
    const lat = eventData.latitude;
    const lng = eventData.longitude;
    let url = '';
    if (Platform.OS === 'ios') {
      if (lat && lng) url = `http://maps.apple.com/?ll=${lat},${lng}&q=${label}`;
      else url = `http://maps.apple.com/?q=${label}`;
    } else if (Platform.OS === 'android') {
      if (lat && lng) url = `geo:${lat},${lng}?q=${label}`;
      else url = `geo:0,0?q=${label}`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${label}`;
    }
    Linking.openURL(url).catch(err => console.error('Impossible d\'ouvrir l\'application de cartes', err));
  };

  const getSportIcon = (sport: string) => {
    const icons: { [key: string]: string } = {
      'Football': '⚽', 'Basketball': '🏀', 'Tennis': '🎾', 'Running': '🏃‍♂️', 'Cycling': '🚴‍♂️', 'Swimming': '🏊‍♂️', 'Volleyball': '🏐', 'Badminton': '🏸'
    };
    return icons[sport] || '🏟️';
  };

  const getSportColor = (sport: string) => {
    const colors: { [key: string]: string } = {
      'Football': '#22c55e', 'Basketball': '#f59e0b', 'Tennis': '#0891b2', 'Running': '#d97706', 'Cycling': '#16a34a', 'Swimming': '#06b6d4', 'Volleyball': '#8b5cf6', 'Badminton': '#ec4899'
    };
    return colors[sport] || '#6b7280';
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
{/* StatusBar géré globalement */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#666' }}>Chargement de l'événement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!eventData) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
{/* StatusBar géré globalement */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#111' }}>Événement non trouvé</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isFull = eventData.current_participants >= eventData.max_participants;
  const isOrganizer = user?.id === eventData.organizer_id;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Background géré globalement par _layout.tsx */}
          
          {/* Header simple */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.05)' }}>
              <Ionicons name="arrow-back" size={22} color="#111" />
            </TouchableOpacity>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#111' }}>Détails</Text>
            {isOrganizer && (
              <TouchableOpacity onPress={() => router.push(`/edit-event/${eventData.id}`)} style={{ padding: 8, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.05)' }}>
                <Ionicons name="create-outline" size={22} color="#111" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            {/* Event Header */}
            <View style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', padding: 24, marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginRight: 16, backgroundColor: getSportColor(eventData.sport_type) }}>
                  <Text style={{ fontSize: 32 }}>{getSportIcon(eventData.sport_type)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 8, color: '#111' }}>{eventData.title}</Text>
                  <Text style={{ fontSize: 18, color: '#666' }}>{eventData.sport_type}</Text>
                </View>
                {eventData.price === 0 && (
                  <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(0,122,255,0.2)' }}>
                    <Text style={{ fontWeight: '700', color: '#007AFF' }}>GRATUIT</Text>
                  </View>
                )}
              </View>

              {/* Description */}
              <Text style={{ fontSize: 16, marginBottom: 24, color: '#111' }}>{eventData.description}</Text>

              {/* Event Info Grid */}
              <View style={{ gap: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16, backgroundColor: 'rgba(0,122,255,0.2)' }}>
                    <Ionicons name="calendar" size={20} color="#007AFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: '#666' }}>Date & Heure</Text>
                    <Text style={{ fontWeight: '600', color: '#111' }}>{formatEventDate(eventData.date, eventData.time)}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16, backgroundColor: 'rgba(0,122,255,0.2)' }}>
                    <Ionicons name="location" size={20} color="#007AFF" />
                  </View>
                  <TouchableOpacity onPress={openInMaps} style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, color: '#666' }}>Lieu</Text>
                      <Text style={{ fontWeight: '600', color: '#111' }}>{eventData.location}</Text>
                    </View>
                    <Ionicons name="open-outline" size={20} color="#007AFF" />
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16, backgroundColor: 'rgba(0,122,255,0.2)' }}>
                    <Ionicons name="people" size={20} color="#007AFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: '#666' }}>Participants</Text>
                    <Text style={{ fontWeight: '600', color: '#111' }}>{eventData.current_participants}/{eventData.max_participants}</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16, backgroundColor: 'rgba(0,122,255,0.2)' }}>
                    <Ionicons name="person" size={20} color="#007AFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: '#666' }}>Organisateur</Text>
                    <Text style={{ fontWeight: '600', color: '#111' }}>{eventData.organizer?.name || 'Anonyme'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Participants */}
            {eventData.participants && eventData.participants.length > 0 && (
              <View style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', padding: 24, marginBottom: 24 }}>
                <Text style={{ fontSize: 20, fontWeight: '700', marginBottom: 16, color: '#111' }}>
                  Participants ({eventData.participants.length})
                </Text>
                <View style={{ gap: 12 }}>
                  {eventData.participants.map((participant: any, index: number) => (
                    <View key={index} style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {participant.user?.avatar_url ? (
                        <Image source={{ uri: participant.user.avatar_url }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
                      ) : (
                        <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: 'rgba(0,122,255,0.2)' }}>
                          <Ionicons name="person" size={20} color="#007AFF" />
                        </View>
                      )}
                      <Text style={{ fontWeight: '500', color: '#111' }}>{participant.user?.name || 'Anonyme'}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={{ marginBottom: 24 }}>
              {!isOrganizer && (
                <TouchableOpacity
                  onPress={handleJoinEvent}
                  disabled={isFull || isJoining}
                  style={{ 
                    paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginBottom: 12,
                    backgroundColor: isFull ? 'rgba(0,0,0,0.06)' : '#007AFF',
                    opacity: isFull || isJoining ? 0.5 : 1
                  }}
                >
                  <Text style={{ color: isFull ? '#666' : '#fff', fontWeight: '700', fontSize: 16 }}>
                    {isFull ? 'Événement complet' : 'Rejoindre l\'événement'}
                  </Text>
                </TouchableOpacity>
              )}

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => router.push(`/chat/${eventData.id}`)}
                  style={{ flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.06)' }}
                >
                  <Text style={{ color: '#111', fontWeight: '700' }}>Voir le chat</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => Alert.alert('Partage', 'Fonctionnalité de partage à venir')}
                  style={{ flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.06)' }}
                >
                  <Text style={{ color: '#111', fontWeight: '700' }}>Partager</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
    </SafeAreaView>
  );
}