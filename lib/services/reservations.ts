import { supabase } from '../supabase';
import { PublicEquipment } from './equipments';

// Types pour les réservations
export interface PublicReservation {
  id: string;
  equipment_id: string;
  organizer_id: string;
  start_time: string;
  end_time: string;
  sport_type: string;
  description?: string;
  max_participants: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  validation_mode: 'automatic' | 'manual';
  validated_by?: string;
  validated_at?: string;
  rejection_reason?: string;
  lock_expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReservationRequest {
  equipment_id: string;
  organizer_id: string;
  start_time: string;
  end_time: string;
  sport_type: string;
  description?: string;
  max_participants?: number;
}

export interface UpdateReservationStatusRequest {
  status: 'approved' | 'rejected';
  validated_by: string;
  rejection_reason?: string;
}

export interface ReservationWithEquipment extends PublicReservation {
  equipment: PublicEquipment;
  organizer: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ReservationNotification {
  id: string;
  reservation_id: string;
  user_id: string;
  type: 'status_change' | 'reminder' | 'confirmation';
  title: string;
  message: string;
  is_read: boolean;
  sent_at: string;
}

export class ReservationService {
  /**
   * Crée une nouvelle réservation avec vérification de conflits
   */
  static async createReservation(request: CreateReservationRequest): Promise<PublicReservation> {
    const { data, error } = await supabase.rpc('create_reservation_with_lock', {
      p_equipment_id: request.equipment_id,
      p_organizer_id: request.organizer_id,
      p_start_time: request.start_time,
      p_end_time: request.end_time,
      p_sport_type: request.sport_type,
      p_description: request.description,
      p_max_participants: request.max_participants || 10,
      p_lock_duration_minutes: 10
    });

    if (error) {
      console.error('Erreur lors de la création de la réservation:', error);
      throw new Error(error.message || 'Impossible de créer la réservation');
    }

    // Récupérer la réservation créée
    const reservation = await this.getReservationById(data);
    if (!reservation) {
      throw new Error('Réservation créée mais impossible de la récupérer');
    }

    return reservation;
  }

  /**
   * Récupère une réservation par son ID
   */
  static async getReservationById(id: string): Promise<PublicReservation | null> {
    const { data, error } = await supabase
      .from('public_reservations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération de la réservation:', error);
      return null;
    }

    return data;
  }

