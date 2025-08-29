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
import { Notification, NotificationService } from '../lib/services/notifications';

export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
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
        return '#3b82f6'; // blue
      case 'message_received':
        return '#10b981'; // green
      case 'event_reminder':
        return '#f59e0b'; // yellow
      case 'participant_joined':
        return '#8b5cf6'; // purple
      default:
        return '#6b7280'; // gray
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
      className="bg-slate-800 mx-4 mb-3 rounded-lg p-4 border-l-4"
      style={{ borderLeftColor: getNotificationColor(item.notification_type) }}
      onPress={() => handleNotificationPress(item)}
    >
      <View className="flex-row items-start">
        <View 
          className="w-10 h-10 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: getNotificationColor(item.notification_type) + '20' }}
        >
          <Ionicons 
            name={getNotificationIcon(item.notification_type) as any} 
            size={20} 
            color={getNotificationColor(item.notification_type)} 
          />
        </View>
        
        <View className="flex-1">
          <Text className="text-white font-semibold text-base mb-1">
            {item.title}
          </Text>
          <Text className="text-slate-300 text-sm mb-2">
            {item.body}
          </Text>
          <Text className="text-slate-500 text-xs">
            {formatTime(item.sent_at)}
          </Text>
        </View>
        
        <TouchableOpacity
          onPress={() => markAsRead(item.id)}
          className="ml-2"
        >
          <Ionicons name="close" size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8">
      <View className="w-20 h-20 bg-slate-700 rounded-full items-center justify-center mb-4">
        <Ionicons name="notifications-off" size={40} color="#9ca3af" />
      </View>
      <Text className="text-white text-xl font-semibold mb-2 text-center">
        Aucune notification
      </Text>
      <Text className="text-slate-400 text-center">
        Vous n'avez pas de nouvelles notifications pour le moment.
      </Text>
    </View>
  );

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900" edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-white text-xl font-semibold mb-4">
            Connectez-vous pour voir vos notifications
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/auth/login')}
            className="bg-blue-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Se connecter</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-slate-800 border-b border-slate-700">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-4"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Notifications</Text>
        </View>
        
        {notifications.length > 0 && (
          <TouchableOpacity
            onPress={markAllAsRead}
            className="bg-slate-700 px-3 py-1 rounded-lg"
          >
            <Text className="text-slate-300 text-sm">Tout marquer comme lu</Text>
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
            tintColor="#3b82f6"
            colors={['#3b82f6']}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
      
      <SafeAreaView edges={['bottom']} />
    </SafeAreaView>
  );
} 