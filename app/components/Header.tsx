import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from "../../lib/context/ThemeContext";

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightAction?: {
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  };
  showThemeToggle?: boolean;
}

export default function Header({ title, showBackButton = false, onBackPress, rightAction, showThemeToggle = true }: HeaderProps) {
  const { isDarkMode, toggleTheme, colors } = useTheme();

  return (
    <LinearGradient
      colors={colors.backgroundGradient}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {showBackButton && (
          <TouchableOpacity onPress={onBackPress} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground }}>{title}</Text>
      </View>
      
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {showThemeToggle && (
          <TouchableOpacity 
            onPress={toggleTheme} 
            style={{ 
              width: 36, 
              height: 36, 
              borderRadius: 18, 
              backgroundColor: colors.card, 
              alignItems: 'center', 
              justifyContent: 'center', 
              borderWidth: 1, 
              borderColor: colors.border,
              marginRight: rightAction ? 8 : 0
            }}
          >
            <Ionicons 
              name={isDarkMode ? "sunny" : "moon"} 
              size={18} 
              color={colors.foreground} 
            />
          </TouchableOpacity>
        )}
        
        {rightAction && (
          <TouchableOpacity 
            onPress={rightAction.onPress}
            style={{ 
              width: 36, 
              height: 36, 
              borderRadius: 18, 
              backgroundColor: colors.card, 
              alignItems: 'center', 
              justifyContent: 'center', 
              borderWidth: 1, 
              borderColor: colors.border
            }}
          >
            <Ionicons name={rightAction.icon} size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  );
}

export function BottomNav({ activeTab }: { activeTab: 'home' | 'events' | 'discover' | 'chat' | 'profile' }) {
  const { colors } = useTheme();

  return (
    <View style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.background }}>
      <View style={{ 
        backgroundColor: colors.card, 
        borderRadius: 16, 
        borderWidth: 1, 
        borderColor: colors.border, 
        padding: 8 
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
          <Link href="/" asChild>
            <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Ionicons 
                name="home" 
                size={24} 
                color={activeTab === 'home' ? colors.primary : colors.muted} 
              />
              <Text style={{ 
                fontSize: 12, 
                marginTop: 4, 
                fontWeight: activeTab === 'home' ? '600' : '400', 
                color: activeTab === 'home' ? colors.primary : colors.muted 
              }}>
                Home
              </Text>
            </TouchableOpacity>
          </Link>
          <Link href="/events" asChild>
            <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Ionicons 
                name="calendar-outline" 
                size={24} 
                color={activeTab === 'events' ? colors.primary : colors.muted} 
              />
              <Text style={{ 
                fontSize: 12, 
                marginTop: 4, 
                fontWeight: activeTab === 'events' ? '600' : '400', 
                color: activeTab === 'events' ? colors.primary : colors.muted 
              }}>
                Events
              </Text>
            </TouchableOpacity>
          </Link>
          <Link href="/discover" asChild>
            <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Ionicons 
                name="location-outline" 
                size={24} 
                color={activeTab === 'discover' ? colors.primary : colors.muted} 
              />
              <Text style={{ 
                fontSize: 12, 
                marginTop: 4, 
                fontWeight: activeTab === 'discover' ? '600' : '400', 
                color: activeTab === 'discover' ? colors.primary : colors.muted 
              }}>
                Discover
              </Text>
            </TouchableOpacity>
          </Link>
          <Link href="/chat" asChild>
            <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Ionicons 
                name="chatbubble-outline" 
                size={24} 
                color={activeTab === 'chat' ? colors.primary : colors.muted} 
              />
              <Text style={{ 
                fontSize: 12, 
                marginTop: 4, 
                fontWeight: activeTab === 'chat' ? '600' : '400', 
                color: activeTab === 'chat' ? colors.primary : colors.muted 
              }}>
                Chat
              </Text>
            </TouchableOpacity>
          </Link>
          <Link href="/profile" asChild>
            <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 8 }}>
              <Ionicons 
                name="person-outline" 
                size={24} 
                color={activeTab === 'profile' ? colors.primary : colors.muted} 
              />
              <Text style={{ 
                fontSize: 12, 
                marginTop: 4, 
                fontWeight: activeTab === 'profile' ? '600' : '400', 
                color: activeTab === 'profile' ? colors.primary : colors.muted 
              }}>
                Profile
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
} 