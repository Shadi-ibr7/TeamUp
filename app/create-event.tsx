import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, ImageBackground, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from "../lib/context/AuthContext";
import { useTheme } from '../lib/context/ThemeContext';
import { PublicEquipment } from '../lib/services/equipments';
import { EventService } from "../lib/services/events";
import { GeocodingService } from "../lib/services/geocoding";
import { supabase } from '../lib/supabase';

export default function CreateEvent() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [maxParticipants, setMaxParticipants] = useState("");
  const [sportType, setSportType] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [eventImage, setEventImage] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);

  const [showTerrainModal, setShowTerrainModal] = useState(false);
  const [publicTerrains, setPublicTerrains] = useState<PublicEquipment[]>([]);
  const [selectedTerrain, setSelectedTerrain] = useState<PublicEquipment | null>(null);
  const [loadingTerrains, setLoadingTerrains] = useState(false);
  const [usePublicTerrain, setUsePublicTerrain] = useState(false);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [searchRadius, setSearchRadius] = useState(50);

  const { user } = useAuth();
  const { isDarkMode, colors } = useTheme();
  const router = useRouter();

  const sportTypes = [
    "Football", "Basketball", "Tennis", "Running", 
    "Cycling", "Swimming", "Volleyball", "Badminton"
  ];

  useEffect(() => {
    if (usePublicTerrain) {
      loadPublicTerrains();
    }
  }, [sportType, searchRadius, usePublicTerrain]);

  const createTestTerrains = () => {
    const testTerrains: PublicEquipment[] = [
      {
        id: 'test_1',
        external_id: 'test_1',
        name: 'Terrain de Football Municipal',
        type: 'Terrain de football',
        address: '123 Avenue de la République',
        city: 'Paris',
        department: '75',
        latitude: 48.8566,
        longitude: 2.3522,
        manager_name: 'Mairie de Paris',
        property_type: 'Public',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'test_2',
        external_id: 'test_2',
        name: 'Stade Municipal',
        type: 'Terrain de football',
        address: '456 Boulevard Saint-Germain',
        city: 'Paris',
        department: '75',
        latitude: 48.8534,
        longitude: 2.3488,
        manager_name: 'Mairie de Paris',
        property_type: 'Public',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'test_3',
        external_id: 'test_3',
        name: 'Complexe Sportif',
        type: 'Terrain de football',
        address: '789 Rue de Rivoli',
        city: 'Paris',
        department: '75',
        latitude: 48.8606,
        longitude: 2.3376,
        manager_name: 'Mairie de Paris',
        property_type: 'Public',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    setPublicTerrains(testTerrains);
  };

  const loadPublicTerrains = async () => {
    if (!sportType) return;
    setLoadingTerrains(true);
    try {
      createTestTerrains();
    } catch (error) {
      console.error('Erreur lors du chargement des terrains:', error);
      Alert.alert('Erreur', 'Impossible de charger les terrains publics');
    } finally {
      setLoadingTerrains(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setEventImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à la caméra');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setEventImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string): Promise<string> => {
    setImageUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const fileName = `event-images/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const { data, error } = await supabase.storage
        .from('event-images')
        .upload(fileName, blob);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      throw new Error('Impossible d\'uploader l\'image');
    } finally {
      setImageUploading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!user?.id) {
      Alert.alert('Erreur', 'Vous devez être connecté pour créer un événement');
      return;
    }

    if (!title || !description || !location || !sportType || !maxParticipants) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = null;
      if (eventImage) {
        imageUrl = await uploadImage(eventImage);
      }

      let latitude = null;
      let longitude = null;
      
      if (selectedTerrain) {
        latitude = selectedTerrain.latitude;
        longitude = selectedTerrain.longitude;
      } else {
        try {
          const coords = await GeocodingService.getCoordinatesForLocation(location);
          latitude = coords.latitude;
          longitude = coords.longitude;
        } catch (error) {
          console.warn('Impossible d\'obtenir les coordonnées GPS:', error);
        }
      }

      const eventData = {
        title,
        description,
        sport_type: sportType,
        date: date.toISOString().split('T')[0],
        time: time.toTimeString().split(' ')[0],
        location: selectedTerrain ? `${selectedTerrain.name}, ${selectedTerrain.address}` : location,
        max_participants: parseInt(maxParticipants),
        price: price ? parseFloat(price) : 0,
        organizer_id: user.id,
        image_url: imageUrl || undefined,
        latitude: latitude || 0,
        longitude: longitude || 0,
        is_active: true
      };

      const newEvent = await EventService.createEvent(eventData);
      
      Alert.alert('Succès', 'Événement créé avec succès !', [
        {
          text: 'Voir l\'événement',
          onPress: () => router.push(`/events/${newEvent.id}`)
        },
        {
          text: 'Créer un autre',
          onPress: () => {
            setTitle("");
            setDescription("");
            setLocation("");
            setDate(new Date());
            setTime(new Date());
            setMaxParticipants("");
            setSportType("");
            setPrice("");
            setEventImage(null);
            setSelectedTerrain(null);
          }
        }
      ]);
    } catch (error: any) {
      console.error('Erreur lors de la création:', error);
      Alert.alert('Erreur', error.message || 'Impossible de créer l\'événement');
    } finally {
      setLoading(false);
    }
  };

  const getSportIcon = (sport: string) => {
    const icons: { [key: string]: string } = {
      'Football': '⚽', 'Basketball': '🏀', 'Tennis': '🎾', 'Running': '🏃‍♂️', 'Cycling': '🚴‍♂️', 'Swimming': '🏊‍♂️', 'Volleyball': '🏐', 'Badminton': '🏸'
    };
    return icons[sport] || '🏟️';
  };

  const getSportColor = (sport: string) => {
    const colors: { [key: string]: string } = {
      'Football': '#22c55e', 'Basketball': '#f59e0b', 'Tennis': '#0891b2', 'Running': '#d97706', 'Cycling': '#16a34a', 'Swimming': '#06b6d4', 'Volleyball': '#8b5cf6', 'Badminton': '#ec4899'
    };
    return colors[sport] || '#6b7280';
  };

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200' }}
      style={{ flex: 1 }}
      blurRadius={30}
    >
      <LinearGradient colors={isDarkMode ? ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)'] : ['rgba(255,255,255,0.3)', 'rgba(242,242,247,0.7)']} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* StatusBar géré globalement */}
          
          {/* Header simple */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, borderRadius: 999, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}>
              <Ionicons name="arrow-back" size={22} color={isDarkMode ? colors.foreground : '#111'} />
            </TouchableOpacity>
            <Text style={{ fontSize: 20, fontWeight: '700', color: isDarkMode ? colors.foreground : '#111' }}>Créer un événement</Text>
            <View style={{ width: 38 }} />
          </View>

          <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
            <View style={{ backgroundColor: isDarkMode ? colors.card : 'rgba(255,255,255,0.6)', borderRadius: 16, borderWidth: 1, borderColor: isDarkMode ? colors.border : 'rgba(0,0,0,0.08)', padding: 24, marginBottom: 24 }}>
              <Text style={{ fontSize: 24, fontWeight: '700', marginBottom: 24, color: isDarkMode ? colors.foreground : '#111' }}>
                Nouvel événement
              </Text>

              {/* Image Upload */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12, color: isDarkMode ? colors.foreground : '#111' }}>
                  Image de l'événement
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert('Choisir une image', 'Comment voulez-vous ajouter une image ?', [
                      { text: 'Annuler', style: 'cancel' },
                      { text: 'Prendre une photo', onPress: takePhoto },
                      { text: 'Choisir depuis la galerie', onPress: pickImage }
                    ]);
                  }}
                  style={{ width: '100%', height: 128, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderStyle: 'dashed', borderColor: isDarkMode ? colors.border : 'rgba(0,0,0,0.2)' }}
                >
                  {eventImage ? (
                    <Image source={{ uri: eventImage }} style={{ width: '100%', height: '100%', borderRadius: 16 }} />
                  ) : (
                    <View style={{ alignItems: 'center' }}>
                      <Ionicons name="camera" size={32} color={isDarkMode ? colors.mutedForeground : '#666'} />
                      <Text style={{ marginTop: 8, color: isDarkMode ? colors.mutedForeground : '#666' }}>
                        Ajouter une image
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Basic Info */}
              <View style={{ gap: 16 }}>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: isDarkMode ? colors.foreground : '#111' }}>Titre de l'événement *</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? colors.input : 'rgba(0,0,0,0.04)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
                    <Ionicons name="create-outline" size={18} color={isDarkMode ? colors.mutedForeground : '#666'} />
                    <TextInput
                      placeholder="Ex: Match amical de football"
                      placeholderTextColor={isDarkMode ? colors.mutedForeground : '#888'}
                      value={title}
                      onChangeText={setTitle}
                      style={{ marginLeft: 8, flex: 1, color: isDarkMode ? colors.foreground : '#111' }}
                    />
                  </View>
                </View>

                <View>
                  <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: isDarkMode ? colors.foreground : '#111' }}>Description</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: isDarkMode ? colors.input : 'rgba(0,0,0,0.04)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
                    <Ionicons name="document-text-outline" size={18} color={isDarkMode ? colors.mutedForeground : '#666'} style={{ marginTop: 2 }} />
                    <TextInput
                      placeholder="Décrivez votre événement..."
                      placeholderTextColor={isDarkMode ? colors.mutedForeground : '#888'}
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={3}
                      style={{ marginLeft: 8, flex: 1, color: isDarkMode ? colors.foreground : '#111' }}
                    />
                  </View>
                </View>

                {/* Sport Type Selection */}
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 12, color: isDarkMode ? colors.foreground : '#111' }}>
                    Type de sport *
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      {sportTypes.map((sport) => (
                        <TouchableOpacity
                          key={sport}
                          onPress={() => setSportType(sport)}
                          style={{ 
                            flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999, borderWidth: 2,
                            backgroundColor: sportType === sport ? (isDarkMode ? 'rgba(0,122,255,0.3)' : 'rgba(0,122,255,0.2)') : 'transparent',
                            borderColor: sportType === sport ? colors.primary : (isDarkMode ? colors.border : 'rgba(0,0,0,0.2)')
                          }}
                        >
                          <Text style={{ fontSize: 18, marginRight: 8 }}>{getSportIcon(sport)}</Text>
                          <Text style={{ fontWeight: '500', color: sportType === sport ? colors.primary : (isDarkMode ? colors.foreground : '#111') }}>
                            {sport}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Date and Time */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: isDarkMode ? colors.foreground : '#111' }}>Date *</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? colors.input : 'rgba(0,0,0,0.04)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
                      <Ionicons name="calendar-outline" size={18} color={isDarkMode ? colors.mutedForeground : '#666'} />
                      <Text style={{ marginLeft: 8, flex: 1, color: isDarkMode ? colors.foreground : '#111' }}>{date.toLocaleDateString('fr-FR')}</Text>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity onPress={() => setShowTimePicker(true)} style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: isDarkMode ? colors.foreground : '#111' }}>Heure *</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? colors.input : 'rgba(0,0,0,0.04)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
                      <Ionicons name="time-outline" size={18} color={isDarkMode ? colors.mutedForeground : '#666'} />
                      <Text style={{ marginLeft: 8, flex: 1, color: isDarkMode ? colors.foreground : '#111' }}>{time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Location */}
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 12, color: isDarkMode ? colors.foreground : '#111' }}>
                    Localisation *
                  </Text>
                  
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                    <TouchableOpacity
                      onPress={() => setUsePublicTerrain(false)}
                      style={{ 
                        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
                        backgroundColor: !usePublicTerrain ? colors.primary : (isDarkMode ? colors.input : 'rgba(0,0,0,0.06)')
                      }}
                    >
                      <Text style={{ color: !usePublicTerrain ? '#fff' : (isDarkMode ? colors.foreground : '#111'), fontWeight: '600' }}>Adresse libre</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setUsePublicTerrain(true)}
                      style={{ 
                        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
                        backgroundColor: usePublicTerrain ? colors.primary : (isDarkMode ? colors.input : 'rgba(0,0,0,0.06)')
                      }}
                    >
                      <Text style={{ color: usePublicTerrain ? '#fff' : (isDarkMode ? colors.foreground : '#111'), fontWeight: '600' }}>Terrain public</Text>
                    </TouchableOpacity>
                  </View>

                  {!usePublicTerrain ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? colors.input : 'rgba(0,0,0,0.04)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
                      <Ionicons name="location-outline" size={18} color={isDarkMode ? colors.mutedForeground : '#666'} />
                      <TextInput
                        placeholder="Adresse de l'événement"
                        placeholderTextColor={isDarkMode ? colors.mutedForeground : '#888'}
                        value={location}
                        onChangeText={setLocation}
                        style={{ marginLeft: 8, flex: 1, color: isDarkMode ? colors.foreground : '#111' }}
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setShowTerrainModal(true)}
                      style={{ 
                        flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? colors.input : 'rgba(0,0,0,0.04)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 14
                      }}
                    >
                      <Ionicons name="search-outline" size={18} color={isDarkMode ? colors.mutedForeground : '#666'} />
                      <Text style={{ marginLeft: 8, flex: 1, color: selectedTerrain ? (isDarkMode ? colors.foreground : '#111') : (isDarkMode ? colors.mutedForeground : '#888') }}>
                        {selectedTerrain ? selectedTerrain.name : 'Choisir un terrain'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Participants and Price */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: isDarkMode ? colors.foreground : '#111' }}>Participants max *</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? colors.input : 'rgba(0,0,0,0.04)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
                      <Ionicons name="people-outline" size={18} color={isDarkMode ? colors.mutedForeground : '#666'} />
                      <TextInput
                        placeholder="10"
                        placeholderTextColor={isDarkMode ? colors.mutedForeground : '#888'}
                        value={maxParticipants}
                        onChangeText={setMaxParticipants}
                        keyboardType="numeric"
                        style={{ marginLeft: 8, flex: 1, color: isDarkMode ? colors.foreground : '#111' }}
                      />
                    </View>
                  </View>
                  
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', marginBottom: 8, color: isDarkMode ? colors.foreground : '#111' }}>Prix (€)</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? colors.input : 'rgba(0,0,0,0.04)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 }}>
                      <Ionicons name="card-outline" size={18} color={isDarkMode ? colors.mutedForeground : '#666'} />
                      <TextInput
                        placeholder="0"
                        placeholderTextColor={isDarkMode ? colors.mutedForeground : '#888'}
                        value={price}
                        onChangeText={setPrice}
                        keyboardType="numeric"
                        style={{ marginLeft: 8, flex: 1, color: isDarkMode ? colors.foreground : '#111' }}
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Create Button */}
              <View style={{ marginTop: 32 }}>
                <TouchableOpacity
                  onPress={handleCreateEvent}
                  disabled={loading}
                  style={{ 
                    paddingVertical: 16, borderRadius: 16, alignItems: 'center',
                    backgroundColor: colors.primary,
                    opacity: loading ? 0.5 : 1
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                    {loading ? 'Création...' : 'Créer l\'événement'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Date Picker Modal */}
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
              minimumDate={new Date()}
            />
          )}

          {/* Time Picker Modal */}
          {showTimePicker && (
            <DateTimePicker
              value={time}
              mode="time"
              display="default"
              onChange={(event, selectedDate) => {
                setShowTimePicker(false);
                if (selectedDate) setTime(selectedDate);
              }}
            />
          )}

          {/* Terrain Selection Modal */}
          <Modal
            visible={showTerrainModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowTerrainModal(false)}
          >
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
              <View style={{ backgroundColor: 'rgba(0,0,0,0.5)', flex: 1 }} onTouchEnd={() => setShowTerrainModal(false)} />
              <View style={{ backgroundColor: 'rgba(255,255,255,0.95)', margin: 16, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', maxHeight: 384 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: 16 }}>
                  <Text style={{ fontSize: 20, fontWeight: '700', color: '#111' }}>
                    Choisir un terrain
                  </Text>
                  <TouchableOpacity onPress={() => setShowTerrainModal(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={{ maxHeight: 320, paddingHorizontal: 16 }}>
                  {loadingTerrains ? (
                    <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                      <Text style={{ color: '#666' }}>Chargement des terrains...</Text>
                    </View>
                  ) : publicTerrains.length === 0 ? (
                    <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                      <Text style={{ color: '#666' }}>Aucun terrain trouvé</Text>
                    </View>
                  ) : (
                    <View style={{ gap: 12, paddingBottom: 16 }}>
                      {publicTerrains.map((terrain) => (
                        <TouchableOpacity
                          key={terrain.id}
                          onPress={() => {
                            setSelectedTerrain(terrain);
                            setShowTerrainModal(false);
                          }}
                        >
                          <View style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', padding: 16 }}>
                            <Text style={{ fontWeight: '600', marginBottom: 4, color: '#111' }}>
                              {terrain.name}
                            </Text>
                            <Text style={{ fontSize: 14, color: '#666' }}>
                              {terrain.address}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#666' }}>
                              {terrain.type}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
} 