import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
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
      title: "Football Match", 
      description: "Match amical",
      sport_type: "Football",
      date: new Date().toISOString(),
          time: "Live", 
          location: "Stadium A",
      max_participants: 22,
      current_participants: 18,
      price: 0,
      organizer_id: "mock",
      is_active: true
        },
        { 
          id: 2,
      title: "Basketball Game", 
      description: "Tournoi local",
      sport_type: "Basketball",
      date: new Date().toISOString(),
          time: "Live", 
          location: "Court B",
      max_participants: 16,
      current_participants: 12,
      price: 0,
      organizer_id: "mock",
      is_active: true
        }
  ];

  const filters = ["All", "Today", "This Week", "Football", "Basketball", "Tennis"];

  // Organiser les événements par catégorie
  const organizeEventsByCategory = (events: any[]): CategoryDisplay[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const categories: CategoryDisplay[] = [
    {
        title: "Events Happening Now",
        events: events.filter((event: any) => {
          const eventDate = new Date(event.date);
          const isToday = eventDate >= today && eventDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
          return isToday;
        }).map((event: any): EventDisplay => ({
          id: event.id,
          name: event.title,
          time: "Live",
          location: event.location,
          image: getSportIcon(event.sport_type),
          color: getSportColor(event.sport_type),
          isLive: true,
          participants: `${event.current_participants}/${event.max_participants} players`
        }))
      }
    ];

    // Grouper par sport
    const sportTypes = [...new Set(events.map((event: any) => event.sport_type))];
    
    sportTypes.forEach(sport => {
      const sportEvents = events.filter((event: any) => event.sport_type === sport);
      if (sportEvents.length > 0) {
        categories.push({
          title: sport,
          events: sportEvents.map((event: any): EventDisplay => ({
            id: event.id,
            name: event.title,
            time: event.description || "Event",
            participants: `${event.current_participants}/${event.max_participants} players`,
            location: event.location,
            image: getSportIcon(event.sport_type),
            color: getSportColor(event.sport_type),
            isLive: false
          }))
        });
      }
    });

    return categories;
  };

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

  const sportsCategories = organizeEventsByCategory(events);

  const filteredCategories = sportsCategories.map((category: CategoryDisplay) => ({
    ...category,
    events: category.events.filter((event: EventDisplay) => 
      event.name.toLowerCase().includes(searchText.toLowerCase()) ||
      event.location.toLowerCase().includes(searchText.toLowerCase()) ||
      event.time.toLowerCase().includes(searchText.toLowerCase())
    )
  })).filter((category: CategoryDisplay) => category.events.length > 0);

  const EventCard = ({ event, isLive = false }: { event: EventDisplay; isLive?: boolean }) => (
    <Link href={`/events/${event.id}`} asChild>
      <TouchableOpacity 
        className="mr-4 rounded-3xl overflow-hidden shadow-lg"
        style={{ 
          backgroundColor: event.color,
          width: isLive ? 160 : 200,
          height: isLive ? 110 : 140
        }}
      >
        <View className="flex-1 p-4 justify-between relative">
          {isLive && (
            <View className="absolute top-3 right-3 bg-red-500 px-2 py-1 rounded-full">
              <Text className="text-white text-xs font-bold">LIVE</Text>
            </View>
          )}
          
          <View className="flex-1 justify-between">
            <View>
              <Text className="text-white font-bold text-lg mb-1">{event.name}</Text>
              <Text className="text-white/90 text-sm">{event.time}</Text>
            </View>
            
            <View className="mt-2">
              <Text className="text-white/80 text-xs">{event.location}</Text>
              {event.participants && (
                <Text className="text-white/90 text-xs font-medium mt-1">{event.participants}</Text>
              )}
            </View>
          </View>
          
          <View className="absolute bottom-2 right-2 text-4xl opacity-20">
            <Text style={{ fontSize: 30 }}>{event.image}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );

  const CategorySection = ({ category }: { category: CategoryDisplay }) => (
    <View className="mb-8">
      <View className="flex-row justify-between items-center mb-4 px-4">
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
        {category.events.map((event: EventDisplay) => (
          <EventCard 
            key={event.id} 
            event={event} 
            isLive={category.title === "Events Happening Now"}
          />
        ))}
      </ScrollView>
    </View>
  );

  // Rediriger vers login si pas connecté
  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center">
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        
        <View className="items-center px-8">
          <View className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full items-center justify-center mb-6">
            <Text className="text-white font-bold text-4xl">T</Text>
          </View>
          <Text className="text-white text-3xl font-bold mb-4">TeamUp!</Text>
          <Text className="text-slate-400 text-center mb-8">
            Rejoignez la communauté sportive et trouvez vos partenaires de jeu
          </Text>
          
          <Link href="/auth/login" asChild>
            <TouchableOpacity className="bg-blue-500 rounded-2xl py-4 px-8 mb-4 w-full">
              <Text className="text-white font-bold text-lg text-center">Se connecter</Text>
            </TouchableOpacity>
          </Link>
          
          <Link href="/auth/signup" asChild>
            <TouchableOpacity className="bg-slate-800 rounded-2xl py-4 px-8 w-full border border-slate-700">
              <Text className="text-white font-medium text-lg text-center">Créer un compte</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#141A1F]">
      <StatusBar barStyle="light-content" backgroundColor="#141A1F" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-[#141A1F]">
        <Text className="text-[#FFFFFF] text-2xl font-bold">TeamUp</Text>
        <View className="flex-row space-x-4">
          <TouchableOpacity onPress={testSupabaseConnection}>
            <Ionicons name="cloud-outline" size={24} color={isConnected ? "#C4D9EB" : "#9EB0BD"} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => signOut()}>
            <Ionicons name="log-out-outline" size={24} color="#9EB0BD" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View className="px-4 py-2">
        <View className="bg-[#2B3840] rounded-2xl px-4 py-3 flex-row items-center border border-[#2B3840]">
          <Ionicons name="search" size={20} color="#9EB0BD" />
          <TextInput
            className="flex-1 ml-3 text-[#FFFFFF] text-base"
            placeholder="Rechercher des événements..."
            placeholderTextColor="#9EB0BD"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* Filter Buttons */}
      <View className="px-4 py-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setSelectedFilter(filter)}
              className={`mr-3 px-4 py-2 rounded-full ${
                selectedFilter === filter ? 'bg-[#C4D9EB]' : 'bg-[#2B3840]'
              }`}
            >
              <Text className={`font-medium ${
                selectedFilter === filter ? 'text-[#141A1F]' : 'text-[#9EB0BD]'
              }`}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Events List */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="flex-1 justify-center items-center py-20">
            <Text className="text-[#9EB0BD] text-lg">Chargement des événements...</Text>
          </View>
        ) : events.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="calendar-outline" size={64} color="#9EB0BD" />
            <Text className="text-[#9EB0BD] text-lg font-medium mt-4 mb-2">Aucun événement trouvé</Text>
            <Text className="text-[#9EB0BD] text-center">Créez votre premier événement pour commencer</Text>
            <TouchableOpacity 
              className="bg-[#C4D9EB] rounded-2xl px-6 py-3 mt-6"
              onPress={() => router.push('/create-event')}
            >
              <Text className="text-[#141A1F] font-semibold">Créer un événement</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="pb-4">
            {events.map((event) => (
              <TouchableOpacity
                key={event.id}
                className="bg-[#2B3840] rounded-2xl p-4 mb-4 border border-[#2B3840]"
                onPress={() => router.push(`/events/${event.id}`)}
              >
                <View className="flex-row items-center mb-2">
                  <View className="w-12 h-12 bg-[#C4D9EB] rounded-full items-center justify-center mr-3">
                    <Text className="text-[#141A1F] font-bold text-lg">
                      {event.sport?.charAt(0) || 'E'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[#FFFFFF] font-bold text-lg">{event.title}</Text>
                    <Text className="text-[#9EB0BD] text-sm">{event.sport}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[#C4D9EB] font-medium">{event.date}</Text>
                    <Text className="text-[#9EB0BD] text-sm">{event.time}</Text>
                  </View>
                </View>
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Ionicons name="location-outline" size={16} color="#9EB0BD" />
                    <Text className="text-[#9EB0BD] text-sm ml-1">{event.location}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="people-outline" size={16} color="#9EB0BD" />
                    <Text className="text-[#9EB0BD] text-sm ml-1">
                      {event.participants_count || 0}/{event.max_participants || 'Illimité'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <SafeAreaView edges={['bottom']} className="bg-[#141A1F]">
        <View className="bg-[#2B3840] flex-row justify-around items-center py-2 px-2 border-t border-[#2B3840]">
          <TouchableOpacity className="items-center">
            <Ionicons name="home" size={24} color="#C4D9EB" />
            <Text className="text-[#C4D9EB] text-xs mt-1 font-medium">Home</Text>
          </TouchableOpacity>
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
          <Link href="/profile" asChild>
        <TouchableOpacity className="items-center">
              <Ionicons name="person-outline" size={24} color="#9EB0BD" />
              <Text className="text-[#9EB0BD] text-xs mt-1">Profile</Text>
        </TouchableOpacity>
          </Link>
      </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}