  /**
   * Récupère une réservation avec les détails de l'équipement et de l'organisateur
   */
  static async getReservationWithDetails(id: string): Promise<ReservationWithEquipment | null> {
    const { data, error } = await supabase
      .from('public_reservations')
      .select(`
        *,
        equipment:public_equipments(*),
        organizer:users(id, name, email)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération de la réservation:', error);
      return null;
    }

    return data as ReservationWithEquipment;
  }

  /**
   * Récupère les réservations d'un utilisateur
   */
  static async getUserReservations(userId: string): Promise<ReservationWithEquipment[]> {
    const { data, error } = await supabase
      .from('public_reservations')
      .select(`
        *,
        equipment:public_equipments(*),
        organizer:users(id, name, email)
      `)
      .eq('organizer_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des réservations:', error);
      throw new Error('Impossible de récupérer les réservations');
    }

    return data as ReservationWithEquipment[] || [];
  }

  /**
   * Récupère les réservations d'un équipement
   */
  static async getEquipmentReservations(equipmentId: string): Promise<PublicReservation[]> {
    const { data, error } = await supabase
      .from('public_reservations')
      .select('*')
      .eq('equipment_id', equipmentId)
      .order('start_time');

    if (error) {
      console.error('Erreur lors de la récupération des réservations:', error);
      throw new Error('Impossible de récupérer les réservations de l\'équipement');
    }

    return data || [];
  }

  /**
   * Met à jour le statut d'une réservation
   */
  static async updateReservationStatus(
    reservationId: string,
    request: UpdateReservationStatusRequest
  ): Promise<PublicReservation> {
    const { error } = await supabase.rpc('update_reservation_status', {
      p_reservation_id: reservationId,
      p_new_status: request.status,
      p_validated_by: request.validated_by,
      p_rejection_reason: request.rejection_reason
    });

    if (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw new Error(error.message || 'Impossible de mettre à jour le statut');
    }

    // Récupérer la réservation mise à jour
    const reservation = await this.getReservationById(reservationId);
    if (!reservation) {
      throw new Error('Réservation mise à jour mais impossible de la récupérer');
    }

    return reservation;
  }

  /**
   * Valide automatiquement une réservation selon des règles simples
   */
  static async autoValidateReservation(reservationId: string): Promise<PublicReservation> {
    const reservation = await this.getReservationById(reservationId);
    if (!reservation) {
      throw new Error('Réservation non trouvée');
    }

    // Règles de validation automatique
    const now = new Date();
    const startTime = new Date(reservation.start_time);
    const endTime = new Date(reservation.end_time);

    // Vérifier que la réservation est dans le futur
    if (startTime <= now) {
      return this.updateReservationStatus(reservationId, {
        status: 'rejected',
        validated_by: reservation.organizer_id,
        rejection_reason: 'La réservation doit être dans le futur'
      });
    }

    // Vérifier que la durée est raisonnable (max 4 heures)
    const durationHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
    if (durationHours > 4) {
      return this.updateReservationStatus(reservationId, {
        status: 'rejected',
        validated_by: reservation.organizer_id,
        rejection_reason: 'La durée maximale autorisée est de 4 heures'
      });
    }

    // Vérifier les conflits
    const conflicts = await this.checkReservationConflicts(
      reservation.equipment_id,
      reservation.start_time,
      reservation.end_time,
      reservationId
    );

    if (conflicts) {
      return this.updateReservationStatus(reservationId, {
        status: 'rejected',
        validated_by: reservation.organizer_id,
        rejection_reason: 'Conflit avec une autre réservation'
      });
    }

    // Validation automatique réussie
    return this.updateReservationStatus(reservationId, {
      status: 'approved',
      validated_by: reservation.organizer_id
    });
  }

  /**
   * Vérifie les conflits de réservation
   */
  static async checkReservationConflicts(
    equipmentId: string,
    startTime: string,
    endTime: string,
    excludeReservationId?: string
  ): Promise<boolean> {
    const { data, error } = await supabase.rpc('check_reservation_conflicts', {
      p_equipment_id: equipmentId,
      p_start_time: startTime,
      p_end_time: endTime,
      p_exclude_reservation_id: excludeReservationId
    });

    if (error) {
      console.error('Erreur lors de la vérification des conflits:', error);
      throw new Error('Impossible de vérifier les conflits');
    }

    return data;
  }

  /**
   * Nettoie les verrous expirés
   */
  static async cleanupExpiredLocks(): Promise<number> {
    const { data, error } = await supabase.rpc('cleanup_expired_locks');

    if (error) {
      console.error('Erreur lors du nettoyage des verrous:', error);
      throw new Error('Impossible de nettoyer les verrous expirés');
    }

    return data || 0;
  }

  /**
   * Crée une notification pour une réservation
   */
  static async createNotification(
    reservationId: string,
    userId: string,
    type: 'status_change' | 'reminder' | 'confirmation',
    title: string,
    message: string
  ): Promise<ReservationNotification> {
    const { data, error } = await supabase
      .from('reservation_notifications')
      .insert({
        reservation_id: reservationId,
        user_id: userId,
        type,
        title,
        message
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur lors de la création de la notification:', error);
      throw new Error('Impossible de créer la notification');
    }

    return data;
  }

  /**
   * Récupère les notifications d'un utilisateur
   */
  static async getUserNotifications(userId: string): Promise<ReservationNotification[]> {
    const { data, error } = await supabase
      .from('reservation_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      throw new Error('Impossible de récupérer les notifications');
    }

    return data || [];
  }

  /**
   * Marque une notification comme lue
   */
  static async markNotificationAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('reservation_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Erreur lors de la mise à jour de la notification:', error);
      throw new Error('Impossible de marquer la notification comme lue');
    }
  }

  /**
   * Récupère les réservations en attente de validation
   */
  static async getPendingReservations(): Promise<ReservationWithEquipment[]> {
    const { data, error } = await supabase
      .from('public_reservations')
      .select(`
        *,
        equipment:public_equipments(*),
        organizer:users(id, name, email)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur lors de la récupération des réservations en attente:', error);
      throw new Error('Impossible de récupérer les réservations en attente');
    }

    return data as ReservationWithEquipment[] || [];
  }

  /**
   * Récupère les statistiques de réservation
   */
  static async getReservationStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    cancelled: number;
  }> {
    const { data, error } = await supabase
      .from('public_reservations')
      .select('status');

    if (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw new Error('Impossible de récupérer les statistiques');
    }

    const stats = {
      total: data?.length || 0,
      pending: data?.filter(r => r.status === 'pending').length || 0,
      approved: data?.filter(r => r.status === 'approved').length || 0,
      rejected: data?.filter(r => r.status === 'rejected').length || 0,
      cancelled: data?.filter(r => r.status === 'cancelled').length || 0,
    };

    return stats;
  }
} 