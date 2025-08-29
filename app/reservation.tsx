import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/context/AuthContext';
import { EquipmentService, PublicEquipment } from '../lib/services/equipments';
import { CreateReservationRequest, ReservationService } from '../lib/services/reservations';

export default function ReservationScreen() {
  const router = useRouter();
  const { equipmentId } = useLocalSearchParams<{ equipmentId: string }>();
  const { user } = useAuth();
  
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
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Chargement du terrain...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!equipment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.errorText}>Terrain non trouvé</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.title}>Réserver un terrain</Text>
        </View>

        {/* Détails du terrain */}
        <View style={styles.terrainCard}>
          <Text style={styles.terrainName}>{equipment.name}</Text>
          <Text style={styles.terrainType}>{equipment.type}</Text>
          
          <View style={styles.terrainDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="location" size={16} color="#64748b" />
              <Text style={styles.detailText}>
                {equipment.address}, {equipment.city} ({equipment.department})
              </Text>
            </View>
            
            {equipment.manager_name && (
              <View style={styles.detailRow}>
                <Ionicons name="business" size={16} color="#64748b" />
                <Text style={styles.detailText}>{equipment.manager_name}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Formulaire de réservation */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>Détails de la réservation</Text>

          {/* Type de sport */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Type de sport *</Text>
            <TextInput
              style={styles.textInput}
              value={sportType}
              onChangeText={setSportType}
              placeholder="Ex: Football, Tennis, Basketball..."
              placeholderTextColor="#64748b"
            />
          </View>

          {/* Date et heure de début */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date et heure de début *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Ionicons name="calendar" size={20} color="#3b82f6" />
              <Text style={styles.dateButtonText}>
                {formatDate(startDate)} à {formatTime(startDate)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Date et heure de fin */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Date et heure de fin *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndPicker(true)}
            >
              <Ionicons name="calendar" size={20} color="#3b82f6" />
              <Text style={styles.dateButtonText}>
                {formatDate(endDate)} à {formatTime(endDate)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Nombre de participants */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre maximum de participants</Text>
            <TextInput
              style={styles.textInput}
              value={maxParticipants}
              onChangeText={setMaxParticipants}
              keyboardType="numeric"
              placeholder="10"
              placeholderTextColor="#64748b"
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description (optionnel)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez votre événement..."
              placeholderTextColor="#64748b"
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Informations importantes */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <Text style={styles.infoText}>
              Votre réservation sera soumise à validation. Vous recevrez une notification 
              une fois la demande approuvée ou rejetée.
            </Text>
          </View>

          {/* Bouton de soumission */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                <Text style={styles.submitButtonText}>Créer la réservation</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  terrainCard: {
    backgroundColor: '#1e293b',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  terrainName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  terrainType: {
    fontSize: 14,
    color: '#3b82f6',
    marginBottom: 12,
  },
  terrainDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
    flex: 1,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f8fafc',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateButtonText: {
    color: '#f8fafc',
    fontSize: 16,
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    color: '#64748b',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#64748b',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginTop: 16,
  },
}); 