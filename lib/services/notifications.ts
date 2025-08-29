import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { supabase } from '../supabase';

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationToken {
  id: string;
  user_id: string;
  device_token: string;
  device_type: 'ios' | 'android' | 'web';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  data: any;
  notification_type: 'event_created' | 'message_received' | 'event_reminder' | 'participant_joined';
  related_event_id?: string;
  related_message_id?: string;
  is_read: boolean;
  sent_at: string;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  event_notifications: boolean;
  message_notifications: boolean;
  event_reminders: boolean;
  participant_updates: boolean;
  created_at: string;
  updated_at: string;
}

export class NotificationService {
  // Demander les permissions de notification
  static async requestPermissions(): Promise<boolean> {
    try {
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.log('❌ Permissions de notification refusées');
          return false;
        }
        
        console.log('✅ Permissions de notification accordées');
        return true;
      } else {
        console.log('⚠️ Pas d\'appareil physique, notifications simulées');
        return false;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la demande de permissions:', error);
      return false;
    }
  }

  // Obtenir le token de notification
  static async getNotificationToken(): Promise<string | null> {
    try {
      const hasPermissions = await this.requestPermissions();
      if (!hasPermissions) return null;

      // Vérifier si le Project ID est configuré
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId || projectId === 'your-project-id-here') {
        console.log('⚠️ Project ID EAS non configuré, notifications locales uniquement');
        return 'local-notification-token';
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });

      console.log('📱 Token de notification obtenu:', token.data);
      return token.data;
    } catch (error) {
      console.error('❌ Erreur lors de l\'obtention du token:', error);
      // Retourner un token local en cas d'erreur
      return 'local-notification-token';
    }
  }

  // Enregistrer le token de notification
  static async registerNotificationToken(userId: string): Promise<boolean> {
    try {
      const token = await this.getNotificationToken();
      if (!token) return false;

      const deviceType = Platform.OS as 'ios' | 'android' | 'web';

      const { error } = await supabase
        .from('user_notification_tokens')
        .upsert({
          user_id: userId,
          device_token: token,
          device_type: deviceType,
          is_active: true,
        }, {
          onConflict: 'user_id,device_token'
        });

      if (error) {
        console.error('❌ Erreur lors de l\'enregistrement du token:', error);
        return false;
      }

      console.log('✅ Token de notification enregistré');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement du token:', error);
      return false;
    }
  }

  // Supprimer le token de notification
  static async unregisterNotificationToken(userId: string): Promise<boolean> {
    try {
      const token = await this.getNotificationToken();
      if (!token) return true; // Pas de token à supprimer

      const { error } = await supabase
        .from('user_notification_tokens')
        .delete()
        .eq('user_id', userId)
        .eq('device_token', token);

      if (error) {
        console.error('❌ Erreur lors de la suppression du token:', error);
        return false;
      }

      console.log('✅ Token de notification supprimé');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la suppression du token:', error);
      return false;
    }
  }

  // Obtenir les notifications non lues
  static async getUnreadNotifications(): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_unread_notifications');

      if (error) {
        console.error('❌ Erreur lors de la récupération des notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des notifications:', error);
      return [];
    }
  }

  // Obtenir le nombre de notifications non lues
  static async getUnreadCount(): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('get_unread_notifications_count');

      if (error) {
        console.error('❌ Erreur lors du comptage des notifications:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('❌ Erreur lors du comptage des notifications:', error);
      return 0;
    }
  }

  // Marquer une notification comme lue
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .rpc('mark_notification_as_read', { notification_uuid: notificationId });

      if (error) {
        console.error('❌ Erreur lors du marquage comme lu:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur lors du marquage comme lu:', error);
      return false;
    }
  }

  // Marquer toutes les notifications comme lues
  static async markAllAsRead(): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('mark_all_notifications_as_read');

      if (error) {
        console.error('❌ Erreur lors du marquage comme lu:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('❌ Erreur lors du marquage comme lu:', error);
      return 0;
    }
  }

  // Obtenir les préférences de notification
  static async getNotificationPreferences(): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .single();

      if (error) {
        console.error('❌ Erreur lors de la récupération des préférences:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des préférences:', error);
      return null;
    }
  }

  // Mettre à jour les préférences de notification
  static async updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_notification_preferences')
        .update(preferences)
        .eq('user_id', preferences.user_id);

      if (error) {
        console.error('❌ Erreur lors de la mise à jour des préférences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des préférences:', error);
      return false;
    }
  }

  // Configurer les listeners de notification
  static setupNotificationListeners() {
    // Listener pour les notifications reçues quand l'app est ouverte
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📱 Notification reçue:', notification);
    });

    // Listener pour les notifications cliquées
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📱 Notification cliquée:', response);
      
      // Traiter la notification cliquée
      const data = response.notification.request.content.data;
      this.handleNotificationTap(data);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }

  // Traiter le clic sur une notification
  static handleNotificationTap(data: any) {
    console.log('🔔 Traitement du clic sur notification:', data);
    
    // Ici vous pouvez naviguer vers l'écran approprié
    // Par exemple, si c'est un message, aller vers le chat
    // Si c'est un événement, aller vers les détails de l'événement
    
    if (data.event_id) {
      // Naviguer vers l'événement
      console.log('🎯 Navigation vers l\'événement:', data.event_id);
    }
    
    if (data.message_id) {
      // Naviguer vers le chat
      console.log('💬 Navigation vers le chat:', data.event_id);
    }
  }

  // Envoyer une notification locale (pour les tests)
  static async sendLocalNotification(title: string, body: string, data?: any) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
        },
        trigger: null, // Immédiat
      });
      
      console.log('📱 Notification locale envoyée');
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la notification locale:', error);
    }
  }
} 