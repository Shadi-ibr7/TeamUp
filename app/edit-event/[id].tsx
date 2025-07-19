import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Image, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from '../../lib/context/AuthContext';
import { EventService } from '../../lib/services/events';
import { ProfileService } from '../../lib/services/profile';

export default function EditEvent() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();

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
  const [originalEvent, setOriginalEvent] = useState<any>(null);

  const sportTypes = [
    "Football", "Basketball", "Tennis", "Running", 
    "Cycling", "Swimming", "Volleyball", "Badminton"
  ];

  useEffect(() => {
    if (id) {
      loadEventData();
    }
  }, [id]);

  const loadEventData = async () => {
    try {
      setLoading(true);
      const event = await EventService.getEventById(id as string);
      
      if (event.organizer_id !== user?.id) {
        Alert.alert('Erreur', 'Vous n\'êtes pas autorisé à modifier cet événement');
        router.back();
        return;
      }

      setOriginalEvent(event);
      setTitle(event.title);
      setDescription(event.description);
      setLocation(event.location);
      setDate(new Date(event.date));
      setTime(new Date(`2000-01-01T${event.time}`));
      setMaxParticipants(event.max_participants.toString());
      setSportType(event.sport_type);
      setPrice(event.price ? event.price.toString() : "");
      setEventImage(event.image_url);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'événement:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'événement');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  // Sélectionner et uploader une image
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', 'Nous avons besoin de votre permission pour accéder à votre galerie');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUploading(true);
        const imageUri = result.assets[0].uri;
        
        if (user?.id) {
          const imageUrl = await ProfileService.uploadEventImage(user.id, imageUri);
          if (imageUrl) {
            setEventImage(imageUrl);
            console.log('✅ Image uploadée avec succès:', imageUrl);
          } else {
            Alert.alert('Erreur', 'Impossible d\'uploader l\'image');
          }
        }
        setImageUploading(false);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
      setImageUploading(false);
    }
  };

  // Formater la date pour l'affichage
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR');
  };

  // Formater l'heure pour l'affichage
  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // Gérer le changement de date
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  // Gérer le changement d'heure
  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setTime(selectedTime);
    }
  };

  const handleUpdateEvent = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Vous devez être connecté pour modifier un événement');
      return;
    }

    if (!title || !description || !location || !maxParticipants || !sportType) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    const eventDateTime = new Date(date);
    eventDateTime.setHours(time.getHours(), time.getMinutes());
    
    if (eventDateTime < new Date()) {
      Alert.alert('Erreur', 'La date et l\'heure de l\'événement ne peuvent pas être dans le passé');
      return;
    }

    const participants = parseInt(maxParticipants);
    if (isNaN(participants) || participants < 2) {
      Alert.alert('Erreur', 'Le nombre de participants doit être d\'au moins 2');
      return;
    }

    const eventPrice = price ? parseFloat(price) : 0;
    if (isNaN(eventPrice) || eventPrice < 0) {
      Alert.alert('Erreur', 'Le prix doit être un nombre positif');
      return;
    }

    setLoading(true);

    try {
      const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const formattedTime = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}`;
      
      const eventData = {
        title,
        description,
        location,
        date: formattedDate,
        time: formattedTime,
        sport_type: sportType,
        max_participants: participants,
        image_url: eventImage || undefined
      };

      if (user?.id) {
        await EventService.updateEvent(id as string, user.id, eventData);
        Alert.alert(
          'Succès', 
          'Événement modifié avec succès !',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      console.error('Erreur lors de la modification de l\'événement:', error);
      Alert.alert('Erreur', error.message || 'Impossible de modifier l\'événement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#141A1F] justify-center items-center" style={{ backgroundColor: '#141A1F' }}>
        <Text className="text-[#FFFFFF] text-lg">Chargement...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#141A1F]" style={{ backgroundColor: '#141A1F' }}>
      <StatusBar barStyle="light-content" backgroundColor="#141A1F" />
      
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 bg-[#141A1F] pt-12">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#9EB0BD" />
        </TouchableOpacity>
        <Text className="text-[#FFFFFF] text-xl font-bold flex-1">Modifier l'événement</Text>
      </View>

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Titre */}
        <View className="mb-4">
          <Text className="text-[#FFFFFF] text-base font-medium mb-2">Titre de l'événement *</Text>
          <View className="bg-[#2B3840] rounded-2xl px-4 py-4 border border-[#2B3840]">
            <TextInput
              className="text-[#FFFFFF] text-base"
              placeholder="Ex: Match de football amical"
              placeholderTextColor="#9EB0BD"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>
        </View>

        {/* Description */}
        <View className="mb-4">
          <Text className="text-[#FFFFFF] text-base font-medium mb-2">Description *</Text>
          <View className="bg-[#2B3840] rounded-2xl px-4 py-4 border border-[#2B3840]">
            <TextInput
              className="text-[#FFFFFF] text-base"
              placeholder="Décrivez votre événement..."
              placeholderTextColor="#9EB0BD"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>
        </View>

        {/* Image de l'événement */}
        <View className="mb-4">
          <Text className="text-[#FFFFFF] text-base font-medium mb-2">Photo de l'événement</Text>
          <TouchableOpacity 
            onPress={pickImage}
            className="bg-[#2B3840] rounded-2xl border-2 border-dashed border-[#9EB0BD] p-6 items-center justify-center"
            disabled={imageUploading}
          >
            {eventImage ? (
              <View className="w-full">
                <Image 
                  source={{ uri: eventImage }} 
                  className="w-full h-32 rounded-xl"
                  resizeMode="cover"
                />
                <TouchableOpacity 
                  onPress={() => setEventImage(null)}
                  className="absolute top-2 right-2 bg-[#ff6b6b] rounded-full p-2"
                >
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View className="items-center">
                {imageUploading ? (
                  <View className="items-center">
                    <Ionicons name="cloud-upload" size={48} color="#C4D9EB" />
                    <Text className="text-[#C4D9EB] text-base mt-2">Upload en cours...</Text>
                  </View>
                ) : (
                  <View className="items-center">
                    <Ionicons name="camera" size={48} color="#9EB0BD" />
                    <Text className="text-[#9EB0BD] text-base mt-2">Modifier la photo</Text>
                    <Text className="text-[#9EB0BD] text-sm mt-1">Taille recommandée: 16:9</Text>
                  </View>
                )}
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Type de sport */}
        <View className="mb-4">
          <Text className="text-[#FFFFFF] text-base font-medium mb-2">Type de sport *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row">
              {sportTypes.map((sport) => (
                <TouchableOpacity
                  key={sport}
                  onPress={() => setSportType(sport)}
                  className={`mr-3 px-4 py-3 rounded-2xl ${
                    sportType === sport 
                      ? 'bg-[#C4D9EB]' 
                      : 'bg-[#2B3840] border border-[#2B3840]'
                  }`}
                >
                  <Text className={`font-medium ${
                    sportType === sport ? 'text-[#141A1F]' : 'text-[#9EB0BD]'
                  }`}>
                    {sport}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Lieu */}
        <View className="mb-4">
          <Text className="text-[#FFFFFF] text-base font-medium mb-2">Lieu *</Text>
          <View className="bg-[#2B3840] rounded-2xl px-4 py-4 border border-[#2B3840]">
            <TextInput
              className="text-[#FFFFFF] text-base"
              placeholder="Ex: Stade Municipal, Paris"
              placeholderTextColor="#9EB0BD"
              value={location}
              onChangeText={setLocation}
              maxLength={200}
            />
          </View>
        </View>

        {/* Date et heure */}
        <View className="flex-row mb-4">
          <View className="flex-1 mr-2">
            <Text className="text-[#FFFFFF] text-base font-medium mb-2">Date *</Text>
            <TouchableOpacity 
              onPress={() => setShowDatePicker(true)}
              className="bg-[#2B3840] rounded-2xl px-4 py-4 border border-[#2B3840] flex-row items-center justify-between"
            >
              <Text className="text-[#FFFFFF] text-base">{formatDate(date)}</Text>
              <Ionicons name="calendar-outline" size={20} color="#9EB0BD" />
            </TouchableOpacity>
          </View>
          <View className="flex-1 ml-2">
            <Text className="text-[#FFFFFF] text-base font-medium mb-2">Heure *</Text>
            <TouchableOpacity 
              onPress={() => setShowTimePicker(true)}
              className="bg-[#2B3840] rounded-2xl px-4 py-4 border border-[#2B3840] flex-row items-center justify-between"
            >
              <Text className="text-[#FFFFFF] text-base">{formatTime(time)}</Text>
              <Ionicons name="time-outline" size={20} color="#9EB0BD" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Participants et prix */}
        <View className="flex-row mb-6">
          <View className="flex-1 mr-2">
            <Text className="text-[#FFFFFF] text-base font-medium mb-2">Max participants *</Text>
            <View className="bg-[#2B3840] rounded-2xl px-4 py-4 border border-[#2B3840]">
              <TextInput
                className="text-[#FFFFFF] text-base"
                placeholder="Ex: 20"
                placeholderTextColor="#9EB0BD"
                value={maxParticipants}
                onChangeText={setMaxParticipants}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
          </View>
          <View className="flex-1 ml-2">
            <Text className="text-[#FFFFFF] text-base font-medium mb-2">Prix (€)</Text>
            <View className="bg-[#2B3840] rounded-2xl px-4 py-4 border border-[#2B3840]">
              <TextInput
                className="text-[#FFFFFF] text-base"
                placeholder="0 (gratuit)"
                placeholderTextColor="#9EB0BD"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>
          </View>
        </View>

        {/* Bouton de mise à jour */}
        <TouchableOpacity
          onPress={handleUpdateEvent}
          disabled={loading}
          className="bg-[#C4D9EB] rounded-2xl py-4 mb-6"
        >
          <Text className="text-[#141A1F] text-center font-bold text-lg">
            {loading ? 'Modification...' : 'Modifier l\'événement'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          display="default"
          onChange={onTimeChange}
        />
      )}
    </View>
  );
} 