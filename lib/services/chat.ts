import { Message, supabase } from '../supabase';

export class ChatService {
  // Récupérer les messages d'un événement
  static async getEventMessages(eventId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        user:users(name, avatar_url)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  // Envoyer un message
  static async sendMessage(eventId: string, userId: string, content: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert([{
        event_id: eventId,
        user_id: userId,
        content
      }])
      .select(`
        *,
        user:users(name, avatar_url)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Écouter les nouveaux messages en temps réel
  static subscribeToMessages(eventId: string, callback: (message: Message) => void) {
    return supabase
      .channel(`event_messages_${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();
  }

  // Écouter les changements de participants en temps réel
  static subscribeToParticipants(eventId: string, callback: (participant: any) => void) {
    return supabase
      .channel(`event_participants_${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_participants',
          filter: `event_id=eq.${eventId}`
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
  }

  // Marquer les messages comme lus
  static async markMessagesAsRead(eventId: string, userId: string) {
    // Cette fonction peut être implémentée si vous ajoutez une table pour les messages lus
    // Pour l'instant, on peut utiliser une approche simple
    return true;
  }

  // Récupérer les événements avec des messages non lus
  static async getEventsWithUnreadMessages(userId: string) {
    // Cette fonction peut être implémentée pour afficher les notifications
    const { data, error } = await supabase
      .from('event_participants')
      .select(`
        event:events(
          id,
          title,
          sport_type,
          date,
          time
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'confirmed');
    
    if (error) throw error;
    return data.map(item => item.event);
  }
} 