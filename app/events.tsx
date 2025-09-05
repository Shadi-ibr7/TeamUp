import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from '../lib/context/AuthContext';
import { useTheme } from '../lib/context/ThemeContext';
import { EventService } from '../lib/services/events';

// Les couleurs sont maintenant gérées par le ThemeContext

// Fonctions utilitaires
const getSportIcon = (sport: string) => {
  const icons: { [key: string]: string } = {
    'Football': '⚽',
    'Basketball': '🏀',
    'Tennis': '\ud83c\udfbe',
    'Running': '🏃‍♂️',
    'Cycling': '🚴‍♂️',
    'Swimming': '🏊‍♂️'
  };
  return icons[sport] || '\ud83c\udfdf️';
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
  const [activeTab, setActiveTab] = useState("events");
  const [selectedDate, setSelectedDate] = useState(5);
  const [currentMonth, setCurrentMonth] = useState("October");
  const [currentYear, setCurrentYear] = useState("2024");
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  const { user } = useAuth();
  const { isDarkMode, colors } = useTheme();
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
      setEvents(mockUpcomingEvents);
    } finally {
      setLoading(false);
    }
  };

  const calendarDays = [
    null, null, 1, 2, 3, 4, 5,
    6, 7, 8, 9, 10, 11, 12,
    13, 14, 15, 16, 17, 18, 19,
    20, 21, 22, 23, 24, 25, 26,
    27, 28, 29, 30, 31, null, null,
    null, null, null, null, null, null, null
  ];

  const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];

  const mockUpcomingEvents = [
    {
      id: 1,
      title: "Tournoi de foot",
      date: "Today, 6:00 PM",
      location: "1 Bd du Général de Gaulle, 91210 Draveil",
      current_participants: 2,
      max_participants: 50,
      sport_type: "Football"
    },
    {
      id: 2,
      title: "Match de basket",
      date: "Tomorrow, 2:00 PM",
      location: "Rue de la Grosse Roche, 91200 Athis-Mons",
      current_participants: 1,
      max_participants: 10,
      sport_type: "Basketball"
    }
  ];

  const upcomingEvents = events.map(event => ({
    id: event.id,
    title: event.title,
    date: formatEventDate(event.date, event.time),
    location: event.location,
    participants: `${event.current_participants}/${event.max_participants} players`,
    color: getSportColor(event.sport_type),
    icon: getSportIcon(event.sport_type)
  }));

  const filters = ['All', 'Today', 'This Week', 'Football'];

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {/* StatusBar géré globalement */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 24, backgroundColor: colors.primary }}>
            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 36 }}>T</Text>
          </View>
          <Text style={{ color: isDarkMode ? colors.foreground : '#111', fontSize: 24, fontWeight: '700', marginBottom: 16 }}>Connectez-vous</Text>
          <Text style={{ color: isDarkMode ? colors.mutedForeground : '#666', textAlign: 'center', marginBottom: 32 }}>
            Vous devez être connecté pour voir vos événements
          </Text>
          <Link href="/auth/login" asChild>
            <TouchableOpacity style={{ backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32, marginBottom: 16, width: '100%' }}>
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 18, textAlign: 'center' }}>Se connecter</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* StatusBar géré globalement */}

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 }}>
        <Text style={{ color: isDarkMode ? colors.foreground : '#111', fontSize: 24, fontWeight: '700' }}>Événements</Text>
        <TouchableOpacity onPress={() => router.push('/create-event')} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDarkMode ? colors.card : 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDarkMode ? colors.border : 'rgba(0,0,0,0.08)' }}>
          <Ionicons name="add" size={20} color={isDarkMode ? colors.foreground : '#111'} />
        </TouchableOpacity>
      </View>

      {/* Barre de recherche */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <View style={{ backgroundColor: isDarkMode ? colors.card : 'rgba(255,255,255,0.6)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: isDarkMode ? colors.border : 'rgba(0,0,0,0.08)', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
          <Ionicons name="search" size={18} color={isDarkMode ? colors.mutedForeground : '#666'} />
          <TextInput
            style={{ marginLeft: 10, flex: 1, color: isDarkMode ? colors.foreground : '#111', fontSize: 16 }}
            placeholder="Rechercher des événements..."
            placeholderTextColor={isDarkMode ? colors.mutedForeground : '#666'}
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
      </View>

      {/* Filtres en chips */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setSelectedFilter(filter)}
              style={{ marginRight: 10, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: selectedFilter === filter ? colors.primary : (isDarkMode ? colors.card : 'rgba(255,255,255,0.6)'), borderWidth: 1, borderColor: selectedFilter === filter ? colors.primary : (isDarkMode ? colors.border : 'rgba(0,0,0,0.08)') }}
            >
              <Text style={{ fontWeight: '600', color: selectedFilter === filter ? '#ffffff' : (isDarkMode ? colors.foreground : '#111') }}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Liste des événements */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {loading ? (
          <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 80 }}>
            <Text style={{ color: isDarkMode ? colors.mutedForeground : '#666', fontSize: 16 }}>Chargement des événements...</Text>
          </View>
        ) : events.length === 0 ? (
          <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 80 }}>
            <Ionicons name="calendar-outline" size={48} color={isDarkMode ? colors.mutedForeground : '#666'} />
            <Text style={{ color: isDarkMode ? colors.foreground : '#111', fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 }}>Aucun événement trouvé</Text>
            <Text style={{ color: isDarkMode ? colors.mutedForeground : '#666', textAlign: 'center' }}>Créez votre premier événement pour commencer</Text>
            <TouchableOpacity style={{ backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, marginTop: 20 }} onPress={() => router.push('/create-event')}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Créer un événement</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ paddingBottom: 16 }}>
            {events.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={{ backgroundColor: isDarkMode ? colors.card : 'rgba(255,255,255,0.6)', borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: isDarkMode ? colors.border : 'rgba(0,0,0,0.08)', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}
                onPress={() => router.push(`/events/${event.id}`)}
              >
                {event.image_url ? (
                  <Image source={{ uri: event.image_url }} style={{ width: '100%', height: 120 }} resizeMode="cover" />
                ) : (
                  <View style={{ width: '100%', height: 120, backgroundColor: isDarkMode ? colors.input : '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: isDarkMode ? colors.border : 'rgba(0,0,0,0.08)' }}>
                    <Ionicons name="image-outline" size={40} color={isDarkMode ? colors.mutedForeground : '#666'} />
                    <Text style={{ color: isDarkMode ? colors.mutedForeground : '#666', fontSize: 13, marginTop: 6 }}>Aucune image</Text>
                  </View>
                )}
                
                <View style={{ padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <View style={{ width: 44, height: 44, backgroundColor: isDarkMode ? colors.input : '#EEF2FF', borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: isDarkMode ? colors.border : 'rgba(0,0,0,0.08)' }}>
                      <Text style={{ color: isDarkMode ? colors.foreground : '#111', fontWeight: '700', fontSize: 16 }}>
                        {event.sport_type?.charAt(0) || 'E'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: isDarkMode ? colors.foreground : '#111', fontWeight: '700', fontSize: 16 }}>{event.title}</Text>
                      <Text style={{ color: isDarkMode ? colors.mutedForeground : '#666', fontSize: 13 }}>{event.sport_type}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: isDarkMode ? colors.foreground : '#111', fontWeight: '600' }}>{formatEventDate(event.date)}</Text>
                      <Text style={{ color: isDarkMode ? colors.mutedForeground : '#666', fontSize: 13 }}>{event.time}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="location-outline" size={16} color={isDarkMode ? colors.mutedForeground : '#666'} />
                      <Text style={{ color: isDarkMode ? colors.mutedForeground : '#666', fontSize: 13, marginLeft: 4 }}>{event.location}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="people-outline" size={16} color={isDarkMode ? colors.mutedForeground : '#666'} />
                      <Text style={{ color: isDarkMode ? colors.mutedForeground : '#666', fontSize: 13, marginLeft: 4 }}>
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


    </SafeAreaView>
  );
} 