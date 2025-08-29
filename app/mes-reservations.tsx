import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/context/AuthContext';
import { ReservationService, ReservationWithEquipment } from '../lib/services/reservations';

interface ReservationItemProps {
  reservation: ReservationWithEquipment;
  onPress: () => void;
}

const ReservationItem: React.FC<ReservationItemProps> = ({ reservation, onPress }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'cancelled': return '#f59e0b';
      default: return '#3b82f6';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return 'checkmark-circle';
      case 'rejected': return 'close-circle';
      case 'cancelled': return 'time';
      default: return 'time-outline';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TouchableOpacity style={styles.reservationCard} onPress={onPress}>
      <View style={styles.reservationHeader}>
        <View style={styles.reservationInfo}>
          <Text style={styles.equipmentName}>{reservation.equipment.name}</Text>
          <Text style={styles.sportType}>{reservation.sport_type}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(reservation.status) }]}>
          <Ionicons name={getStatusIcon(reservation.status) as any} size={16} color="#ffffff" />
          <Text style={styles.statusText}>{reservation.status}</Text>
        </View>
      </View>

      <View style={styles.reservationDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar" size={16} color="#64748b" />
          <Text style={styles.detailText}>
            {formatDate(reservation.start_time)} - {formatDate(reservation.end_time)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="people" size={16} color="#64748b" />
          <Text style={styles.detailText}>
            {reservation.max_participants} participants max
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color="#64748b" />
          <Text style={styles.detailText}>
            {reservation.equipment.address}, {reservation.equipment.city}
          </Text>
        </View>

        {reservation.description && (
          <View style={styles.detailRow}>
            <Ionicons name="document-text" size={16} color="#64748b" />
            <Text style={styles.detailText}>{reservation.description}</Text>
          </View>
        )}

        {reservation.rejection_reason && (
          <View style={styles.rejectionReason}>
            <Ionicons name="alert-circle" size={16} color="#ef4444" />
            <Text style={styles.rejectionText}>{reservation.rejection_reason}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function MesReservationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [reservations, setReservations] = useState<ReservationWithEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Charger les réservations
  const loadReservations = async (refresh = false) => {
    if (!user) return;

    try {
      setLoading(true);
      const userReservations = await ReservationService.getUserReservations(user.id);
      setReservations(userReservations);
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error);
      Alert.alert('Erreur', 'Impossible de charger vos réservations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initialisation
  useEffect(() => {
    loadReservations();
  }, [user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadReservations(true);
  };

  const handleReservationPress = (reservation: ReservationWithEquipment) => {
    Alert.alert(
      reservation.equipment.name,
      `Statut: ${reservation.status}\n\nVoulez-vous créer un événement sur ce terrain ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Créer un événement',
          onPress: () => {
            router.push({
              pathname: '/create-event',
              params: {
                terrainId: reservation.equipment.id,
                terrainName: reservation.equipment.name,
                terrainAddress: reservation.equipment.address || reservation.equipment.city
              }
            });
          }
        }
      ]
    );
  };

  const getStats = () => {
    const total = reservations.length;
    const pending = reservations.filter(r => r.status === 'pending').length;
    const approved = reservations.filter(r => r.status === 'approved').length;
    const rejected = reservations.filter(r => r.status === 'rejected').length;

    return { total, pending, approved, rejected };
  };

  const stats = getStats();

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Chargement de vos réservations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.title}>Mes Réservations</Text>
        <TouchableOpacity style={styles.syncButton} onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Statistiques */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#3b82f6' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>En attente</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#10b981' }]}>{stats.approved}</Text>
          <Text style={styles.statLabel}>Approuvées</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#ef4444' }]}>{stats.rejected}</Text>
          <Text style={styles.statLabel}>Rejetées</Text>
        </View>
      </View>

      {/* Liste des réservations */}
      <FlatList
        data={reservations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ReservationItem
            reservation={item}
            onPress={() => handleReservationPress(item)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#64748b" />
            <Text style={styles.emptyText}>Aucune réservation</Text>
            <Text style={styles.emptySubtext}>
              Vous n'avez pas encore de réservations de terrains publics
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/create-event')}
            >
              <Ionicons name="add" size={20} color="#ffffff" />
              <Text style={styles.createButtonText}>Créer un événement</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  syncButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  reservationCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reservationInfo: {
    flex: 1,
  },
  equipmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
  },
  sportType: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#ffffff',
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  reservationDetails: {
    marginBottom: 12,
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
  rejectionReason: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  rejectionText: {
    fontSize: 12,
    color: '#ef4444',
    marginLeft: 8,
    flex: 1,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
}); 