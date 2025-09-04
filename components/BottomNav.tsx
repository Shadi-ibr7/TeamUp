import { Ionicons } from '@expo/vector-icons';
import { Link, usePathname } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BottomNav() {
  const pathname = usePathname();

  // Cacher la navbar sur les écrans d'auth et de bienvenue
  if (pathname.startsWith('/auth') || pathname.startsWith('/welcome')) {
    return null;
  }

  const isActive = (route: string) => pathname === route;

  return (
    <SafeAreaView edges={['bottom']} style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
      <View style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)', padding: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
            <Link href="/" asChild>
              <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Ionicons name="home" size={24} color={isActive('/') ? '#007AFF' : '#666'} />
                <Text style={{ fontSize: 12, marginTop: 4, fontWeight: isActive('/') ? '600' as const : '400' as const, color: isActive('/') ? '#007AFF' : '#666' }}>Home</Text>
              </TouchableOpacity>
            </Link>

            <Link href="/events" asChild>
              <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Ionicons name="calendar-outline" size={24} color={isActive('/events') ? '#007AFF' : '#666'} />
                <Text style={{ fontSize: 12, marginTop: 4, fontWeight: isActive('/events') ? '600' as const : '400' as const, color: isActive('/events') ? '#007AFF' : '#666' }}>Events</Text>
              </TouchableOpacity>
            </Link>

            <Link href="/discover" asChild>
              <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Ionicons name="location-outline" size={24} color={isActive('/discover') ? '#007AFF' : '#666'} />
                <Text style={{ fontSize: 12, marginTop: 4, fontWeight: isActive('/discover') ? '600' as const : '400' as const, color: isActive('/discover') ? '#007AFF' : '#666' }}>Discover</Text>
              </TouchableOpacity>
            </Link>

            <Link href="/chat" asChild>
              <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Ionicons name="chatbubble-outline" size={24} color={isActive('/chat') ? '#007AFF' : '#666'} />
                <Text style={{ fontSize: 12, marginTop: 4, fontWeight: isActive('/chat') ? '600' as const : '400' as const, color: isActive('/chat') ? '#007AFF' : '#666' }}>Chat</Text>
              </TouchableOpacity>
            </Link>

            <Link href="/profile" asChild>
              <TouchableOpacity style={{ alignItems: 'center', paddingVertical: 8 }}>
                <Ionicons name="person-outline" size={24} color={isActive('/profile') ? '#007AFF' : '#666'} />
                <Text style={{ fontSize: 12, marginTop: 4, fontWeight: isActive('/profile') ? '600' as const : '400' as const, color: isActive('/profile') ? '#007AFF' : '#666' }}>Profile</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}


