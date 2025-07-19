import { Ionicons } from "@expo/vector-icons";
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
  <View className="w-full h-full bg-[#2B3840] items-center justify-center">
    <View className="items-center">
      <Ionicons name="map-outline" size={64} color="#9EB0BD" />
      <Text className="text-[#9EB0BD] text-lg mt-4 font-medium">Map View</Text>
      <Text className="text-[#9EB0BD] text-sm mt-2 text-center px-8">
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
  try {
    const MapView = require('react-native-maps').default;
    const { Marker } = require('react-native-maps');

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
  } catch (error) {
    console.log('react-native-maps not available:', error);
    return <WebMapView events={events} />;
  }
};

const ConditionalMap = (props: ConditionalMapProps) => {
  if (Platform.OS === 'web') {
    return <WebMapView events={props.events} />;
  }
  
  return <MobileMapView {...props} />;
};

export default ConditionalMap; 