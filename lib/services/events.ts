import { Event, supabase } from '../supabase';

export class EventService {
  // Récupérer tous les événements
  static async getEvents() {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:users(name, avatar_url),
        participants:event_participants(
          user_id,
          status,
          user:users(name, avatar_url)
        )
      `)
      .eq('is_active', true)
      .order('date', { ascending: true })
      .order('time', { ascending: true });

    if (error) throw error;

    return data || [];
  }

  // Récupérer un événement par ID
  static async getEventById(id: string) {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        organizer:users(name, avatar_url),
        participants:event_participants(
          user_id,
          status,
          user:users(name, avatar_url)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Créer un nouvel événement
  static async createEvent(eventData: Omit<Event, 'id' | 'created_at' | 'current_participants'>) {
    const { data, error } = await supabase
      .from('events')
      .insert([{
        ...eventData,
        current_participants: 1, // L'organisateur compte comme participant
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Mettre à jour un événement
  static async updateEvent(eventId: string, userId: string, updates: Partial<Omit<Event, 'id' | 'created_at' | 'current_participants' | 'organizer_id'>>) {
    // Vérifier que l'utilisateur est bien l'organisateur
    const { data: event, error: fetchError } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', eventId)
      .single();

    if (fetchError) throw fetchError;
    if (event.organizer_id !== userId) {
      throw new Error('Vous n\'êtes pas autorisé à modifier cet événement');
    }

    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', eventId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Rejoindre un événement
  static async joinEvent(eventId: string, userId: string) {
    // Vérifier si l'utilisateur n'est pas déjà inscrit
    const { data: existing } = await supabase
      .from('event_participants')
      .select()
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      throw new Error('Vous êtes déjà inscrit à cet événement');
    }

    // Ajouter le participant
    const { data, error } = await supabase
      .from('event_participants')
      .insert([{
        event_id: eventId,
        user_id: userId,
        status: 'confirmed'
      }])
      .select()
      .single();
    
    if (error) throw error;

    // Incrémenter le nombre de participants
    await supabase.rpc('increment_participants', { event_id: eventId });
    
    return data;
  }

  // Quitter un événement
  static async leaveEvent(eventId: string, userId: string) {
    const { error } = await supabase
      .from('event_participants')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId);
    
    if (error) throw error;

    // Décrémenter le nombre de participants
    await supabase.rpc('decrement_participants', { event_id: eventId });
  }

  // Supprimer un événement (seulement pour l'organisateur)
  static async deleteEvent(eventId: string, userId: string) {
    console.log('🗑️ Tentative de suppression de l\'événement:', eventId, 'par l\'utilisateur:', userId);
    
    try {
      // Vérifier que l'utilisateur est bien l'organisateur
      const { data: event, error: fetchError } = await supabase
        .from('events')
        .select('organizer_id, title')
        .eq('id', eventId)
        .single();

      if (fetchError) {
        console.error('❌ Erreur lors de la récupération de l\'événement:', fetchError);
        throw fetchError;
      }
      
      if (!event) {
        throw new Error('Événement non trouvé');
      }
      
      console.log('📋 Événement trouvé:', event.title, 'Organisateur:', event.organizer_id);
      
      if (event.organizer_id !== userId) {
        console.error('❌ Utilisateur non autorisé:', userId, 'vs organisateur:', event.organizer_id);
        throw new Error('Vous n\'êtes pas autorisé à supprimer cet événement');
      }

      console.log('✅ Autorisation vérifiée, suppression des participants...');

      // Supprimer d'abord tous les participants
      const { error: participantsError } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId);

      if (participantsError) {
        console.error('❌ Erreur lors de la suppression des participants:', participantsError);
        throw participantsError;
      }

      console.log('✅ Participants supprimés, suppression de l\'événement...');

      // Supprimer l'événement
      const { error: eventError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (eventError) {
        console.error('❌ Erreur lors de la suppression de l\'événement:', eventError);
        throw eventError;
      }

      console.log('✅ Événement supprimé avec succès:', eventId);
    } catch (error) {
      console.error('❌ Erreur générale lors de la suppression:', error);
      throw error;
    }
  }

  // Rechercher des événements par localisation
  static async searchEventsNearby(lat: number, lng: number, radius: number = 10) {
    const { data, error } = await supabase
      .rpc('events_nearby', {
        lat: lat,
        lng: lng,
        radius_km: radius
      });
    
    if (error) throw error;
    return data;
  }

  // Récupérer les événements d'un utilisateur
  static async getUserEvents(userId: string) {
    const { data, error } = await supabase
      .from('event_participants')
      .select(`
        event:events(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'confirmed');
    
    if (error) throw error;
    return data.map(item => item.event);
  }

  // Récupérer les événements créés par un utilisateur
  static async getUserCreatedEvents(userId: string) {
    const { data, error } = await supabase
      .from('events')
      .select(`
        *,
        participants:event_participants(
          user_id,
          status,
          user:users(name, avatar_url)
        )
      `)
      .eq('organizer_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
} 