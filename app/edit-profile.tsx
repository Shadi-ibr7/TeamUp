import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/context/AuthContext';
import { ProfileService, UserProfile } from '../lib/services/profile';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: '',
    bio: '',
    preferred_sports: [],
    skill_levels: {},
    availability: '',
    avatar_url: ''
  });

  const sports = ['Basketball', 'Soccer', 'Tennis', 'Volleyball', 'Swimming', 'Running', 'Cycling', 'Badminton'];
  const skillLevels = ['Beginner', 'Intermediate', 'Advanced'];

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user?.id) return;
    
    try {
      const profileData = await ProfileService.getUserProfile(user.id);
      if (profileData) {
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    }
  };

  const selectImage = async () => {
    try {
      // Demander la permission d'accéder à la galerie
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à vos photos.');
        return;
      }

      // Options de sélection d'image
      Alert.alert(
        'Choisir une photo',
        'Comment souhaitez-vous choisir votre photo de profil ?',
        [
          {
            text: 'Galerie',
            onPress: () => pickImageFromGallery(),
          },
          {
            text: 'Appareil photo',
            onPress: () => takePhoto(),
          },
          {
            text: 'Annuler',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner une image');
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection depuis la galerie:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner une image depuis la galerie');
    }
  };

  const takePhoto = async () => {
    try {
      // Demander la permission d'accéder à la caméra
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à l\'appareil photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre une photo');
    }
  };

  const uploadImage = async (imageUri: string) => {
    if (!user?.id) return;

    setUploadingPhoto(true);
    try {
      console.log('🔄 Début upload image depuis URI:', imageUri);
      
      // Lire le fichier avec expo-file-system (plus fiable sur mobile)
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      console.log('📋 Info fichier:', fileInfo);
      
      if (!fileInfo.exists) {
        throw new Error('Le fichier image n\'existe pas');
      }

      // Lire le fichier en base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      console.log('📦 Base64 créé, taille:', base64.length, 'caractères');

      // Détecter le type MIME à partir de l'URI
      const fileExtension = imageUri.split('.').pop()?.toLowerCase();
      let mimeType = 'image/jpeg'; // par défaut
      if (fileExtension === 'png') mimeType = 'image/png';
      else if (fileExtension === 'webp') mimeType = 'image/webp';
      else if (fileExtension === 'gif') mimeType = 'image/gif';

      console.log('🏷️ Type MIME détecté:', mimeType);

      // Uploader directement le base64 via ProfileService
      const avatarUrl = await ProfileService.uploadAvatar(user.id, base64, mimeType);
      
      if (avatarUrl) {
        console.log('✅ Avatar uploadé avec succès, URL:', avatarUrl);
        setProfile({ ...profile, avatar_url: avatarUrl });
        console.log('🔄 État local mis à jour avec avatar_url:', avatarUrl);
        Alert.alert('Succès', 'Photo de profil mise à jour !');
      } else {
        console.log('❌ Échec de l\'upload - pas d\'URL retournée');
        Alert.alert('Erreur', 'Impossible de télécharger la photo');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload:', error);
      Alert.alert('Erreur', `Échec du téléchargement de la photo: ${(error as Error).message}`);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      await ProfileService.updateUserProfile(user.id, profile);
      Alert.alert('Succès', 'Profil mis à jour avec succès!');
      router.back();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      setLoading(false);
    }
  };

  const toggleSport = (sport: string) => {
    const currentSports = profile.preferred_sports || [];
    const updatedSports = currentSports.includes(sport)
      ? currentSports.filter(s => s !== sport)
      : [...currentSports, sport];
    
    setProfile({ ...profile, preferred_sports: updatedSports });
  };

  const updateSkillLevel = (sport: string, level: 'Beginner' | 'Intermediate' | 'Advanced') => {
    setProfile({
      ...profile,
      skill_levels: {
        ...profile.skill_levels,
        [sport]: level
      }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#141A1F]">
      <StatusBar barStyle="light-content" backgroundColor="#141A1F" />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 bg-[#141A1F]">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#9EB0BD" />
          </TouchableOpacity>
          <Text className="text-[#FFFFFF] text-xl font-bold">Modifier le profil</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            <Text className={`font-semibold ${loading ? 'text-[#9EB0BD]' : 'text-[#C4D9EB]'}`}>
              {loading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Photo de profil */}
        <View className="bg-[#2B3840] mx-4 rounded-2xl p-6 mb-4">
          <Text className="text-[#FFFFFF] text-lg font-bold mb-4">Photo de profil</Text>
          <View className="items-center">
            <TouchableOpacity 
              onPress={selectImage}
              disabled={uploadingPhoto}
              className="relative"
            >
              <View className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#C4D9EB] bg-[#2B3840]">
                {profile.avatar_url ? (
                  <Image
                    source={{ 
                      uri: `${profile.avatar_url}?t=${Date.now()}`
                    }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full bg-[#2B3840] justify-center items-center">
                    <Ionicons name="person" size={50} color="#9EB0BD" />
                  </View>
                )}
              </View>
              
              {/* Overlay avec icône de caméra */}
              <View className="absolute bottom-0 right-0 w-10 h-10 bg-[#C4D9EB] rounded-full justify-center items-center border-2 border-[#141A1F]">
                {uploadingPhoto ? (
                  <Text className="text-[#141A1F] text-xs">...</Text>
                ) : (
                  <Ionicons name="camera" size={20} color="#141A1F" />
                )}
              </View>
            </TouchableOpacity>
            
            <Text className="text-[#9EB0BD] text-sm mt-2 text-center">
              {uploadingPhoto ? 'Téléchargement...' : 'Touchez pour changer votre photo'}
            </Text>
          </View>
        </View>

        {/* Informations de base */}
        <View className="bg-[#2B3840] mx-4 rounded-2xl p-6 mb-4">
          <Text className="text-[#FFFFFF] text-lg font-bold mb-4">Informations de base</Text>
          
          <View className="mb-4">
            <Text className="text-[#9EB0BD] text-sm font-medium mb-2">Nom</Text>
            <View className="bg-[#141A1F] rounded-2xl px-4 py-3 border border-[#141A1F]">
              <TextInput
                value={profile.name}
                onChangeText={(text) => setProfile({ ...profile, name: text })}
                className="text-[#FFFFFF] text-base"
                placeholder="Entrez votre nom"
                placeholderTextColor="#9EB0BD"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-[#9EB0BD] text-sm font-medium mb-2">Bio</Text>
            <View className="bg-[#141A1F] rounded-2xl px-4 py-3 border border-[#141A1F]">
              <TextInput
                value={profile.bio}
                onChangeText={(text) => setProfile({ ...profile, bio: text })}
                className="text-[#FFFFFF] text-base"
                placeholder="Parlez-nous de vous..."
                placeholderTextColor="#9EB0BD"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View>
            <Text className="text-[#9EB0BD] text-sm font-medium mb-2">Disponibilité</Text>
            <View className="bg-[#141A1F] rounded-2xl px-4 py-3 border border-[#141A1F]">
              <TextInput
                value={profile.availability}
                onChangeText={(text) => setProfile({ ...profile, availability: text })}
                className="text-[#FFFFFF] text-base"
                placeholder="Quand êtes-vous généralement disponible ?"
                placeholderTextColor="#9EB0BD"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Sports préférés */}
        <View className="bg-[#2B3840] mx-4 rounded-2xl p-6 mb-4">
          <Text className="text-[#FFFFFF] text-lg font-bold mb-4">Sports préférés</Text>
          <View className="flex-row flex-wrap gap-2">
            {sports.map((sport) => (
              <TouchableOpacity
                key={sport}
                onPress={() => toggleSport(sport)}
                className={`px-4 py-2 rounded-full ${
                  profile.preferred_sports?.includes(sport)
                    ? 'bg-[#C4D9EB]'
                    : 'bg-[#141A1F] border border-[#141A1F]'
                }`}
              >
                <Text className={`text-sm font-medium ${
                  profile.preferred_sports?.includes(sport) ? 'text-[#141A1F]' : 'text-[#9EB0BD]'
                }`}>
                  {sport}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Niveaux de compétence */}
        <View className="bg-[#2B3840] mx-4 rounded-2xl p-6 mb-4">
          <Text className="text-[#FFFFFF] text-lg font-bold mb-4">Niveaux de compétence</Text>
          {profile.preferred_sports?.map((sport) => (
            <View key={sport} className="mb-4">
              <Text className="text-[#FFFFFF] font-medium mb-2">{sport}</Text>
              <View className="flex-row gap-2">
                {skillLevels.map((level) => (
                  <TouchableOpacity
                    key={level}
                    onPress={() => updateSkillLevel(sport, level as any)}
                    className={`px-4 py-2 rounded-full ${
                      profile.skill_levels?.[sport] === level
                        ? 'bg-[#C4D9EB]'
                        : 'bg-[#141A1F] border border-[#141A1F]'
                    }`}
                  >
                    <Text className={`text-sm font-medium ${
                      profile.skill_levels?.[sport] === level ? 'text-[#141A1F]' : 'text-[#9EB0BD]'
                    }`}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
          {profile.preferred_sports?.length === 0 && (
            <Text className="text-[#9EB0BD] text-center py-4">
              Sélectionnez d'abord vos sports préférés pour définir vos niveaux
            </Text>
          )}
        </View>

        {/* Espacement en bas pour éviter que le contenu soit coupé */}
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
} 