import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/context/AuthContext';
import { EventService } from '../lib/services/events';

interface EventDisplay {
  id: any;
  name: string;
  time: string;
  location: string;
  image: string;
  color: string;
  isLive?: boolean;
  participants: string;
}

interface CategoryDisplay {
  title: string;
  events: EventDisplay[];
}

export default function Index() {
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const { user, signOut } = useAuth();
  const router = useRouter();

  // Test de connexion Supabase
  const testSupabaseConnection = async () => {
    try {
      const eventsData = await EventService.getEvents();
      Alert.alert('Succès', `Connecté à Supabase ! ${eventsData.length} événements trouvés.`);
      setIsConnected(true);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de se connecter à Supabase. Vérifiez votre configuration.');
      console.error('Supabase error:', error);
    }
  };

  // Charger les événements depuis Supabase
  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventsData = await EventService.getEvents();
      setEvents(eventsData || []);
      setIsConnected(true);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
      // Garder des événements mock en cas d'erreur pour la démo
      setEvents(mockEvents);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Événements mock de secours
  const mockEvents = [
    { 
      id: 1,
      title: "Match amical de football", 
      description: "Match amical entre amis",
      sport_type: "Football",
      date: new Date().toISOString(),
      time: "14:30", 
      location: "3-5 Rue Albert Camus, 91220 Brétigny-sur-Orge",
      max_participants: 22,
      current_participants: 18,
      price: 0,
      organizer_id: "mock",
      is_active: true,
      image_url: null
    },
    { 
      id: 2,
      title: "Tournoi de Basketball", 
      description: "Tournoi local de basketball",
      sport_type: "Basketball",
      date: new Date().toISOString(),
      time: "16:00", 
      location: "Gymnase Municipal",
      max_participants: 16,
      current_participants: 12,
      price: 0,
      organizer_id: "mock",
      is_active: true,
      image_url: null
    }
  ];

  const filters = ["All", "Today", "This Week", "Football", "Basketball", "Tennis"];

  const getSportIcon = (sport: string) => {
    const icons: { [key: string]: string } = {
      'Football': '⚽',
      'Basketball': '🏀',
      'Tennis': '🎾',
      'Running': '🏃‍♂️',
      'Cycling': '🚴‍♂️',
      'Swimming': '🏊‍♂️'
    };
    return icons[sport] || '🏟️';
  };

  const getSportColor = (sport: string) => {
    const colors: { [key: string]: string } = {
      'Football': '#22c55e',
      'Basketball': '#f59e0b',
      'Tennis': '#0891b2',
      'Running': '#d97706',
      'Cycling': '#16a34a',
      'Swimming': '#0284c7'
    };
    return colors[sport] || '#6b7280';
  };

  const formatEventDate = (date: string, time?: string) => {
    const eventDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    let dateStr = '';
    if (eventDate.toDateString() === today.toDateString()) {
      dateStr = 'Aujourd\'hui';
    } else if (eventDate.toDateString() === tomorrow.toDateString()) {
      dateStr = 'Demain';
    } else {
      dateStr = eventDate.toLocaleDateString('fr-FR', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      });
    }

    if (time) {
      dateStr += ` à ${time}`;
    }

    return dateStr;
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchText.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchText.toLowerCase()) ||
                         event.sport_type.toLowerCase().includes(searchText.toLowerCase());
    
    if (selectedFilter === "All") return matchesSearch;
    if (selectedFilter === "Today") {
      const eventDate = new Date(event.date);
      const today = new Date();
      return matchesSearch && eventDate.toDateString() === today.toDateString();
    }
    if (selectedFilter === "This Week") {
      const eventDate = new Date(event.date);
      const today = new Date();
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return matchesSearch && eventDate >= today && eventDate <= weekFromNow;
    }
    return matchesSearch && event.sport_type === selectedFilter;
  });

  // Organiser les événements par catégories
  const organizeEventsByCategory = () => {
    const categories = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Événements d'aujourd'hui (Events Happening Now)
    const todayEvents = filteredEvents.filter((event) => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === today.toDateString();
    });

    if (todayEvents.length > 0) {
      categories.push({
        title: "Events Happening Now",
        events: todayEvents
      });
    }

    // Grouper par sport
    const sportTypes = [...new Set(filteredEvents.map((event) => event.sport_type))];
    
    sportTypes.forEach(sport => {
      const sportEvents = filteredEvents.filter((event) => event.sport_type === sport);
      if (sportEvents.length > 0) {
        categories.push({
          title: sport,
          events: sportEvents
        });
      }
    });

    return categories;
  };

  const eventCategories = organizeEventsByCategory();

  // Composant pour une carte d'événement
  const EventCard = ({ event, isCompact = false }: { event: any; isCompact?: boolean }) => (
    <TouchableOpacity
      className="rounded-3xl mr-4 overflow-hidden"
      style={{ 
        width: isCompact ? 160 : 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        backgroundColor: '#1e293b'
      }}
      onPress={() => router.push(`/events/${event.id}`)}
    >
      {/* Section image */}
      <View className="relative" style={{ height: isCompact ? 100 : 120 }}>
        {/* Image de fond ou couleur du sport */}
        {event.image_url ? (
          <Image
            source={{ uri: event.image_url }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View 
            className="w-full h-full"
            style={{ backgroundColor: getSportColor(event.sport_type) }}
          >
            {/* Pattern de fond subtil */}
            <View className="absolute inset-0 opacity-10">
              <Text className="text-white text-6xl absolute bottom-2 right-2 opacity-30">
                {getSportIcon(event.sport_type)}
              </Text>
            </View>
          </View>
        )}

        {/* Overlay sombre pour la lisibilité */}
        <View 
          className="absolute inset-0"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
          }}
        />

        {/* Titre et badge sur l'image */}
        <View className="absolute inset-0 p-3 justify-between">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text className="text-white font-bold text-lg mb-1" numberOfLines={2}>{event.title}</Text>
              <Text className="text-white/90 text-sm">{event.sport_type}</Text>
            </View>
            {event.price === 0 && (
              <View className="rounded-full px-2 py-1 ml-2" style={{ backgroundColor: 'rgba(34, 197, 94, 0.9)' }}>
                <Text className="text-white text-xs font-bold">GRATUIT</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Section informations en bas */}
      <View className="p-3" style={{ backgroundColor: '#1e293b' }}>
        {/* Date et heure */}
        <View className="flex-row items-center mb-2">
          <Ionicons name="calendar" size={14} color="#3b82f6" />
          <Text className="text-white text-xs ml-2 font-medium" numberOfLines={1}>
            {formatEventDate(event.date, event.time)}
          </Text>
        </View>

        {/* Localisation */}
        <View className="flex-row items-center mb-2">
          <Ionicons name="location" size={14} color="#3b82f6" />
          <Text className="text-slate-300 text-xs ml-2 flex-1" numberOfLines={1}>
            {event.location}
          </Text>
        </View>

        {/* Participants */}
        <View className="flex-row items-center">
          <Ionicons name="people" size={14} color="#3b82f6" />
          <Text className="text-slate-300 text-xs ml-2">
            {event.current_participants || 0}/{event.max_participants}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Composant pour une section de catégorie
  const CategorySection = ({ category }: { category: any }) => (
    <View className="mb-8">
      <View className="flex-row justify-between items-center mb-4 px-6">
        <Text className="text-white text-xl font-bold">{category.title}</Text>
        <TouchableOpacity>
          <Text className="text-blue-400 text-sm font-medium">See All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {category.events.map((event: any) => (
          <EventCard 
            key={event.id} 
            event={event} 
            isCompact={category.title === "Events Happening Now"}
          />
        ))}
      </ScrollView>
    </View>
  );

  // Rediriger vers login si pas connecté
  if (!user) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: '#0f172a' }}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-24 h-24 rounded-full items-center justify-center mb-6" style={{ backgroundColor: '#3b82f6' }}>
            <Text className="text-white font-bold text-4xl">T</Text>
          </View>
          <Text className="text-white text-3xl font-bold mb-4">TeamUp!</Text>
          <Text className="text-slate-400 text-center mb-8">
            Rejoignez la communauté sportive et trouvez vos partenaires de jeu
          </Text>
          
          <Link href="/auth/login" asChild>
            <TouchableOpacity className="rounded-2xl py-4 px-8 mb-4 w-full" style={{ backgroundColor: '#3b82f6' }}>
              <Text className="text-white font-bold text-lg text-center">Se connecter</Text>
            </TouchableOpacity>
          </Link>
          
          <Link href="/auth/signup" asChild>
            <TouchableOpacity className="rounded-2xl py-4 px-8 w-full border" style={{ backgroundColor: '#1e293b', borderColor: '#374151' }}>
              <Text className="text-white font-medium text-lg text-center">Créer un compte</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#0f172a' }}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <Text className="text-white text-3xl font-bold">TeamUp</Text>
        <View className="flex-row space-x-4">
          <TouchableOpacity onPress={testSupabaseConnection} className="p-2 rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
            <Ionicons name="cloud-outline" size={24} color={isConnected ? "#3b82f6" : "#64748b"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSignOut} className="p-2 rounded-full" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
            <Ionicons name="log-out-outline" size={24} color="#3b82f6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View className="px-6 py-2">
        <View className="rounded-3xl px-6 py-4 flex-row items-center" style={{ backgroundColor: '#1e293b' }}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            className="flex-1 ml-3 text-white text-lg"
            placeholder="Rechercher des événements..."
            placeholderTextColor="#64748b"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* Filter Buttons */}
      <View className="px-6 py-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setSelectedFilter(filter)}
              className={`mr-3 px-6 py-3 rounded-full ${
                selectedFilter === filter ? '' : ''
              }`}
              style={{
                backgroundColor: selectedFilter === filter ? '#3b82f6' : '#1e293b'
              }}
            >
              <Text className={`font-semibold ${
                selectedFilter === filter ? 'text-white' : 'text-slate-400'
              }`}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Events List */}
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="flex-1 justify-center items-center py-20">
            <Text className="text-slate-400 text-lg">Chargement des événements...</Text>
          </View>
        ) : eventCategories.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="calendar-outline" size={64} color="#64748b" />
            <Text className="text-slate-400 text-lg font-medium mt-4 mb-2">Aucun événement trouvé</Text>
            <Text className="text-slate-400 text-center">Créez votre premier événement pour commencer</Text>
            <TouchableOpacity 
              className="rounded-3xl px-6 py-3 mt-6"
              style={{ backgroundColor: '#3b82f6' }}
              onPress={() => router.push('/create-event')}
            >
              <Text className="text-white font-semibold">Créer un événement</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="pb-4">
            {eventCategories.map((category, index) => (
              <CategorySection key={index} category={category} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <SafeAreaView edges={['bottom']}>
        <View className="flex-row justify-around items-center py-3 px-2" style={{ backgroundColor: '#1e293b' }}>
          <TouchableOpacity className="items-center">
            <Ionicons name="home" size={24} color="#3b82f6" />
            <Text className="text-blue-400 text-xs mt-1 font-medium">Home</Text>
          </TouchableOpacity>
          <Link href="/events" asChild>
            <TouchableOpacity className="items-center">
              <Ionicons name="calendar-outline" size={24} color="#64748b" />
              <Text className="text-slate-400 text-xs mt-1">Events</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/discover" asChild>
            <TouchableOpacity className="items-center">
              <Ionicons name="location-outline" size={24} color="#64748b" />
              <Text className="text-slate-400 text-xs mt-1">Discover</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/chat" asChild>
            <TouchableOpacity className="items-center">
              <Ionicons name="chatbubble-outline" size={24} color="#64748b" />
              <Text className="text-slate-400 text-xs mt-1">Chat</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/profile" asChild>
            <TouchableOpacity className="items-center">
              <Ionicons name="person-outline" size={24} color="#64748b" />
              <Text className="text-slate-400 text-xs mt-1">Profile</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}
