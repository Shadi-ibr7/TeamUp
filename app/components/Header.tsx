import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StatusBar, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../lib/context/AuthContext";
import { useTheme } from "../../lib/context/ThemeContext";
import { NotificationService } from "../../lib/services/notifications";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightComponent?: React.ReactNode;
}

export default function Header({ title, showBack = false, rightComponent }: HeaderProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotificationCount();
      // Recharger le compteur toutes les 30 secondes
      const interval = setInterval(loadNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotificationCount = async () => {
    try {
      const count = await NotificationService.getUnreadCount();
      setNotificationCount(count);
    } catch (error) {
      console.error('Erreur lors du chargement du compteur de notifications:', error);
    }
  };

  const handleNotificationPress = () => {
    router.push('/notifications');
  };

  return (
    <View 
      className={`flex-row items-center justify-between px-4 py-4 border-b ${
        isDark 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-gray-200'
      }`}
    >
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={isDark ? "#1e293b" : "#ffffff"} 
      />
      
      <View className="flex-row items-center flex-1">
        {showBack && (
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3"
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={isDark ? "white" : "black"} 
            />
          </TouchableOpacity>
        )}
        
        <Text 
          className={`text-xl font-bold flex-1 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}
        >
          {title}
        </Text>
      </View>

      <View className="flex-row items-center space-x-3">
        {/* Bouton de notifications */}
        {user && (
          <TouchableOpacity
            onPress={handleNotificationPress}
            className="relative"
          >
            <Ionicons 
              name="notifications" 
              size={24} 
              color={isDark ? "white" : "black"} 
            />
            {notificationCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center">
                <Text className="text-white text-xs font-bold">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Bouton de thème */}
        <TouchableOpacity onPress={toggleTheme}>
          <Ionicons 
            name={isDark ? "sunny" : "moon"} 
            size={24} 
            color={isDark ? "white" : "black"} 
          />
        </TouchableOpacity>

        {/* Composant personnalisé à droite */}
        {rightComponent}
      </View>
    </View>
  );
} 