import { Ionicons } from "@expo/vector-icons";
import React from 'react';
import { Platform, Text, View } from 'react-native';

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

interface ConditionalMapProps {
  events: EventType[];
  onMarkerPress: (event: EventType) => void;
  initialRegion: any;
  mapRef?: any;
  setMapRef?: (ref: any) => void;
  userLocation?: any;
  onMapPress?: () => void;
}

// Composant de carte pour le web
const WebMapView = ({ events }: { events: EventType[] }) => (
  <View className="w-full h-full bg-slate-700 items-center justify-center">
    <View className="items-center">
      <Ionicons name="map-outline" size={64} color="#64748b" />
      <Text className="text-slate-400 text-lg mt-4 font-medium">Map View</Text>
      <Text className="text-slate-500 text-sm mt-2 text-center px-8">
        Maps are available on mobile devices.{'\n'}
        {events.length} events found nearby
      </Text>
    </View>
  </View>
);

// Composant de carte pour mobile
const MobileMapView = ({ 
  events, 
  onMarkerPress, 
  initialRegion, 
  mapRef, 
  setMapRef, 
  userLocation, 
  onMapPress 
}: ConditionalMapProps) => {
  // Import dynamique de react-native-maps seulement sur mobile
  const [MapView, setMapView] = React.useState<any>(null);
  const [Marker, setMarker] = React.useState<any>(null);

  React.useEffect(() => {
    if (Platform.OS !== 'web') {
      import('react-native-maps').then((maps) => {
        setMapView(() => maps.default);
        setMarker(() => maps.Marker);
      }).catch((error) => {
        console.warn('Failed to load react-native-maps:', error);
      });
    }
  }, []);

  if (!MapView || !Marker) {
    return <WebMapView events={events} />;
  }

  const CustomMarker = ({ event, onPress }: { event: EventType; onPress: () => void }) => (
    <Marker
      coordinate={event.coordinate}
      onPress={onPress}
    >
      <View className="items-center">
        <View 
          className="w-12 h-12 rounded-full items-center justify-center shadow-lg border-2 border-white"
          style={{ backgroundColor: event.color }}
        >
          <Text style={{ fontSize: 20 }}>{event.icon}</Text>
        </View>
        <View className="w-3 h-3 bg-white rounded-full mt-1 shadow-sm" />
      </View>
    </Marker>
  );

  return (
    <MapView
      ref={setMapRef}
      style={{ flex: 1 }}
      initialRegion={userLocation ? {
        ...userLocation,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      } : initialRegion}
      showsUserLocation={true}
      showsMyLocationButton={false}
      onPress={onMapPress}
    >
      {/* Marqueurs des événements */}
      {events.map((event) => (
        <CustomMarker
          key={event.id}
          event={event}
          onPress={() => onMarkerPress(event)}
        />
      ))}
    </MapView>
  );
};

const ConditionalMap = (props: ConditionalMapProps) => {
  if (Platform.OS === 'web') {
    return <WebMapView events={props.events} />;
  }
  
  return <MobileMapView {...props} />;
};

export default ConditionalMap; 