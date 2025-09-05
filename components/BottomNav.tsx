import { Ionicons } from '@expo/vector-icons';
import { Link, usePathname } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../lib/context/ThemeContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { colors } = useTheme();

  // Cacher la navbar sur les écrans d'auth et de bienvenue
  if (pathname.startsWith('/auth') || pathname.startsWith('/welcome')) {
    return null;
  }

  const isActive = (route: string) => pathname === route;

  return (
    <SafeAreaView edges={['bottom']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
      <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
        <View style={{ backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
            <Link href="/" asChild>
              <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Ionicons name="home" size={24} color={isActive('/') ? colors.primary : colors.mutedForeground} />
                <Text style={{ fontSize: 12, marginTop: 4, fontWeight: isActive('/') ? '600' as const : '400' as const, color: isActive('/') ? colors.primary : colors.mutedForeground }}>Accueil</Text>
              </TouchableOpacity>
            </Link>

            <Link href="/events" asChild>
              <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Ionicons name="calendar-outline" size={24} color={isActive('/events') ? colors.primary : colors.mutedForeground} />
                <Text style={{ fontSize: 12, marginTop: 4, fontWeight: isActive('/events') ? '600' as const : '400' as const, color: isActive('/events') ? colors.primary : colors.mutedForeground }}>Events</Text>
              </TouchableOpacity>
            </Link>

            <Link href="/discover" asChild>
              <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Ionicons name="location-outline" size={24} color={isActive('/discover') ? colors.primary : colors.mutedForeground} />
                <Text style={{ fontSize: 12, marginTop: 4, fontWeight: isActive('/discover') ? '600' as const : '400' as const, color: isActive('/discover') ? colors.primary : colors.mutedForeground }}>Discover</Text>
              </TouchableOpacity>
            </Link>

            <Link href="/chat" asChild>
              <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Ionicons name="chatbubble-outline" size={24} color={isActive('/chat') ? colors.primary : colors.mutedForeground} />
                <Text style={{ fontSize: 12, marginTop: 4, fontWeight: isActive('/chat') ? '600' as const : '400' as const, color: isActive('/chat') ? colors.primary : colors.mutedForeground }}>Chat</Text>
              </TouchableOpacity>
            </Link>

            <Link href="/profile" asChild>
              <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Ionicons name="person-outline" size={24} color={isActive('/profile') ? colors.primary : colors.mutedForeground} />
                <Text style={{ fontSize: 12, marginTop: 4, fontWeight: isActive('/profile') ? '600' as const : '400' as const, color: isActive('/profile') ? colors.primary : colors.mutedForeground }}>Profile</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}


