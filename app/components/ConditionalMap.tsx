import { Ionicons } from "@expo/vector-icons";
import { Alert, Platform, Text, View } from 'react-native';
import { EquipmentService, PublicEquipment } from '../../lib/services/equipments';

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
  showPublicTerrains?: boolean; // Nouvelle prop pour afficher les terrains
  onTerrainPress?: (terrain: PublicEquipment) => void; // Callback pour les terrains
}

// Composant de carte pour le web
const WebMapView = ({ events, showPublicTerrains }: { events: EventType[]; showPublicTerrains?: boolean }) => (
  <View className="w-full h-full bg-[#2B3840] items-center justify-center">
    <View className="items-center">
      <Ionicons name="map-outline" size={64} color="#9EB0BD" />
      <Text className="text-[#9EB0BD] text-lg mt-4 font-medium">Map View</Text>
      <Text className="text-[#9EB0BD] text-sm mt-2 text-center px-8">
        Maps are available on mobile devices.{'\n'}
        {events.length} events found nearby
        {showPublicTerrains && '\nPublic terrains available'}
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
  onMapPress,
  showPublicTerrains = false,
  onTerrainPress
}: ConditionalMapProps) => {
  try {
    const MapView = require('react-native-maps').default;
    const { Marker } = require('react-native-maps');
    const { useState, useEffect } = require('react');

    const [publicTerrains, setPublicTerrains] = useState<PublicEquipment[]>([]);
    const [loadingTerrains, setLoadingTerrains] = useState(false);

    // Charger les terrains publics quand showPublicTerrains est activé
    useEffect(() => {
      if (showPublicTerrains && userLocation) {
        loadPublicTerrains();
      }
    }, [showPublicTerrains, userLocation]);

    const loadPublicTerrains = async () => {
      try {
        setLoadingTerrains(true);
        const terrains = await EquipmentService.getEquipments({
          property_type: 'Public',
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius: 10, // 10km autour de l'utilisateur
          limit: 50
        });
        setPublicTerrains(terrains);
      } catch (error) {
        console.error('Erreur lors du chargement des terrains:', error);
        Alert.alert('Erreur', 'Impossible de charger les terrains publics');
      } finally {
        setLoadingTerrains(false);
      }
    };

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

    const TerrainMarker = ({ terrain, onPress }: { terrain: PublicEquipment; onPress: () => void }) => (
      <Marker
        coordinate={{
          latitude: terrain.latitude || 0,
          longitude: terrain.longitude || 0
        }}
        onPress={onPress}
      >
        <View className="items-center">
          <View className="w-10 h-10 rounded-full items-center justify-center shadow-lg border-2 border-white bg-blue-500">
            <Ionicons name="football" size={20} color="#ffffff" />
          </View>
          <View className="w-2 h-2 bg-blue-500 rounded-full mt-1 shadow-sm" />
        </View>
      </Marker>
    );

    console.log('🗺️ MobileMapView - Nombre d\'événements à afficher:', events?.length || 0);
    console.log('🗺️ MobileMapView - Nombre de terrains à afficher:', publicTerrains?.length || 0);
    
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
        {events && events.length > 0 ? (
          events.map((event) => {
            console.log('🗺️ Création du marqueur pour:', event.title, 'à', event.coordinate);
            return (
              <CustomMarker
                key={event.id}
                event={event}
                onPress={() => onMarkerPress(event)}
              />
            );
          })
        ) : null}

        {/* Marqueurs des terrains publics */}
        {showPublicTerrains && publicTerrains && publicTerrains.length > 0 ? (
          publicTerrains.map((terrain) => {
            if (!terrain.latitude || !terrain.longitude) return null;
            
            return (
              <TerrainMarker
                key={terrain.id}
                terrain={terrain}
                onPress={() => onTerrainPress?.(terrain)}
              />
            );
          })
        ) : null}
      </MapView>
    );
  } catch (error) {
    console.error('Erreur lors du chargement de la carte mobile:', error);
    return (
      <View className="flex-1 bg-gray-800 items-center justify-center">
        <Ionicons name="map-outline" size={64} color="#9EB0BD" />
        <Text className="text-[#9EB0BD] text-lg mt-4">Erreur de carte</Text>
      </View>
    );
  }
};

const ConditionalMap = (props: ConditionalMapProps) => {
  if (Platform.OS === 'web') {
    return <WebMapView events={props.events} showPublicTerrains={props.showPublicTerrains} />;
  }
  
  return <MobileMapView {...props} />;
};

export default ConditionalMap; 