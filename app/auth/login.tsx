import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../lib/context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Erreur de connexion', error.message);
    } finally {
      setLoading(false);
    }
  };

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
          
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <ScrollView 
              contentContainerStyle={{ flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header avec bouton retour */}
              <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
                <TouchableOpacity 
                  onPress={() => router.back()}
                  style={{ 
                    alignSelf: 'flex-start',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: 'rgba(255,255,255,0.2)'
                  }}
                >
                  <Text style={{ color: '#000000' }}>Retour</Text>
                </TouchableOpacity>
              </View>

              {/* Contenu principal */}
              <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 16, paddingBottom: 32 }}>
                <View 
                  style={{ 
                    padding: 24,
                    borderRadius: 24,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.2)'
                  }}
                >
                  {/* Logo et titre */}
                  <View style={{ alignItems: 'center', marginBottom: 32 }}>
                    <View 
                      style={{ 
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16,
                        backgroundColor: 'rgba(0,122,255,0.2)'
                      }}
                    >
                      <Ionicons name="football" size={40} color="#007AFF" />
                    </View>
                    <Text style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 8, color: '#000000' }}>
                      Bienvenue !
                    </Text>
                    <Text style={{ textAlign: 'center', color: '#8E8E93' }}>
                      Connectez-vous pour rejoindre vos événements sportifs
                    </Text>
                  </View>

                  {/* Formulaire */}
                  <View style={{ gap: 16 }}>
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8, color: '#000000' }}>
                        Email
                      </Text>
                      <View 
                        style={{ 
                          borderRadius: 16,
                          paddingHorizontal: 16,
                          paddingVertical: 16,
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.2)'
                        }}
                      >
                        <TextInput
                          style={{ fontSize: 16, color: '#000000' }}
                          placeholder="votre@email.com"
                          placeholderTextColor="#8E8E93"
                          value={email}
                          onChangeText={setEmail}
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                      </View>
                    </View>

                    <View>
                      <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8, color: '#000000' }}>
                        Mot de passe
                      </Text>
                      <View 
                        style={{ 
                          borderRadius: 16,
                          paddingHorizontal: 16,
                          paddingVertical: 16,
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.2)'
                        }}
                      >
                        <TextInput
                          style={{ flex: 1, fontSize: 16, color: '#000000' }}
                          placeholder="••••••••"
                          placeholderTextColor="#8E8E93"
                          value={password}
                          onChangeText={setPassword}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                          <Ionicons 
                            name={showPassword ? "eye-off" : "eye"} 
                            size={20} 
                            color="#8E8E93"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Bouton de connexion */}
                  <View style={{ marginTop: 24 }}>
                    <TouchableOpacity
                      onPress={handleLogin}
                      disabled={loading}
                      style={{ 
                        paddingVertical: 16,
                        borderRadius: 16,
                        alignItems: 'center',
                        backgroundColor: '#007AFF',
                        opacity: loading ? 0.5 : 1
                      }}
                    >
                      <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 }}>
                        {loading ? 'Connexion...' : 'Se connecter'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Lien inscription */}
                  <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
                    <Text style={{ color: '#8E8E93' }}>
                      Pas encore de compte ?{" "}
                    </Text>
                    <Link href="/auth/signup" asChild>
                      <Text style={{ fontWeight: '600', color: '#007AFF' }}>
                        Créer un compte
                      </Text>
                    </Link>
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </ImageBackground>
  );
}