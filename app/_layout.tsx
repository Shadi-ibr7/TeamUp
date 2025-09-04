import { useFonts } from 'expo-font';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import "../app/global.css";
import BottomNav from '../components/BottomNav';
import { AuthProvider, useAuth } from '../lib/context/AuthContext';
import { ThemeProvider, useTheme } from '../lib/context/ThemeContext';

function LoadingScreen() {
  const { isDarkMode, colors } = useTheme();
  
  return (
    <LinearGradient
      colors={isDarkMode ? ['#0f172a', '#1e293b'] : ['#ffffff', '#f0f9ff']}
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={{ marginTop: 16, fontSize: 16, color: isDarkMode ? colors.foreground : '#111' }}>Chargement...</Text>
    </LinearGradient>
  );
}

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Attendre que l'authentification soit initialisée

    const firstSegment = segments[0];
    const inAuthGroup = firstSegment === 'auth';
    const inWelcome = firstSegment === 'welcome';

    console.log('Navigation check:', { user: !!user, firstSegment, inAuthGroup, inWelcome });

    if (!user) {
      // L'utilisateur n'est pas connecté
      if (!inAuthGroup && !inWelcome) {
        // Rediriger vers welcome si pas déjà sur auth ou welcome
        console.log('Redirecting to welcome...');
        router.replace('/welcome');
      }
    } else {
      // L'utilisateur est connecté
      if (inAuthGroup || inWelcome) {
        // Rediriger vers l'accueil si sur auth ou welcome
        console.log('Redirecting to home...');
        router.replace('/');
      }
    }
  }, [user, loading, segments]);

  // Afficher un écran de chargement pendant l'initialisation
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack>
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="events" options={{ headerShown: false }} />
      <Stack.Screen name="events/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="discover" options={{ headerShown: false }} />
      <Stack.Screen name="chat" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[eventId]" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="create-event" options={{ headerShown: false }} />
      <Stack.Screen name="edit-event/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
      <Stack.Screen name="calendar" options={{ headerShown: false }} />
      
      {/* Nouvelles pages de réservation */}
      <Stack.Screen name="terrains" options={{ headerShown: false }} />
      <Stack.Screen name="reservation" options={{ headerShown: false }} />
      <Stack.Screen name="mes-reservations" options={{ headerShown: false }} />
      <Stack.Screen name="admin/reservations" options={{ headerShown: false }} />
      
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
      <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
      <Stack.Screen name="settings/account" options={{ headerShown: false }} />
      <Stack.Screen name="settings/notifications" options={{ headerShown: false }} />
      <Stack.Screen name="settings/privacy" options={{ headerShown: false }} />
      <Stack.Screen name="test" options={{ headerShown: false }} />
    </Stack>
  );
}

function ThemedLayout() {
  const { isDarkMode, colors } = useTheme();
  const segments = useSegments();
  
  // Déterminer si on doit afficher la BottomNav
  const firstSegment = segments[0];
  const shouldShowBottomNav = firstSegment !== 'auth' && firstSegment !== 'welcome';

  return (
    <LinearGradient
      colors={isDarkMode ? ['#0f172a', '#1e293b'] : ['#ffffff', '#f0f9ff']}
      style={{ flex: 1 }}
    >
      <RootLayoutNav />
      {shouldShowBottomNav && <BottomNav />}
      <StatusBar style={isDarkMode ? "light" : "dark"} backgroundColor={isDarkMode ? "#0f172a" : "#ffffff"} />
    </LinearGradient>
  );
}

export default function RootLayout() {
  // Supprimer la dépendance à la police manquante
  const [loaded] = useFonts({});

  if (!loaded) {
    return (
      <SafeAreaProvider>
        <ThemeProvider>
          <LoadingScreen />
        </ThemeProvider>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <ThemedLayout />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

