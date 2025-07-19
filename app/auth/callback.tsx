import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers la page d'accueil après l'authentification
    const timer = setTimeout(() => {
      router.replace('/');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <SafeAreaView className="flex-1 bg-slate-900 justify-center items-center">
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text className="text-white text-lg mt-4">Connexion en cours...</Text>
    </SafeAreaView>
  );
} 