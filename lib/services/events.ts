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
      .order('date', { ascending: true });
    
    if (error) throw error;
    return data;
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
} 