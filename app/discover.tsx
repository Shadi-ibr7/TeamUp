import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Link, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/context/AuthContext';
import { PublicEquipment } from '../lib/services/equipments';
import { EventService } from '../lib/services/events';
import ConditionalMap from './components/ConditionalMap';

interface EventType {
  id: number;
  title: string;
  location: string;
  distance: string;
  time: string;
  participants: string;
  color: string;
  icon: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
}

interface LocationType {
  latitude: number;
  longitude: number;
}

export default function Discover() {
  const { width, height } = Dimensions.get('window');
  const [searchLocation, setSearchLocation] = useState("");
  const [selectedRadius, setSelectedRadius] = useState("5km");
  const [showList, setShowList] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [userLocation, setUserLocation] = useState<LocationType | null>(null);
  const [mapRef, setMapRef] = useState<any>(null);
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPublicTerrains, setShowPublicTerrains] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const initialRegion = {
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const getSportColor = (sportType: string) => {
    const colors: { [key: string]: string } = {
      'Football': '#22c55e', 'Basketball': '#f59e0b', 'Tennis': '#0891b2', 'Running': '#d97706', 
      'Cycling': '#16a34a', 'Swimming': '#06b6d4', 'Volleyball': '#8b5cf6', 'Badminton': '#ec4899', 
      'Padel': '#10b981', 'default': '#6b7280'
    };
    return colors[sportType] || colors.default;
  };

  const getSportIcon = (sportType: string) => {
    const icons: { [key: string]: string } = {
      'Football': '⚽', 'Basketball': '🏀', 'Tennis': '🎾', 'Running': '🏃‍♂️', 'Cycling': '🚴‍♂️', 
      'Swimming': '🏊‍♂️', 'Volleyball': '🏐', 'Badminton': '🏸', 'Padel': '🎾', 'default': '🏃‍♂️'
    };
    return icons[sportType] || icons.default;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) return `${Math.round(distance * 1000)}m`;
    else return `${distance.toFixed(1)}km`;
  };

  const formatEventDate = (date: string, time: string) => {
    const eventDate = new Date(`${date}T${time}`);
    const now = new Date();
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return 'Terminé';
    else if (diffDays === 0) return 'Aujourd\'hui';
    else if (diffDays === 1) return 'Demain';
    else return `Dans ${diffDays} jours`;
  };

  const handleTerrainPress = (terrain: PublicEquipment) => {
    Alert.alert(
      terrain.name,
      `${terrain.type}\n${terrain.address || terrain.city}\n\nVoulez-vous créer un événement sur ce terrain ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Créer un événement', 
          onPress: () => {
            router.push({
              pathname: '/create-event',
              params: { 
                terrainId: terrain.id,
                terrainName: terrain.name,
                terrainAddress: terrain.address || terrain.city
              }
            });
          }
        }
      ]
    );
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await EventService.getEvents();
      const radiusKm = parseInt(selectedRadius.replace('km', ''));
      const transformedEvents: EventType[] = (data || [])
        .map((event: any) => {
          let rawDistanceKm: number | null = null;
          let distance = 'N/A';
          if (userLocation && event.latitude && event.longitude) {
            rawDistanceKm = calculateDistance(userLocation.latitude, userLocation.longitude, event.latitude, event.longitude);
            distance = formatDistance(rawDistanceKm);
          }
          return {
            id: event.id,
            title: event.title,
            location: event.location,
            distance,
            time: formatEventDate(event.date, event.time),
            participants: `${event.current_participants || 0}/${event.max_participants || 10}`,
            color: getSportColor(event.sport_type),
            icon: getSportIcon(event.sport_type),
            coordinate: {
              latitude: event.latitude || 48.8566,
              longitude: event.longitude || 2.3522
            },
            _rawDistanceKm: rawDistanceKm
          } as any;
        })
        .filter((e: any) => true)
        .map((e: any) => {
          delete e._rawDistanceKm;
          return e as EventType;
        });
      setEvents(transformedEvents);
    } catch (error) {
      console.error('Erreur lors du chargement des événements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const location = await Location.getCurrentPositionAsync({});
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      setUserLocation(newLocation);
    } catch (error) {
      console.error('Erreur lors de l\'obtention de la localisation:', error);
    }
  };

  useEffect(() => {
    getUserLocation();
    fetchEvents();
  }, []);

  const EventBottomSheet = ({ event, onClose }: { event: EventType; onClose: () => void }) => {
    const [isJoining, setIsJoining] = useState(false);
    const { user } = useAuth();
    const router = useRouter();

    const formatDisplayTime = (timeString: string) => {
      if (timeString === 'Terminé') return 'Terminé';
      if (timeString === 'Aujourd\'hui') return 'Aujourd\'hui';
      if (timeString === 'Demain') return 'Demain';
      return timeString;
    };

    const handleJoinEvent = async () => {
      if (!user) {
        Alert.alert('Connexion requise', 'Vous devez être connecté pour rejoindre un événement');
        return;
      }
      try {
        setIsJoining(true);
        await EventService.joinEvent(event.id.toString(), user.id);
        Alert.alert('Succès', 'Vous avez rejoint l\'événement !', [
          { text: 'Voir les détails', onPress: () => router.push(`/events/${event.id}`) },
          { text: 'OK', style: 'cancel' }
        ]);
        fetchEvents();
        onClose();
      } catch (error: any) {
        Alert.alert('Erreur', error.message || 'Impossible de rejoindre l\'événement');
      } finally {
        setIsJoining(false);
      }
    };

    const [currentParticipants, maxParticipants] = event.participants.split('/').map(Number);
    const isFull = currentParticipants >= maxParticipants;

    return (
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16 }}>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12, backgroundColor: event.color }}>
                <Text style={{ fontSize: 24 }}>{event.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#111' }}>{event.title}</Text>
                <Text style={{ fontSize: 14, color: '#666' }}>{event.location}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Ionicons name="time" size={20} color="#666" />
              <Text style={{ fontSize: 12, marginTop: 4, color: '#666' }}>{formatDisplayTime(event.time)}</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Ionicons name="people" size={20} color={isFull ? "#ef4444" : "#666"} />
              <Text style={{ fontSize: 12, marginTop: 4, color: isFull ? "#ef4444" : "#666" }}>{event.participants}</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Ionicons name="location" size={20} color="#666" />
              <Text style={{ fontSize: 12, marginTop: 4, color: '#666' }}>{event.distance}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={handleJoinEvent}
              disabled={isFull || isJoining}
              style={{ 
                flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
                backgroundColor: isFull ? 'rgba(0,0,0,0.06)' : '#007AFF',
                opacity: isFull || isJoining ? 0.5 : 1
              }}
            >
              <Text style={{ color: isFull ? '#666' : '#fff', fontWeight: '700' }}>
                {isJoining ? 'Inscription...' : isFull ? 'Complet' : 'S\'inscrire'}
              </Text>
            </TouchableOpacity>
            
            <Link href={`/events/${event.id}`} asChild>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.06)' }}>
                <Text style={{ color: '#111', fontWeight: '700' }}>Voir détails</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header simple */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.05)' }}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#111' }}>Découvrir</Text>
        <TouchableOpacity onPress={() => setShowList(!showList)} style={{ padding: 8, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.05)' }}>
          <Ionicons name={showList ? "map" : "list"} size={22} color="#111" />
        </TouchableOpacity>
      </View>

      {/* Search and Filters */}
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', padding: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
            <Ionicons name="search" size={18} color="#666" />
            <TextInput
              placeholder="Rechercher un lieu..."
              placeholderTextColor="#888"
              value={searchLocation}
              onChangeText={setSearchLocation}
              style={{ marginLeft: 8, flex: 1, color: '#111' }}
            />
          </View>
          
          <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
            {["1km", "5km", "10km", "25km"].map((radius) => (
              <TouchableOpacity
                key={radius}
                onPress={() => setSelectedRadius(radius)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: selectedRadius === radius ? '#007AFF' : 'rgba(0,0,0,0.06)'
                }}
              >
                <Text style={{ color: selectedRadius === radius ? '#fff' : '#111', fontWeight: '600' }}>{radius}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Map or List View */}
      {showList ? (
        <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 80 }}>
              <Text style={{ color: '#666', fontSize: 16 }}>Chargement des événements...</Text>
            </View>
          ) : events.length === 0 ? (
            <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 80 }}>
              <Ionicons name="location-outline" size={64} color="#999" />
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#111', marginTop: 12, marginBottom: 8 }}>
                Aucun événement à proximité
              </Text>
              <Text style={{ textAlign: 'center', color: '#666', marginBottom: 16 }}>
                Essayez d'augmenter le rayon de recherche
              </Text>
              <TouchableOpacity onPress={() => router.push('/create-event')} style={{ paddingVertical: 14, paddingHorizontal: 16, borderRadius: 14, backgroundColor: '#007AFF' }}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Créer un événement</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 16, paddingBottom: 16 }}>
              {events.map((event) => (
                <TouchableOpacity key={event.id} onPress={() => setSelectedEvent(event)}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', padding: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16, backgroundColor: event.color }}>
                        <Text style={{ fontSize: 24 }}>{event.icon}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 4, color: '#111' }}>{event.title}</Text>
                        <Text style={{ fontSize: 14, marginBottom: 4, color: '#666' }}>{event.location}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="time" size={14} color="#007AFF" />
                            <Text style={{ fontSize: 12, marginLeft: 4, color: '#666' }}>{event.time}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="people" size={14} color="#007AFF" />
                            <Text style={{ fontSize: 12, marginLeft: 4, color: '#666' }}>{event.participants}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="location" size={14} color="#007AFF" />
                            <Text style={{ fontSize: 12, marginLeft: 4, color: '#666' }}>{event.distance}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          <ConditionalMap
            events={events}
            onMarkerPress={setSelectedEvent}
            initialRegion={initialRegion}
            mapRef={mapRef}
            setMapRef={setMapRef}
            userLocation={userLocation}
            showPublicTerrains={showPublicTerrains}
            onTerrainPress={handleTerrainPress}
          />
        </View>
      )}

      {/* Event Bottom Sheet */}
      {selectedEvent && (
        <EventBottomSheet
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </SafeAreaView>
  );
} 