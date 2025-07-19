import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Dimensions, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  const [showList, setShowList] = useState(true); // Commence en mode liste
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [userLocation, setUserLocation] = useState<LocationType | null>(null);
  const [mapRef, setMapRef] = useState<any>(null);

  // Position initiale (Paris par exemple)
  const initialRegion = {
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const nearbyEvents = [
    {
      id: 1,
      title: "Football Match",
      location: "Central Park",
      distance: "0.5 km",
      time: "Today 6:00 PM",
      participants: "12/22 players",
      color: "#22c55e",
      icon: "⚽",
      coordinate: {
        latitude: 48.8606,
        longitude: 2.3522,
      }
    },
    {
      id: 2,
      title: "Basketball Tournament",
      location: "Sports Center",
      distance: "1.2 km",
      time: "Tomorrow 2:00 PM",
      participants: "8/16 players",
      color: "#f59e0b",
      icon: "🏀",
      coordinate: {
        latitude: 48.8546,
        longitude: 2.3502,
      }
    },
    {
      id: 3,
      title: "Tennis Match",
      location: "Tennis Club",
      distance: "2.1 km",
      time: "Dec 25, 10:00 AM",
      participants: "4/8 players",
      color: "#0891b2",
      icon: "🎾",
      coordinate: {
        latitude: 48.8586,
        longitude: 2.3542,
      }
    },
    {
      id: 4,
      title: "Running Group",
      location: "City Park",
      distance: "3.5 km",
      time: "Every Monday 7:00 AM",
      participants: "15+ runners",
      color: "#d97706",
      icon: "🏃‍♂️",
      coordinate: {
        latitude: 48.8526,
        longitude: 2.3482,
      }
    },
    {
      id: 5,
      title: "Cycling Tour",
      location: "River Trail",
      distance: "4.2 km",
      time: "Saturday 9:00 AM",
      participants: "20+ cyclists",
      color: "#16a34a",
      icon: "🚴‍♂️",
      coordinate: {
        latitude: 48.8596,
        longitude: 2.3562,
      }
    }
  ];

  // Demander la permission de géolocalisation
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Permission de géolocalisation refusée');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    })();
  }, []);

  // Fonction pour centrer sur la position utilisateur
  const centerOnUserLocation = () => {
    if (userLocation && mapRef) {
      mapRef.animateToRegion({
        ...userLocation,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      }, 1000);
    }
  };

  const EventBottomSheet = ({ event, onClose }: { event: EventType; onClose: () => void }) => (
    <View className="absolute bottom-0 left-0 right-0 bg-[#2B3840] rounded-t-3xl p-6 border-t border-[#141A1F]">
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center">
          <View 
            className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
            style={{ backgroundColor: event.color }}
          >
            <Text style={{ fontSize: 24 }}>{event.icon}</Text>
          </View>
          <View>
            <Text className="text-[#FFFFFF] font-bold text-lg">{event.title}</Text>
            <Text className="text-[#9EB0BD] text-sm">{event.location}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color="#9EB0BD" />
        </TouchableOpacity>
      </View>
      
      <View className="flex-row items-center mb-3">
        <Ionicons name="time" size={16} color="#9EB0BD" />
        <Text className="text-[#FFFFFF] ml-2">{event.time}</Text>
      </View>
      
      <View className="flex-row items-center mb-3">
        <Ionicons name="location" size={16} color="#9EB0BD" />
        <Text className="text-[#FFFFFF] ml-2">{event.distance} away</Text>
      </View>
      
      <View className="flex-row items-center mb-4">
        <Ionicons name="people" size={16} color="#9EB0BD" />
        <Text className="text-[#FFFFFF] ml-2">{event.participants}</Text>
      </View>
      
      <View className="flex-row space-x-3">
        <Link href={`/events/${event.id}`} asChild>
          <TouchableOpacity className="flex-1 bg-[#C4D9EB] py-3 rounded-2xl">
            <Text className="text-[#141A1F] text-center font-semibold">View Details</Text>
          </TouchableOpacity>
        </Link>
        <TouchableOpacity className="flex-1 bg-[#141A1F] py-3 rounded-2xl">
          <Text className="text-[#FFFFFF] text-center font-semibold">Get Directions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#141A1F]">
      <StatusBar barStyle="light-content" backgroundColor="#141A1F" />
      
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 bg-[#2B3840]">
        <TouchableOpacity className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-[#FFFFFF] text-xl font-semibold flex-1">Find a court</Text>
        <TouchableOpacity onPress={() => setShowList(!showList)}>
          <Ionicons name={showList ? "map" : "list"} size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="px-4 py-3 bg-[#2B3840]">
        <View className="bg-[#141A1F] rounded-2xl px-4 py-3 flex-row items-center">
          <Ionicons name="search" size={20} color="#9EB0BD" />
          <TextInput
            className="text-[#FFFFFF] ml-3 flex-1 text-base"
            placeholder="Search for events, courts..."
            placeholderTextColor="#9EB0BD"
            value={searchLocation}
            onChangeText={setSearchLocation}
          />
          {searchLocation.length > 0 && (
            <TouchableOpacity onPress={() => setSearchLocation("")}>
              <Ionicons name="close-circle" size={20} color="#9EB0BD" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showList ? (
        // Liste des événements
        <ScrollView className="flex-1 bg-[#141A1F]">
          <View className="p-4">
            {nearbyEvents.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`} asChild>
                <TouchableOpacity className="bg-[#2B3840] rounded-2xl p-4 mb-3">
                  <View className="flex-row items-center">
                    <View 
                      className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
                      style={{ backgroundColor: event.color }}
                    >
                      <Text style={{ fontSize: 24 }}>{event.icon}</Text>
                    </View>
                    
                    <View className="flex-1">
                      <Text className="text-[#FFFFFF] font-bold text-lg">{event.title}</Text>
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="location" size={14} color="#9EB0BD" />
                        <Text className="text-[#9EB0BD] text-sm ml-1">{event.location}</Text>
                        <Text className="text-[#C4D9EB] text-sm ml-2">• {event.distance}</Text>
                      </View>
                      <Text className="text-[#9EB0BD] text-sm mt-1">{event.time}</Text>
                      <Text className="text-[#FFFFFF] text-sm mt-1">{event.participants}</Text>
                    </View>
                    
                    <Ionicons name="chevron-forward" size={20} color="#9EB0BD" />
                  </View>
                </TouchableOpacity>
              </Link>
            ))}
          </View>
        </ScrollView>
      ) : (
        // Vue carte
        <View className="flex-1 relative">
          <ConditionalMap
            events={nearbyEvents}
            onMarkerPress={(event) => setSelectedEvent(event)}
            initialRegion={initialRegion}
            mapRef={mapRef}
            setMapRef={setMapRef}
            userLocation={userLocation}
            onMapPress={() => setSelectedEvent(null)}
              />

          {/* Contrôles de carte (seulement sur mobile) */}
          {Platform.OS !== 'web' && (
            <>
          <View className="absolute right-4 bottom-24 space-y-2">
            <TouchableOpacity 
                  className="w-12 h-12 bg-[#FFFFFF] rounded-full items-center justify-center shadow-lg"
              onPress={() => {
                if (mapRef) {
                  mapRef.animateToRegion({
                    ...initialRegion,
                    latitudeDelta: initialRegion.latitudeDelta * 0.5,
                    longitudeDelta: initialRegion.longitudeDelta * 0.5,
                  }, 500);
                }
              }}
            >
                  <Ionicons name="add" size={24} color="#141A1F" />
            </TouchableOpacity>
            <TouchableOpacity 
                  className="w-12 h-12 bg-[#FFFFFF] rounded-full items-center justify-center shadow-lg"
              onPress={() => {
                if (mapRef) {
                  mapRef.animateToRegion({
                    ...initialRegion,
                    latitudeDelta: initialRegion.latitudeDelta * 2,
                    longitudeDelta: initialRegion.longitudeDelta * 2,
                  }, 500);
                }
              }}
            >
                  <Ionicons name="remove" size={24} color="#141A1F" />
            </TouchableOpacity>
          </View>

          {/* Bouton Ma Position */}
          <TouchableOpacity 
                className="absolute right-4 bottom-40 w-12 h-12 bg-[#FFFFFF] rounded-full items-center justify-center shadow-lg"
            onPress={centerOnUserLocation}
          >
                <Ionicons name="locate" size={20} color="#C4D9EB" />
          </TouchableOpacity>
            </>
          )}

          {/* Bouton Menu */}
          <TouchableOpacity className="absolute left-4 bottom-24 w-12 h-12 bg-[#FFFFFF] rounded-full items-center justify-center shadow-lg">
            <Ionicons name="menu" size={20} color="#141A1F" />
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Sheet pour événement sélectionné */}
      {selectedEvent && (
        <EventBottomSheet 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}

      {/* Bottom Navigation */}
      <SafeAreaView edges={['bottom']} className="bg-[#141A1F]">
        <View className="bg-[#2B3840] flex-row justify-around items-center py-2 px-2 border-t border-[#2B3840]">
        <Link href="/" asChild>
          <TouchableOpacity className="items-center">
              <Ionicons name="home-outline" size={24} color="#9EB0BD" />
              <Text className="text-[#9EB0BD] text-xs mt-1">Home</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/events" asChild>
          <TouchableOpacity className="items-center">
              <Ionicons name="calendar-outline" size={24} color="#9EB0BD" />
              <Text className="text-[#9EB0BD] text-xs mt-1">Events</Text>
          </TouchableOpacity>
        </Link>
        <TouchableOpacity className="items-center">
            <Ionicons name="location" size={24} color="#C4D9EB" />
            <Text className="text-[#C4D9EB] text-xs mt-1 font-medium">Discover</Text>
        </TouchableOpacity>
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