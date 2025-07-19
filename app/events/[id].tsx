import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, Platform, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
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
      // Garder les données mock en cas d'erreur
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
      Alert.alert(
        'Succès', 
        'Vous avez rejoint l\'événement ! Un groupe de chat a été créé automatiquement.',
        [{ text: 'OK', onPress: () => router.push("/chat") }]
      );
      // Recharger les données pour mettre à jour le nombre de participants
      loadEventData();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de rejoindre l\'événement');
    } finally {
      setIsJoining(false);
    }
  };

  // Données mock de secours
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
    if (eventDate.toDateString() === today.toDateString()) {
      dateStr = 'Today';
    } else if (eventDate.toDateString() === tomorrow.toDateString()) {
      dateStr = 'Tomorrow';
    } else {
      dateStr = eventDate.toLocaleDateString('fr-FR');
    }

    if (time) {
      dateStr += `, ${time}`;
    }

    return dateStr;
  };

  const getSportColor = (sport: string) => {
    const colors: { [key: string]: string } = {
      'Football': '#4CAF50',
      'Basketball': '#FF9800',
      'Tennis': '#2196F3',
      'Running': '#d97706',
      'Cycling': '#16a34a',
      'Swimming': '#0284c7'
    };
    return colors[sport] || '#6b7280';
  };

  // Rediriger vers login si pas connecté
  if (!user) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#0f172a' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-24 h-24 rounded-full items-center justify-center mb-6" style={{ backgroundColor: '#3b82f6' }}>
            <Text className="text-white font-bold text-4xl">T</Text>
          </View>
          <Text className="text-white text-3xl font-bold mb-4">Connectez-vous</Text>
          <Text className="text-slate-400 text-center mb-8">
            Vous devez être connecté pour voir les détails de l'événement
          </Text>
          
          <TouchableOpacity 
            className="rounded-2xl py-4 px-8 mb-4 w-full"
            style={{ backgroundColor: '#3b82f6' }}
            onPress={() => router.push('/auth/login')}
          >
            <Text className="text-white font-bold text-lg text-center">Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: '#0f172a' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <Text className="text-slate-400 text-lg">Chargement...</Text>
      </SafeAreaView>
    );
  }

  if (!eventData) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: '#0f172a' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <Text className="text-slate-400 text-lg">Événement non trouvé</Text>
        <TouchableOpacity 
          className="rounded-2xl py-3 px-6 mt-4"
          style={{ backgroundColor: '#3b82f6' }}
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#0f172a' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Header */}
      <View className="flex-row items-center px-6 py-4" style={{ paddingTop: Platform.OS === 'android' ? 20 : 0 }}>
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
          <Ionicons name="arrow-back" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold flex-1">Détails de l'événement</Text>
        <TouchableOpacity className="p-2 rounded-full mr-2" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
          <Ionicons name="share-outline" size={22} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity className="p-2 rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
          <Ionicons name="heart-outline" size={22} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        {/* Event Image/Banner */}
        {eventData.image_url ? (
          <View className="mx-6 mb-6">
            <Image 
              source={{ uri: eventData.image_url }} 
              className="w-full h-56 rounded-3xl"
              resizeMode="cover"
            />
          </View>
        ) : (
          <View 
            className="h-56 mx-6 rounded-3xl items-center justify-center mb-6"
            style={{ backgroundColor: getSportColor(eventData.sport_type || 'Football') }}
          >
            <Text className="text-white text-7xl opacity-30">
              {eventData.sport_type === 'Football' ? '⚽' : 
               eventData.sport_type === 'Basketball' ? '🏀' : 
               eventData.sport_type === 'Tennis' ? '🎾' : '🏟️'}
            </Text>
          </View>
        )}

        {/* Event Info */}
        <View className="px-6 mb-6">
          <Text className="text-white text-3xl font-bold mb-3">{eventData.title}</Text>
          <Text className="text-slate-400 text-lg leading-6 mb-6">{eventData.description}</Text>
          
          <View className="rounded-3xl p-6" style={{ backgroundColor: '#1e293b' }}>
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full items-center justify-center mr-4" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
                <Ionicons name="calendar" size={20} color="#3b82f6" />
              </View>
              <Text className="text-white text-lg flex-1">{formatEventDate(eventData.date, eventData.time)}</Text>
            </View>
            
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full items-center justify-center mr-4" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
                <Ionicons name="location" size={20} color="#3b82f6" />
              </View>
              <Text className="text-white text-lg flex-1">{eventData.location}</Text>
            </View>
            
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full items-center justify-center mr-4" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
                <Ionicons name="people" size={20} color="#3b82f6" />
              </View>
              <Text className="text-white text-lg flex-1">
                {eventData.current_participants}/{eventData.max_participants} participants
              </Text>
            </View>
            
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full items-center justify-center mr-4" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
                <Ionicons name="pricetag" size={20} color="#3b82f6" />
              </View>
              <Text className="text-white text-lg flex-1">
                {eventData.price === 0 ? 'Gratuit' : `${eventData.price}€`}
              </Text>
            </View>
            
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full items-center justify-center mr-4" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
                <Ionicons name="fitness" size={20} color="#3b82f6" />
              </View>
              <Text className="text-white text-lg flex-1">{eventData.sport_type}</Text>
            </View>
          </View>
        </View>

        {/* Organizer */}
        <View className="px-6 mb-6">
          <Text className="text-white text-2xl font-bold mb-4">Organisateur</Text>
          <View className="rounded-3xl p-5 flex-row items-center" style={{ backgroundColor: '#1e293b' }}>
            <View className="w-14 h-14 rounded-full items-center justify-center mr-4" style={{ backgroundColor: '#3b82f6' }}>
              <Text className="text-white font-bold text-lg">
                {eventData.organizer?.name?.charAt(0) || 'O'}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-white font-bold text-lg">{eventData.organizer?.name || 'Organisateur'}</Text>
              <Text className="text-slate-400 text-base">Organisateur de l'événement</Text>
            </View>
            <TouchableOpacity className="p-3 rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}>
              <Ionicons name="chatbubble-outline" size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Participants */}
        <View className="px-6 mb-6">
          <Text className="text-white text-2xl font-bold mb-4">Participants</Text>
          <View className="rounded-3xl p-5" style={{ backgroundColor: '#1e293b' }}>
            {eventData.participants && eventData.participants.length > 0 ? (
              <>
                {eventData.participants.slice(0, 4).map((participant: any, index: number) => (
                  <View key={index} className={`flex-row items-center ${index < eventData.participants.slice(0, 4).length - 1 ? 'mb-4' : ''}`}>
                    <View className="w-12 h-12 rounded-full items-center justify-center mr-4" style={{ backgroundColor: '#374151' }}>
                      <Text className="text-white font-semibold">
                        {participant.user?.name?.charAt(0) || '👤'}
                      </Text>
                    </View>
                    <Text className="text-white text-lg flex-1">{participant.user?.name || 'Participant'}</Text>
                  </View>
                ))}
                {eventData.participants.length > 4 && (
                  <TouchableOpacity className="mt-4 pt-4" style={{ borderTopWidth: 1, borderTopColor: '#374151' }}>
                    <Text className="text-center text-lg" style={{ color: '#3b82f6' }}>
                      Voir tous les participants ({eventData.participants.length})
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <Text className="text-slate-400 text-center py-8 text-lg">Aucun participant pour le moment</Text>
            )}
          </View>
        </View>

        {/* Bottom spacing */}
        <View className="h-20" />
      </ScrollView>

      {/* Join Button */}
      <View className="px-6 pb-6" style={{ paddingBottom: Platform.OS === 'android' ? 20 : 6 }}>
        <TouchableOpacity 
          className={`rounded-3xl py-5 items-center ${isJoining ? 'opacity-50' : ''}`}
          style={{ 
            backgroundColor: eventData.current_participants >= eventData.max_participants ? '#6b7280' : getSportColor(eventData.sport_type || 'Football'),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8
          }}
          onPress={handleJoinEvent}
          disabled={isJoining || eventData.current_participants >= eventData.max_participants}
        >
          <Text className="text-white font-bold text-xl">
            {isJoining ? 'Inscription en cours...' : 
             eventData.current_participants >= eventData.max_participants ? 'Événement complet' : 'Rejoindre l\'événement'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}