import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, ImageBackground, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/context/AuthContext';
import { EventService } from '../lib/services/events';
import { NotificationService } from '../lib/services/notifications';

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

  // Test de notification locale
  const testNotification = async () => {
    try {
      await NotificationService.sendLocalNotification(
        'Test TeamUp 🎯',
        'Ceci est un test de notification locale !'
      );
      Alert.alert('✅ Succès', 'Notification locale envoyée !');
    } catch (error) {
      Alert.alert('❌ Erreur', 'Impossible d\'envoyer la notification');
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
    const categories: any[] = [];
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

  // Carte d'événement simplifiée (sans Glass)
  const EventCard = ({ event, isCompact = false }: { event: any; isCompact?: boolean }) => (
    <TouchableOpacity
      style={{ width: isCompact ? 160 : 200, marginRight: 16 }}
      onPress={() => router.push(`/events/${event.id}`)}
    >
      <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }}>
        {/* Image */}
        <View style={{ height: isCompact ? 100 : 120, position: 'relative' }}>
          {event.image_url ? (
            <Image source={{ uri: event.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View style={{ width: '100%', height: '100%', backgroundColor: getSportColor(event.sport_type) }} />
          )}
          <View style={{ position: 'absolute', inset: 0 as any, backgroundColor: 'rgba(0,0,0,0.35)' }} />
          <View style={{ position: 'absolute', inset: 0 as any, padding: 12, justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginBottom: 4 }} numberOfLines={2}>{event.title}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.9)' }}>{event.sport_type}</Text>
              </View>
              {event.price === 0 && (
                <View style={{ borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8, backgroundColor: 'rgba(34,197,94,0.9)' }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>GRATUIT</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        {/* Infos */}
        <View style={{ padding: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Ionicons name="calendar" size={14} color="#007AFF" />
            <Text style={{ color: '#111', fontSize: 12, marginLeft: 8 }} numberOfLines={1}>
              {formatEventDate(event.date, event.time)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Ionicons name="location" size={14} color="#007AFF" />
            <Text style={{ color: '#666', fontSize: 12, marginLeft: 8, flex: 1 }} numberOfLines={1}>
              {event.location}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="people" size={14} color="#007AFF" />
            <Text style={{ color: '#666', fontSize: 12, marginLeft: 8 }}>
              {event.current_participants || 0}/{event.max_participants}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Rediriger vers login si pas connecté (écran simplifié)
  if (!user) {
    return (
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200' }}
        style={{ flex: 1 }}
        blurRadius={30}
      >
        <LinearGradient colors={['rgba(255,255,255,0.3)', 'rgba(242,242,247,0.7)']} style={{ flex: 1 }}>
          <SafeAreaView style={{ flex: 1 }}>
            <StatusBar barStyle="dark-content" />
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
              <View style={{ padding: 32, borderRadius: 24, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                <View style={{ width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 24, backgroundColor: 'rgba(0,122,255,0.2)' }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 48, color: '#007AFF' }}>T</Text>
                </View>
                <Text style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 16, color: '#000' }}>TeamUp!</Text>
                <Text style={{ textAlign: 'center', marginBottom: 32, color: '#8E8E93' }}>Rejoignez la communauté sportive et trouvez vos partenaires de jeu</Text>
                <View style={{ width: '100%', gap: 16 }}>
                  <Link href="/auth/login" asChild>
                    <TouchableOpacity style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: '#007AFF' }}>
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Se connecter</Text>
                    </TouchableOpacity>
                  </Link>
                  <Link href="/auth/signup" asChild>
                    <TouchableOpacity style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' }}>
                      <Text style={{ fontWeight: '500', fontSize: 18, color: '#000' }}>Créer un compte</Text>
                    </TouchableOpacity>
                  </Link>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <StatusBar barStyle="dark-content" />

      {/* Header simplifié */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#111' }}>TeamUp</Text>
        <TouchableOpacity onPress={handleSignOut} style={{ padding: 8, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.05)' }}>
          <Ionicons name="log-out-outline" size={22} color="#111" />
        </TouchableOpacity>
      </View>

      {/* Barre de recherche */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10 }}>
          <Ionicons name="search" size={18} color="#666" />
          <TextInput
            placeholder="Rechercher des événements..."
            placeholderTextColor="#888"
            value={searchText}
            onChangeText={setSearchText}
            style={{ marginLeft: 8, flex: 1, color: '#111' }}
          />
        </View>
      </View>

      {/* Filtres */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setSelectedFilter(filter)}
              style={{
                marginRight: 12,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: selectedFilter === filter ? '#007AFF' : 'rgba(0,0,0,0.06)'
              }}
            >
              <Text style={{ color: selectedFilter === filter ? '#fff' : '#111', fontWeight: '600' }}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Liste d'événements */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 80 }}>
            <Text style={{ color: '#666', fontSize: 16 }}>Chargement des événements...</Text>
          </View>
        ) : eventCategories.length === 0 ? (
          <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 80 }}>
            <Ionicons name="calendar-outline" size={64} color="#999" />
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111', marginTop: 12, marginBottom: 8 }}>
              Aucun événement trouvé
            </Text>
            <Text style={{ textAlign: 'center', color: '#666', marginBottom: 16 }}>
              Créez votre premier événement pour commencer
            </Text>
            <TouchableOpacity onPress={() => router.push('/create-event')} style={{ paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#007AFF' }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Créer un événement</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ paddingBottom: 16 }}>
            {eventCategories.map((category, index) => (
              <View key={index} style={{ marginBottom: 24 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 10 }}>
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#111' }}>{category.title}</Text>
                  <TouchableOpacity>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#007AFF' }}>See All</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 0 }}>
                  {category.events.map((event: any) => (
                    <EventCard key={event.id} event={event} isCompact={category.title === "Events Happening Now"} />
                  ))}
                </ScrollView>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom nav déplacée dans le layout global */}
    </SafeAreaView>
  );
}
