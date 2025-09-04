import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import { Image, ImageBackground, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Welcome() {
  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200' }}
      style={{ flex: 1 }}
      blurRadius={30}
    >
      <LinearGradient
        colors={['rgba(255,255,255,0.3)', 'rgba(242,242,247,0.7)']}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <StatusBar barStyle="dark-content" />
          
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
            <View 
              style={{ 
                padding: 32,
                borderRadius: 24,
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)'
              }}
            >
              <Image
                source={require('../assets/assets/images/logo.png')}
                style={{ width: 120, height: 120, marginBottom: 24, resizeMode: 'contain' as any }}
              />
              
              <View style={{ height: 0 }} />
              
              <Text style={{ textAlign: 'center', marginBottom: 32, color: '#8E8E93' }}>
                Rejoignez la communauté sportive et trouvez vos partenaires de jeu
              </Text>
              
              <View style={{ width: '100%', gap: 16 }}>
                <Link href="/auth/login" asChild>
                  <TouchableOpacity
                    style={{ 
                      paddingVertical: 16,
                      borderRadius: 16,
                      alignItems: 'center',
                      backgroundColor: '#007AFF'
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 }}>
                      Se connecter
                    </Text>
                  </TouchableOpacity>
                </Link>
                
                <Link href="/auth/signup" asChild>
                  <TouchableOpacity
                    style={{ 
                      paddingVertical: 16,
                      borderRadius: 16,
                      alignItems: 'center',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      borderWidth: 2,
                      borderColor: 'rgba(255,255,255,0.2)'
                    }}
                  >
                    <Text style={{ fontWeight: '500', fontSize: 18, color: '#000000' }}>
                      Créer un compte
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
} 