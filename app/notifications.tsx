import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    FlatList,
    RefreshControl,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/context/AuthContext';
import { useTheme } from '../lib/context/ThemeContext';
import { Notification, NotificationService } from '../lib/services/notifications';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDarkMode, colors } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
      setupNotificationListeners();
    }
  }, [user]);

  const setupNotificationListeners = () => {
    // Configurer les listeners de notification
    const cleanup = NotificationService.setupNotificationListeners();
    return cleanup;
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const unreadNotifications = await NotificationService.getUnreadNotifications();
      setNotifications(unreadNotifications);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const success = await NotificationService.markAsRead(notificationId);
      if (success) {
        // Retirer la notification de la liste
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const count = await NotificationService.markAllAsRead();
      if (count > 0) {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Marquer comme lu
    await markAsRead(notification.id);

    // Naviguer vers l'écran approprié
    if (notification.notification_type === 'event_created' && notification.related_event_id) {
      router.push(`/events/${notification.related_event_id}`);
    } else if (notification.notification_type === 'message_received' && notification.related_event_id) {
      router.push(`/chat/${notification.related_event_id}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event_created':
        return 'calendar';
      case 'message_received':
        return 'chatbubble';
      case 'event_reminder':
        return 'alarm';
      case 'participant_joined':
        return 'person-add';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'event_created':
        return colors.primary; // blue
      case 'message_received':
        return '#10b981'; // green
      case 'event_reminder':
        return '#f59e0b'; // yellow
      case 'participant_joined':
        return '#8b5cf6'; // purple
      default:
        return isDarkMode ? colors.mutedForeground : '#6b7280'; // gray
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} min`;
    if (diffInMinutes < 1440) return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    return `Il y a ${Math.floor(diffInMinutes / 1440)}j`;
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={{
        backgroundColor: isDarkMode ? colors.card : '#1e293b',
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: getNotificationColor(item.notification_type)
      }}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View 
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            backgroundColor: getNotificationColor(item.notification_type) + '20'
          }}
        >
          <Ionicons 
            name={getNotificationIcon(item.notification_type) as any} 
            size={20} 
            color={getNotificationColor(item.notification_type)} 
          />
        </View>
        
        <View style={{ flex: 1 }}>
          <Text style={{ color: isDarkMode ? colors.foreground : '#FFFFFF', fontWeight: '600', fontSize: 16, marginBottom: 4 }}>
            {item.title}
          </Text>
          <Text style={{ color: isDarkMode ? colors.mutedForeground : '#CBD5E1', fontSize: 14, marginBottom: 8 }}>
            {item.body}
          </Text>
          <Text style={{ color: isDarkMode ? colors.mutedForeground : '#94A3B8', fontSize: 12 }}>
            {formatTime(item.sent_at)}
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={() => markAsRead(item.id)}
          style={{ marginLeft: 8 }}
        >
          <Ionicons name="close" size={20} color={isDarkMode ? colors.mutedForeground : '#6b7280'} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
      <View style={{
        width: 80,
        height: 80,
        backgroundColor: isDarkMode ? colors.input : '#374151',
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16
      }}>
        <Ionicons name="notifications-off" size={40} color={isDarkMode ? colors.mutedForeground : '#9ca3af'} />
      </View>
      <Text style={{ color: isDarkMode ? colors.foreground : '#FFFFFF', fontSize: 20, fontWeight: '600', marginBottom: 8, textAlign: 'center' }}>
        Aucune notification
      </Text>
      <Text style={{ color: isDarkMode ? colors.mutedForeground : '#94A3B8', textAlign: 'center' }}>
        Vous n'avez pas de nouvelles notifications pour le moment.
      </Text>
    </View>
  );

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#0f172a" : "#FFFFFF"} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ color: isDarkMode ? colors.foreground : '#111', fontSize: 20, fontWeight: '600', marginBottom: 16, textAlign: 'center' }}>
            Connectez-vous pour voir vos notifications
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/auth/login')}
            style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={isDarkMode ? "#0f172a" : "#FFFFFF"} />
      
      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: isDarkMode ? colors.card : '#1e293b',
        borderBottomWidth: 1,
        borderBottomColor: isDarkMode ? colors.border : '#334155'
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginRight: 16 }}
          >
            <Ionicons name="arrow-back" size={24} color={isDarkMode ? colors.foreground : '#FFFFFF'} />
          </TouchableOpacity>
          <Text style={{ color: isDarkMode ? colors.foreground : '#FFFFFF', fontSize: 20, fontWeight: 'bold' }}>Notifications</Text>
        </View>
        
        {notifications.length > 0 && (
          <TouchableOpacity
            onPress={markAllAsRead}
            style={{ backgroundColor: isDarkMode ? colors.input : '#374151', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}
          >
            <Text style={{ color: isDarkMode ? colors.mutedForeground : '#CBD5E1', fontSize: 14 }}>Tout marquer comme lu</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ 
          flexGrow: 1,
          paddingTop: notifications.length === 0 ? 0 : 16,
          paddingBottom: 100
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
      
      <SafeAreaView edges={['bottom']} />
    </SafeAreaView>
  );
} 