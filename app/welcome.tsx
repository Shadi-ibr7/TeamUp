import { useRouter } from 'expo-router';
import { Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#141A1F]">
      <StatusBar barStyle="light-content" backgroundColor="#141A1F" />
      <View className="flex-1 justify-center items-center px-8">
        {/* Image d'accueil */}
        <View className="w-[420px] h-[350px] mb-10">
          <Image
            source={require('../assets/images/image_page_accueil.png')}
            className="w-full h-full"
            resizeMode="cover"
            onError={(e) => console.log('Erreur de chargement image:', e)}
          />
        </View>

        {/* Titre et description */}
        <View className="mb-10 items-center">
          <Text className="text-3xl font-bold text-[#FFFFFF] mb-3">
            TeamUp!
          </Text>
          <Text className="text-sm text-[#9EB0BD] text-center px-6 leading-6">
            Discover your next game or start your own
          </Text>
        </View>

        {/* Boutons */}
        <View className="w-full space-y-4 px-4">
          {/* Bouton Create Account */}
          <TouchableOpacity
            onPress={() => router.push('/auth/signup')}
            className="bg-[#C4D9EB] py-4 px-8 rounded-2xl w-full mb-4"
            style={{ 
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <Text className="text-[#141A1F] text-base font-semibold text-center">
              Create Account
            </Text>
          </TouchableOpacity>

          {/* Bouton Log In */}
          <TouchableOpacity
            onPress={() => router.push('/auth/login')}
            className="bg-[#2B3840] py-4 px-8 rounded-2xl w-full"
          >
            <Text className="text-[#FFFFFF] text-base font-semibold text-center">
              Log In
            </Text>
          </TouchableOpacity>
        </View>

        {/* Conditions d'utilisation */}
        <View className="mt-auto pb-20">
          <Text className="text-[9px] text-[#9EB0BD] text-center px-8 leading-4">
            By proceeding, you consent to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
} 