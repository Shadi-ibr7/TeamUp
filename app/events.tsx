import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from '../lib/context/AuthContext';
import { EventService } from '../lib/services/events';

// Fonctions utilitaires
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
    'Football': '#4CAF50',
    'Basketball': '#FF9800',
    'Tennis': '#2196F3',
    'Running': '#d97706',
    'Cycling': '#16a34a',
    'Swimming': '#0284c7'
  };
  return colors[sport] || '#6b7280';
};

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

export default function Events() {
  const [activeTab, setActiveTab] = useState("events"); // "events" ou "calendar"
  const [selectedDate, setSelectedDate] = useState(5);
  const [currentMonth, setCurrentMonth] = useState("October");
  const [currentYear, setCurrentYear] = useState("2024");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventsData = await EventService.getEvents();
      setEvents(eventsData || []);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
      // Garder les événements mock en cas d'erreur
      setEvents(mockUpcomingEvents);
    } finally {
      setLoading(false);
    }
  };

  // Données du calendrier pour octobre 2024
  const calendarDays = [
    null, null, 1, 2, 3, 4, 5,  // Première semaine (octobre commence un mardi)
    6, 7, 8, 9, 10, 11, 12,     // Deuxième semaine
    13, 14, 15, 16, 17, 18, 19, // Troisième semaine
    20, 21, 22, 23, 24, 25, 26, // Quatrième semaine
    27, 28, 29, 30, 31, null, null, // Cinquième semaine
    null, null, null, null, null, null, null // Sixième semaine (vide)
  ];

  const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];

  // Events mock de secours
  const mockUpcomingEvents = [
    {
      id: 1,
      title: "Football Championship",
      date: "Today, 6:00 PM",
      location: "Central Stadium",
      current_participants: 22,
      max_participants: 24,
      sport_type: "Football"
    },
    {
      id: 2,
      title: "Basketball Tournament",
      date: "Tomorrow, 2:00 PM",
      location: "Sports Center",
      current_participants: 16,
      max_participants: 20,
      sport_type: "Basketball"
    },
    {
      id: 3,
      title: "Tennis Singles",
      date: "Dec 25, 10:00 AM",
      location: "Tennis Club",
      current_participants: 8,
      max_participants: 12,
      sport_type: "Tennis"
    }
  ];

  // Convertir les événements Supabase en format pour l'affichage
  const upcomingEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    date: formatEventDate(event.date, event.time),
    location: event.location,
    participants: `${event.current_participants}/${event.max_participants} players`,
    color: getSportColor(event.sport_type),
    icon: getSportIcon(event.sport_type)
  }));

  // Événements par date pour le calendrier (garder mock pour l'instant)
  const eventsByDate: { [key: number]: any[] } = {
    5: [
      {
        id: 1,
        title: "Community Basketball Game",
        type: "Basketball",
        time: "2:00 PM",
        location: "Sports Center",
        participants: "12/16 players",
        icon: "🏀",
        color: "#f59e0b"
      },
      {
        id: 2,
        title: "Soccer Tournament",
        type: "Soccer",
        time: "4:00 PM", 
        location: "Central Park",
        participants: "18/22 players",
        icon: "⚽",
        color: "#22c55e"
      },
      {
        id: 3,
        title: "Tennis Doubles Match",
        type: "Tennis",
        time: "6:00 PM",
        location: "Tennis Club",
        participants: "4/8 players", 
        icon: "🎾",
        color: "#0891b2"
      }
    ],
    12: [
      {
        id: 4,
        title: "Running Marathon",
        type: "Running",
        time: "7:00 AM",
        location: "City Park",
        participants: "50+ runners",
        icon: "🏃‍♂️",
        color: "#d97706"
      }
    ],
    18: [
      {
        id: 5,
        title: "Volleyball Tournament",
        type: "Volleyball",
        time: "3:00 PM",
        location: "Beach Court",
        participants: "8/12 teams",
        icon: "🏐",
        color: "#7c3aed"
      }
    ],
    25: [
      {
        id: 6,
        title: "Cycling Group Ride",
        type: "Cycling",
        time: "9:00 AM",
        location: "Mountain Trail",
        participants: "15/20 cyclists",
        icon: "🚴‍♂️",
        color: "#16a34a"
      }
    ]
  };

  const selectedEvents = eventsByDate[selectedDate] || [];

  const navigateMonth = (direction: 'next' | 'prev') => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const currentMonthIndex = months.indexOf(currentMonth);
    let newMonthIndex;
    let newYear = parseInt(currentYear);
    
    if (direction === 'next') {
      newMonthIndex = currentMonthIndex + 1;
      if (newMonthIndex > 11) {
        newMonthIndex = 0;
        newYear += 1;
      }
    } else {
      newMonthIndex = currentMonthIndex - 1;
      if (newMonthIndex < 0) {
        newMonthIndex = 11;
        newYear -= 1;
      }
    }
    
    setCurrentMonth(months[newMonthIndex]);
    setCurrentYear(newYear.toString());
    setSelectedDate(1);
  };

  const EventCard = ({ event, showTime = false }: { event: any; showTime?: boolean }) => (
    <Link href={`/events/${event.id}`} asChild>
      <TouchableOpacity className="bg-slate-800 rounded-2xl p-4 mb-4">
        <View className="flex-row items-center">
          <View 
            className="w-4 h-4 rounded-full mr-3"
            style={{ backgroundColor: event.color }}
          />
          <View className="flex-1">
            <Text className="text-white font-bold text-lg">{event.title}</Text>
            <Text className="text-slate-400 text-sm mt-1">
              {showTime ? event.time : event.date}
            </Text>
            <Text className="text-slate-400 text-sm">{event.location}</Text>
            <Text className="text-blue-400 text-sm mt-1">{event.participants}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </View>
      </TouchableOpacity>
    </Link>
  );

  const CalendarEventCard = ({ event }: { event: any }) => (
    <Link href={`/events/${event.id}`} asChild>
      <TouchableOpacity className="bg-slate-800 rounded-2xl p-4 mb-3 border border-slate-700">
        <View className="flex-row items-center">
          <View 
            className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
            style={{ backgroundColor: event.color }}
          >
            <Text style={{ fontSize: 24 }}>{event.icon}</Text>
          </View>
          
          <View className="flex-1">
            <Text className="text-white font-bold text-lg">{event.title}</Text>
            <Text className="text-slate-400 text-sm">{event.type}</Text>
            <View className="flex-row items-center mt-1">
              <Ionicons name="time" size={14} color="#64748b" />
              <Text className="text-slate-400 text-sm ml-1">{event.time}</Text>
              <Ionicons name="location" size={14} color="#64748b" style={{ marginLeft: 12 }} />
              <Text className="text-slate-400 text-sm ml-1">{event.location}</Text>
            </View>
            <Text className="text-blue-400 text-sm mt-1">{event.participants}</Text>
          </View>
          
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </View>
      </TouchableOpacity>
    </Link>
  );

  const filters = ['All', 'Upcoming', 'My Events', 'Past'];

  // Rediriger vers login si pas connecté
  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center">
        <View className="items-center px-8">
          <View className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full items-center justify-center mb-6">
            <Text className="text-white font-bold text-4xl">T</Text>
          </View>
          <Text className="text-white text-3xl font-bold mb-4">Connectez-vous</Text>
          <Text className="text-slate-400 text-center mb-8">
            Vous devez être connecté pour voir vos événements
          </Text>
          
          <Link href="/auth/login" asChild>
            <TouchableOpacity className="bg-blue-500 rounded-2xl py-4 px-8 mb-4 w-full">
              <Text className="text-white font-bold text-lg text-center">Se connecter</Text>
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
        <Text className="text-[#FFFFFF] text-2xl font-bold">Événements</Text>
        <TouchableOpacity onPress={() => router.push('/create-event')}>
          <Ionicons name="add-circle-outline" size={28} color="#C4D9EB" />
        </TouchableOpacity>
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
                className="bg-[#2B3840] rounded-2xl mb-4 border border-[#2B3840] overflow-hidden"
                onPress={() => router.push(`/events/${event.id}`)}
              >
                {/* Image de l'événement */}
                {event.image_url ? (
                  <Image 
                    source={{ uri: event.image_url }} 
                    className="w-full h-32"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-32 bg-[#1A2529] items-center justify-center">
                    <Ionicons name="image-outline" size={48} color="#9EB0BD" />
                    <Text className="text-[#9EB0BD] text-sm mt-2">Aucune image</Text>
                  </View>
                )}
                
                <View className="p-4">
                  <View className="flex-row items-center mb-2">
                    <View className="w-12 h-12 bg-[#C4D9EB] rounded-full items-center justify-center mr-3">
                      <Text className="text-[#141A1F] font-bold text-lg">
                        {event.sport_type?.charAt(0) || 'E'}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-[#FFFFFF] font-bold text-lg">{event.title}</Text>
                      <Text className="text-[#9EB0BD] text-sm">{event.sport_type}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-[#C4D9EB] font-medium">{formatEventDate(event.date)}</Text>
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
                        {event.current_participants || 0}/{event.max_participants || 'Illimité'}
                      </Text>
                    </View>
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
          <Link href="/" asChild>
            <TouchableOpacity className="items-center">
              <Ionicons name="home-outline" size={24} color="#9EB0BD" />
              <Text className="text-[#9EB0BD] text-xs mt-1">Home</Text>
            </TouchableOpacity>
          </Link>
          <TouchableOpacity className="items-center">
            <Ionicons name="calendar" size={24} color="#C4D9EB" />
            <Text className="text-[#C4D9EB] text-xs mt-1 font-medium">Events</Text>
          </TouchableOpacity>
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