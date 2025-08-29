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
import { useAuth } from '../../lib/context/AuthContext';
import { ReservationService, ReservationWithEquipment } from '../../lib/services/reservations';

interface ReservationItemProps {
  reservation: ReservationWithEquipment;
  onApprove: () => void;
  onReject: () => void;
}

const ReservationItem: React.FC<ReservationItemProps> = ({ 
  reservation, 
  onApprove, 
  onReject 
}) => {
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
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.reservationCard}>
      <View style={styles.reservationHeader}>
        <View style={styles.reservationInfo}>
          <Text style={styles.equipmentName}>{reservation.equipment.name}</Text>
          <Text style={styles.organizerName}>
            Par {reservation.organizer.name}
          </Text>
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
          <Ionicons name="football" size={16} color="#64748b" />
          <Text style={styles.detailText}>{reservation.sport_type}</Text>
        </View>

        <View style={styles.detailRow}>
          <Ionicons name="people" size={16} color="#64748b" />
          <Text style={styles.detailText}>
            {reservation.max_participants} participants max
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

      {reservation.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={onApprove}
          >
            <Ionicons name="checkmark" size={16} color="#ffffff" />
            <Text style={styles.actionButtonText}>Approuver</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={onReject}
          >
            <Ionicons name="close" size={16} color="#ffffff" />
            <Text style={styles.actionButtonText}>Rejeter</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default function AdminReservationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [reservations, setReservations] = useState<ReservationWithEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    cancelled: 0,
  });

  // Charger les réservations
  const loadReservations = async (refresh = false) => {
    try {
      setLoading(true);
      
      // Charger les réservations en attente
      const pendingReservations = await ReservationService.getPendingReservations();
      setReservations(pendingReservations);

      // Charger les statistiques
      const reservationStats = await ReservationService.getReservationStats();
      setStats(reservationStats);
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error);
      Alert.alert('Erreur', 'Impossible de charger les réservations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initialisation
  useEffect(() => {
    loadReservations();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadReservations(true);
  };

  const handleApprove = async (reservationId: string) => {
    try {
      await ReservationService.updateReservationStatus(reservationId, {
        status: 'approved',
        validated_by: user!.id,
      });

      // Créer une notification
      const reservation = reservations.find(r => r.id === reservationId);
      if (reservation) {
        await ReservationService.createNotification(
          reservationId,
          reservation.organizer.id,
          'status_change',
          'Réservation approuvée',
          `Votre réservation pour ${reservation.equipment.name} a été approuvée.`
        );
      }

      Alert.alert('Succès', 'Réservation approuvée');
      loadReservations();
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      Alert.alert('Erreur', 'Impossible d\'approuver la réservation');
    }
  };

  const handleReject = async (reservationId: string) => {
    Alert.prompt(
      'Motif du rejet',
      'Veuillez indiquer le motif du rejet :',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          onPress: async (reason) => {
            try {
              await ReservationService.updateReservationStatus(reservationId, {
                status: 'rejected',
                validated_by: user!.id,
                rejection_reason: reason || 'Rejeté par l\'administrateur',
              });

              // Créer une notification
              const reservation = reservations.find(r => r.id === reservationId);
              if (reservation) {
                await ReservationService.createNotification(
                  reservationId,
                  reservation.organizer.id,
                  'status_change',
                  'Réservation rejetée',
                  `Votre réservation pour ${reservation.equipment.name} a été rejetée.`
                );
              }

              Alert.alert('Succès', 'Réservation rejetée');
              loadReservations();
            } catch (error) {
              console.error('Erreur lors du rejet:', error);
              Alert.alert('Erreur', 'Impossible de rejeter la réservation');
            }
          }
        }
      ],
      'plain-text'
    );
  };

  const handleAutoValidate = async () => {
    Alert.alert(
      'Validation automatique',
      'Voulez-vous valider automatiquement toutes les réservations en attente ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Valider',
          onPress: async () => {
            try {
              setLoading(true);
              let validatedCount = 0;
              let rejectedCount = 0;

              for (const reservation of reservations) {
                try {
                  await ReservationService.autoValidateReservation(reservation.id);
                  validatedCount++;
                } catch (error) {
                  rejectedCount++;
                }
              }

              Alert.alert(
                'Validation terminée',
                `${validatedCount} réservations approuvées, ${rejectedCount} rejetées`
              );
              loadReservations();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de valider automatiquement les réservations');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleCleanupLocks = async () => {
    try {
      const cleanedCount = await ReservationService.cleanupExpiredLocks();
      Alert.alert('Nettoyage terminé', `${cleanedCount} verrous expirés nettoyés`);
      loadReservations();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de nettoyer les verrous expirés');
    }
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Chargement des réservations...</Text>
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
        <Text style={styles.title}>Administration</Text>
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

      {/* Actions rapides */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionCard} onPress={handleAutoValidate}>
          <Ionicons name="checkmark-circle" size={24} color="#10b981" />
          <Text style={styles.actionCardText}>Validation automatique</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={handleCleanupLocks}>
          <Ionicons name="trash" size={24} color="#f59e0b" />
          <Text style={styles.actionCardText}>Nettoyer les verrous</Text>
        </TouchableOpacity>
      </View>

      {/* Liste des réservations */}
      <FlatList
        data={reservations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ReservationItem
            reservation={item}
            onApprove={() => handleApprove(item.id)}
            onReject={() => handleReject(item.id)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={64} color="#10b981" />
            <Text style={styles.emptyText}>Aucune réservation en attente</Text>
            <Text style={styles.emptySubtext}>
              Toutes les réservations ont été traitées
            </Text>
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
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  actionCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
  },
  actionCardText: {
    fontSize: 12,
    color: '#f8fafc',
    marginLeft: 8,
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
  organizerName: {
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
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
}); 