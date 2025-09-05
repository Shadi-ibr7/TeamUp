import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/context/AuthContext';
import { useTheme } from '../lib/context/ThemeContext';
import { EquipmentService, PublicEquipment } from '../lib/services/equipments';
import { CreateReservationRequest, ReservationService } from '../lib/services/reservations';

export default function ReservationScreen() {
  const router = useRouter();
  const { equipmentId } = useLocalSearchParams<{ equipmentId: string }>();
  const { user } = useAuth();
  const { isDarkMode, colors } = useTheme();
  
  const [equipment, setEquipment] = useState<PublicEquipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Formulaire de réservation
  const [sportType, setSportType] = useState('');
  const [description, setDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('10');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 2 * 60 * 60 * 1000)); // +2h
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Charger l'équipement
  useEffect(() => {
    if (equipmentId) {
      loadEquipment();
    }
  }, [equipmentId]);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const equipmentData = await EquipmentService.getEquipmentById(equipmentId!);
      if (equipmentData) {
        setEquipment(equipmentData);
        setSportType(equipmentData.type);
      } else {
        Alert.alert('Erreur', 'Terrain non trouvé');
        router.back();
      }
    } catch (error) {
      console.error('Erreur lors du chargement du terrain:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails du terrain');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
      // Ajuster automatiquement la date de fin
      const newEndDate = new Date(selectedDate.getTime() + 2 * 60 * 60 * 1000);
      setEndDate(newEndDate);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const validateForm = (): boolean => {
    if (!sportType.trim()) {
      Alert.alert('Erreur', 'Veuillez spécifier le type de sport');
      return false;
    }

    if (startDate >= endDate) {
      Alert.alert('Erreur', 'La date de fin doit être après la date de début');
      return false;
    }

    if (startDate <= new Date()) {
      Alert.alert('Erreur', 'La réservation doit être dans le futur');
      return false;
    }

    const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    if (durationHours > 4) {
      Alert.alert('Erreur', 'La durée maximale autorisée est de 4 heures');
      return false;
    }

    const participants = parseInt(maxParticipants);
    if (isNaN(participants) || participants < 1 || participants > 50) {
      Alert.alert('Erreur', 'Le nombre de participants doit être entre 1 et 50');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Vous devez être connecté pour réserver un terrain');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const reservationRequest: CreateReservationRequest = {
        equipment_id: equipmentId!,
        organizer_id: user.id,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        sport_type: sportType,
        description: description.trim() || undefined,
        max_participants: parseInt(maxParticipants),
      };

      const reservation = await ReservationService.createReservation(reservationRequest);

      // Créer une notification
      await ReservationService.createNotification(
        reservation.id,
        user.id,
        'confirmation',
        'Réservation créée',
        `Votre réservation pour ${equipment?.name} a été créée et est en attente de validation.`
      );

      Alert.alert(
        'Réservation créée',
        'Votre demande de réservation a été envoyée et est en attente de validation.',
        [
          {
            text: 'Voir mes réservations',
            onPress: () => router.push('/mes-reservations'),
          },
          {
            text: 'OK',
            style: 'cancel',
          },
        ]
      );

      router.back();
    } catch (error: any) {
      console.error('Erreur lors de la création de la réservation:', error);
      Alert.alert('Erreur', error.message || 'Impossible de créer la réservation');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, fontSize: 16, color: colors.foreground }}>Chargement du terrain...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!equipment) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="alert-circle" size={64} color={colors.destructive} />
          <Text style={{ marginTop: 16, fontSize: 18, color: colors.foreground, textAlign: 'center' }}>Terrain non trouvé</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          paddingHorizontal: 20, 
          paddingVertical: 16, 
          borderBottomWidth: 1, 
          borderBottomColor: colors.border 
        }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.foreground }}>Réserver un terrain</Text>
        </View>

        {/* Détails du terrain */}
        <View style={{ 
          backgroundColor: colors.card, 
          margin: 20, 
          padding: 16, 
          borderRadius: 12, 
          borderWidth: 1, 
          borderColor: colors.border 
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.foreground, marginBottom: 4 }}>{equipment.name}</Text>
          <Text style={{ fontSize: 14, color: colors.primary, marginBottom: 12 }}>{equipment.type}</Text>
          
          <View style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="location" size={16} color={colors.mutedForeground} />
              <Text style={{ fontSize: 14, color: colors.mutedForeground, marginLeft: 8, flex: 1 }}>
                {equipment.address}, {equipment.city} ({equipment.department})
              </Text>
            </View>
            
            {equipment.manager_name && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Ionicons name="business" size={16} color={colors.mutedForeground} />
                <Text style={{ fontSize: 14, color: colors.mutedForeground, marginLeft: 8, flex: 1 }}>{equipment.manager_name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Formulaire de réservation */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground, marginBottom: 20 }}>Détails de la réservation</Text>

          {/* Type de sport */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground, marginBottom: 8 }}>Type de sport *</Text>
            <TextInput
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 12,
                color: colors.foreground,
                fontSize: 16
              }}
              value={sportType}
              onChangeText={setSportType}
              placeholder="Ex: Football, Tennis, Basketball..."
              placeholderTextColor={colors.mutedForeground}
            />
          </View>

          {/* Date et heure de début */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground, marginBottom: 8 }}>Date et heure de début *</Text>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 12
              }}
              onPress={() => setShowStartPicker(true)}
            >
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontSize: 16, marginLeft: 8 }}>
                {formatDate(startDate)} à {formatTime(startDate)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date et heure de fin */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground, marginBottom: 8 }}>Date et heure de fin *</Text>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 12
              }}
              onPress={() => setShowEndPicker(true)}
            >
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontSize: 16, marginLeft: 8 }}>
                {formatDate(endDate)} à {formatTime(endDate)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Nombre de participants */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground, marginBottom: 8 }}>Nombre maximum de participants</Text>
            <TextInput
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 12,
                color: colors.foreground,
                fontSize: 16
              }}
              value={maxParticipants}
              onChangeText={setMaxParticipants}
              keyboardType="numeric"
              placeholder="10"
              placeholderTextColor={colors.mutedForeground}
            />
          </View>

          {/* Description */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: colors.foreground, marginBottom: 8 }}>Description (optionnel)</Text>
            <TextInput
              style={{
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 12,
                color: colors.foreground,
                fontSize: 16,
                height: 100,
                textAlignVertical: 'top'
              }}
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez votre événement..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Informations importantes */}
          <View style={{ 
            flexDirection: 'row', 
            backgroundColor: colors.card, 
            padding: 16, 
            borderRadius: 8, 
            marginBottom: 24,
            borderWidth: 1,
            borderColor: colors.border
          }}>
            <Ionicons name="information-circle" size={20} color={colors.primary} />
            <Text style={{ 
              color: colors.foreground, 
              fontSize: 14, 
              lineHeight: 20, 
              marginLeft: 12, 
              flex: 1 
            }}>
              Votre réservation sera soumise à validation. Vous recevrez une notification 
              une fois la demande approuvée ou rejetée.
            </Text>
          </View>

          {/* Bouton de soumission */}
          <TouchableOpacity
            style={{
              backgroundColor: submitting ? colors.mutedForeground : colors.primary,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 16,
              borderRadius: 8,
              marginBottom: 20
            }}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>Créer la réservation</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="datetime"
          display="default"
          onChange={handleStartDateChange}
          minimumDate={new Date()}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="datetime"
          display="default"
          onChange={handleEndDateChange}
          minimumDate={startDate}
        />
      )}
    </SafeAreaView>
  );
}
