import { supabase } from '../supabase';

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
  static subscribeToMessages(eventId: string, callback: (message: any) => void) {
    const channel = supabase
      .channel(`event_messages_${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `event_id=eq.${eventId}`
        },
        async (payload) => {
          // Récupérer les infos utilisateur pour le nouveau message
          const { data: userMessage } = await supabase
            .from('messages')
            .select(`
              *,
              user:users(name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();
            
          if (userMessage) {
            callback(userMessage);
          }
        }
      )
      .subscribe();

    return channel;
  }

  // Se désabonner d'un channel
  static unsubscribeFromMessages(channel: any) {
    if (channel) {
      supabase.removeChannel(channel);
    }
  }

  // Écouter les changements de participants en temps réel
  static subscribeToParticipants(eventId: string, callback: (participant: any) => void) {
    const channel = supabase
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

    return channel;
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

  // Récupérer le dernier message d'un événement
  static async getLastMessage(eventId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        user:users(name, avatar_url)
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  }

  // Compter les messages non lus pour un utilisateur dans un événement
  static async getUnreadCount(eventId: string, userId: string) {
    // Pour l'instant, retourner 0 - peut être implémenté plus tard
    return 0;
  }

  // Définir le statut en ligne d'un utilisateur
  static async setUserOnlineStatus(userId: string, isOnline: boolean) {
    // Cette fonction peut être implémentée avec une table presence ou directement dans users
    const { error } = await supabase
      .from('users')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', userId);
    
    if (error) throw error;
    return true;
  }

  // Récupérer les utilisateurs en ligne pour un événement
  static async getOnlineUsers(eventId: string) {
    const { data, error } = await supabase
      .from('event_participants')
      .select(`
        user:users(
          id,
          name,
          avatar_url,
          last_seen
        )
      `)
      .eq('event_id', eventId)
      .eq('status', 'confirmed');
    
    if (error) throw error;
    
    // Considérer les utilisateurs comme en ligne s'ils ont été vus dans les 5 dernières minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    return data.map((item: any) => ({
      ...item.user,
      isOnline: new Date(item.user.last_seen || new Date()) > fiveMinutesAgo
    }));
  }
} 