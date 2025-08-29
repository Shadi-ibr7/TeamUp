import * as FileSystem from 'expo-file-system';
import { supabase } from '../supabase';

export class ChatService {
  // Récupérer les messages d'un événement
  static async getEventMessages(eventId: string) {
    console.log('💬 Récupération des messages pour l\'événement:', eventId);
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          user:users(name, avatar_url)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('❌ Erreur lors de la récupération des messages:', error);
        throw error;
      }
      
      console.log('✅ Messages récupérés:', data?.length || 0);
      return data;
    } catch (error) {
      console.error('❌ Erreur générale lors de la récupération des messages:', error);
      throw error;
    }
  }

  // Envoyer un message
  static async sendMessage(eventId: string, userId: string, content: string) {
    console.log('📤 Envoi d\'un message:', { eventId, userId, content: content.substring(0, 50) + '...' });
    
    try {
      // Vérifier que l'utilisateur est connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }
      
      console.log('👤 Utilisateur connecté:', user.id);
      
      // Vérifier que l'utilisateur participe à l'événement ou en est l'organisateur
      const { data: participation, error: participationError } = await supabase
        .from('event_participants')
        .select('status')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();

      if (participationError && participationError.code !== 'PGRST116') {
        console.error('❌ Erreur lors de la vérification de participation:', participationError);
        // Vérifier si c'est l'organisateur
        const { data: event, error: eventError } = await supabase
          .from('events')
          .select('organizer_id')
          .eq('id', eventId)
          .single();
        
        if (eventError || event.organizer_id !== userId) {
          throw new Error('Vous devez participer à cet événement pour envoyer des messages');
        }
      }
      
      console.log('✅ Permission vérifiée');
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          event_id: eventId,
          user_id: userId,
          content: content,
          message_type: 'text'
        })
        .select(`
          *,
          user:users(name, avatar_url)
        `)
        .single();

      if (error) {
        console.error('❌ Erreur lors de l\'envoi du message:', error);
        throw error;
      }

      console.log('✅ Message envoyé avec succès:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Erreur générale lors de l\'envoi du message:', error);
      throw error;
    }
  }

  // Uploader une image pour le chat
  static async uploadChatImage(eventId: string, userId: string, imageUri: string): Promise<string | null> {
    try {
      console.log('📸 Upload d\'image pour le chat:', { eventId, userId, imageUri });
      
      // Vérifier que le fichier existe
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        throw new Error('Le fichier image n\'existe pas');
      }
      
      console.log('📋 Info fichier:', fileInfo);
      
      // Lire le fichier en base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      console.log('📦 Base64 créé, taille:', base64.length, 'caractères');
      
      // Générer un nom de fichier unique
      const timestamp = Date.now();
      const fileExtension = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `chat/${eventId}/${userId}/image-${timestamp}.${fileExtension}`;
      
      // Détecter le type MIME
      let mimeType = 'image/jpeg';
      if (fileExtension === 'png') mimeType = 'image/png';
      else if (fileExtension === 'webp') mimeType = 'image/webp';
      else if (fileExtension === 'gif') mimeType = 'image/gif';
      
      console.log('🏷️ Type MIME détecté:', mimeType, 'pour le fichier:', fileName);
      
      // Décoder le base64 pour l'upload
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Uploader vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars') // Utiliser le même bucket
        .upload(fileName, bytes, {
          upsert: true,
          contentType: mimeType
        });
      
      if (uploadError) {
        console.error('❌ Erreur d\'upload:', uploadError);
        throw uploadError;
      }
      
      console.log('✅ Upload réussi, récupération de l\'URL publique...');
      
      // Récupérer l'URL publique
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      console.log('🔗 URL publique générée:', data.publicUrl);
      
      return data.publicUrl;
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload d\'image:', error);
      return null;
    }
  }

  // Envoyer un message avec image
  static async sendImageMessage(eventId: string, userId: string, imageUrl: string, caption?: string) {
    console.log('📤 Envoi d\'un message image:', { eventId, userId, imageUrl, caption });
    
    try {
      // Vérifier que l'utilisateur est connecté
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }
      
      // Vérifier les permissions (même logique que sendMessage)
      const { data: participation, error: participationError } = await supabase
        .from('event_participants')
        .select('status')
        .eq('event_id', eventId)
        .eq('user_id', userId)
        .single();

      if (participationError && participationError.code !== 'PGRST116') {
        const { data: event, error: eventError } = await supabase
          .from('events')
          .select('organizer_id')
          .eq('id', eventId)
          .single();
        
        if (eventError || event.organizer_id !== userId) {
          throw new Error('Vous devez participer à cet événement pour envoyer des messages');
        }
      }
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          event_id: eventId,
          user_id: userId,
          content: caption || '',
          message_type: 'image',
          image_url: imageUrl
        })
        .select(`
          *,
          user:users(name, avatar_url)
        `)
        .single();

      if (error) {
        console.error('❌ Erreur lors de l\'envoi du message image:', error);
        throw error;
      }

      console.log('✅ Message image envoyé avec succès:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message image:', error);
      throw error;
    }
  }

  // Écouter les nouveaux messages en temps réel
  static subscribeToMessages(eventId: string, callback: (message: any) => void) {
    console.log('👂 Abonnement aux messages pour l\'événement:', eventId);
    
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
          console.log('🔔 Nouveau message reçu:', payload.new);
          
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
            console.log('✅ Message avec infos utilisateur:', userMessage);
            callback(userMessage);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Statut de l\'abonnement aux messages:', status);
      });

    return channel;
  }

  // Se désabonner d'un channel
  static unsubscribeFromMessages(channel: any) {
    if (channel) {
      console.log('❌ Désabonnement du canal de messages');
      supabase.removeChannel(channel);
    }
  }

  // Écouter les changements de participants en temps réel
  static subscribeToParticipants(eventId: string, callback: (participant: any) => void) {
    console.log('👂 Abonnement aux participants pour l\'événement:', eventId);
    
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
          console.log('🔔 Changement de participant:', payload);
          callback(payload);
        }
      )
      .subscribe((status) => {
        console.log('📡 Statut de l\'abonnement aux participants:', status);
      });

    return channel;
  }

  // Marquer les messages comme lus
  static async markMessagesAsRead(eventId: string, userId: string) {
    // Cette fonction peut être implémentée si vous ajoutez une table pour les messages lus
    // Pour l'instant, on peut utiliser une approche simple
    console.log('📖 Marquage des messages comme lus:', { eventId, userId });
    return true;
  }

  // Récupérer les événements avec des messages non lus
  static async getEventsWithUnreadMessages(userId: string) {
    console.log('📬 Récupération des événements avec messages non lus pour:', userId);
    
    try {
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
      
      if (error) {
        console.error('❌ Erreur lors de la récupération des événements:', error);
        throw error;
      }
      
      console.log('✅ Événements récupérés:', data?.length || 0);
      return data.map(item => item.event);
    } catch (error) {
      console.error('❌ Erreur générale:', error);
      throw error;
    }
  }

  // Récupérer le dernier message d'un événement
  static async getLastMessage(eventId: string) {
    console.log('📨 Récupération du dernier message pour l\'événement:', eventId);
    
    try {
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
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('❌ Erreur lors de la récupération du dernier message:', error);
        throw error;
      }
      
      console.log('✅ Dernier message récupéré:', data?.id || 'aucun');
      return data;
    } catch (error) {
      console.error('❌ Erreur générale:', error);
      throw error;
    }
  }

  // Compter les messages non lus pour un utilisateur dans un événement
  static async getUnreadCount(eventId: string, userId: string) {
    console.log('🔢 Comptage des messages non lus:', { eventId, userId });
    // Pour l'instant, retourner 0 - peut être implémenté plus tard
    return 0;
  }

  // Définir le statut en ligne d'un utilisateur
  static async setUserOnlineStatus(userId: string, isOnline: boolean) {
    console.log('🟢 Mise à jour du statut en ligne:', { userId, isOnline });
    
    try {
      // Cette fonction peut être implémentée avec une table presence ou directement dans users
      const { error } = await supabase
        .from('users')
        .update({ last_seen: new Date().toISOString() })
        .eq('id', userId);
      
      if (error) {
        console.error('❌ Erreur lors de la mise à jour du statut:', error);
        throw error;
      }
      
      console.log('✅ Statut mis à jour');
      return true;
    } catch (error) {
      console.error('❌ Erreur générale:', error);
      throw error;
    }
  }

  // Récupérer les utilisateurs en ligne pour un événement
  static async getOnlineUsers(eventId: string) {
    console.log('👥 Récupération des utilisateurs en ligne pour l\'événement:', eventId);
    
    try {
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
      
      if (error) {
        console.error('❌ Erreur lors de la récupération des utilisateurs:', error);
        throw error;
      }
      
      // Considérer les utilisateurs comme en ligne s'ils ont été vus dans les 5 dernières minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const onlineUsers = data.map((item: any) => ({
        ...item.user,
        isOnline: new Date(item.user.last_seen || new Date()) > fiveMinutesAgo
      }));
      
      console.log('✅ Utilisateurs en ligne récupérés:', onlineUsers.length);
      return onlineUsers;
    } catch (error) {
      console.error('❌ Erreur générale:', error);
      throw error;
    }
  }
} 