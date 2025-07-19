import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";
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
      <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center">
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        
        <View className="items-center px-8">
          <View className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full items-center justify-center mb-6">
            <Text className="text-white font-bold text-4xl">T</Text>
          </View>
          <Text className="text-white text-3xl font-bold mb-4">Connectez-vous</Text>
          <Text className="text-slate-400 text-center mb-8">
            Vous devez être connecté pour voir les détails de l'événement
          </Text>
          
          <TouchableOpacity 
            className="bg-blue-500 rounded-2xl py-4 px-8 mb-4 w-full"
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
      <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center">
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <Text className="text-slate-400 text-lg">Chargement...</Text>
      </SafeAreaView>
    );
  }

  if (!eventData) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center">
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <Text className="text-slate-400 text-lg">Événement non trouvé</Text>
        <TouchableOpacity 
          className="bg-blue-500 rounded-2xl py-3 px-6 mt-4"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold">Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Header */}
      <View className="flex-row items-center px-4 py-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold flex-1">Event Details</Text>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity className="ml-4">
          <Ionicons name="heart-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        {/* Event Image/Banner */}
        {eventData.image_url ? (
          <View className="mx-4 mb-6">
            <Image 
              source={{ uri: eventData.image_url }} 
              className="w-full h-48 rounded-2xl"
              resizeMode="cover"
            />
          </View>
        ) : (
          <View 
            className="h-48 mx-4 rounded-2xl items-center justify-center mb-6"
            style={{ backgroundColor: getSportColor(eventData.sport_type || 'Football') }}
          >
            <Text className="text-white text-6xl opacity-20">
              {eventData.sport_type === 'Football' ? '⚽' : 
               eventData.sport_type === 'Basketball' ? '🏀' : 
               eventData.sport_type === 'Tennis' ? '🎾' : '🏟️'}
            </Text>
          </View>
        )}

        {/* Event Info */}
        <View className="px-4 mb-6">
          <Text className="text-white text-2xl font-bold mb-2">{eventData.title}</Text>
          <Text className="text-slate-400 text-base mb-4">{eventData.description}</Text>
          
          <View className="bg-slate-800 rounded-2xl p-4 space-y-3">
            <View className="flex-row items-center">
              <Ionicons name="calendar" size={20} color="#3b82f6" />
              <Text className="text-white ml-3 flex-1">{formatEventDate(eventData.date, eventData.time)}</Text>
            </View>
            
            <View className="flex-row items-center">
              <Ionicons name="location" size={20} color="#3b82f6" />
              <Text className="text-white ml-3 flex-1">{eventData.location}</Text>
            </View>
            
            <View className="flex-row items-center">
              <Ionicons name="people" size={20} color="#3b82f6" />
              <Text className="text-white ml-3 flex-1">
                {eventData.current_participants}/{eventData.max_participants} participants
              </Text>
            </View>
            
            <View className="flex-row items-center">
              <Ionicons name="pricetag" size={20} color="#3b82f6" />
              <Text className="text-white ml-3 flex-1">
                {eventData.price === 0 ? 'Gratuit' : `${eventData.price}€`}
              </Text>
            </View>
            
            <View className="flex-row items-center">
              <Ionicons name="fitness" size={20} color="#3b82f6" />
              <Text className="text-white ml-3 flex-1">{eventData.sport_type}</Text>
            </View>
          </View>
        </View>

        {/* Organizer */}
        <View className="px-4 mb-6">
          <Text className="text-white text-lg font-semibold mb-3">Organizer</Text>
          <View className="bg-slate-800 rounded-2xl p-4 flex-row items-center">
            <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center mr-3">
              <Text className="text-white font-bold">
                {eventData.organizer?.name?.charAt(0) || 'O'}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold">{eventData.organizer?.name || 'Organisateur'}</Text>
              <Text className="text-slate-400 text-sm">Event Organizer</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="chatbubble-outline" size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Participants */}
        <View className="px-4 mb-6">
          <Text className="text-white text-lg font-semibold mb-3">Participants</Text>
          <View className="bg-slate-800 rounded-2xl p-4">
            {eventData.participants && eventData.participants.length > 0 ? (
              <>
                {eventData.participants.slice(0, 4).map((participant: any, index: number) => (
                  <View key={index} className="flex-row items-center mb-3 last:mb-0">
                    <View className="w-10 h-10 bg-slate-700 rounded-full items-center justify-center mr-3">
                      <Text className="text-white">
                        {participant.user?.name?.charAt(0) || '👤'}
                      </Text>
                    </View>
                    <Text className="text-white flex-1">{participant.user?.name || 'Participant'}</Text>
                  </View>
                ))}
                {eventData.participants.length > 4 && (
                  <TouchableOpacity className="mt-3 pt-3 border-t border-slate-700">
                    <Text className="text-blue-400 text-center">
                      Voir tous les participants ({eventData.participants.length})
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <Text className="text-slate-400 text-center py-4">Aucun participant pour le moment</Text>
            )}
          </View>
        </View>

        {/* Bottom spacing */}
        <View className="h-32" />
      </ScrollView>

      {/* Join Button */}
      <View className="px-4 pb-4">
        <TouchableOpacity 
          className={`bg-blue-500 rounded-2xl py-4 items-center ${isJoining ? 'opacity-50' : ''}`}
          style={{ backgroundColor: getSportColor(eventData.sport_type || 'Football') }}
          onPress={handleJoinEvent}
          disabled={isJoining || eventData.current_participants >= eventData.max_participants}
        >
          <Text className="text-white font-bold text-lg">
            {isJoining ? 'Joining...' : 
             eventData.current_participants >= eventData.max_participants ? 'Event Full' : 'Join Event'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}