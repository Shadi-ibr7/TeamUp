import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../lib/context/AuthContext";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, name);
      Alert.alert(
        'Inscription réussie', 
        'Vérifiez votre email pour confirmer votre compte',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );
    } catch (error: any) {
      Alert.alert('Erreur d\'inscription', error.message || 'Impossible de créer le compte');
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
                      <Ionicons name="person-add" size={40} color="#007AFF" />
                    </View>
                    <Text style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 8, color: '#000000' }}>
                      Créer un compte
                    </Text>
                    <Text style={{ textAlign: 'center', color: '#8E8E93' }}>
                      Rejoignez la communauté sportive TeamUp
                    </Text>
                  </View>

                  {/* Formulaire */}
                  <View style={{ gap: 16 }}>
                    <View>
                      <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8, color: '#000000' }}>
                        Nom complet
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
                          placeholder="Votre nom complet"
                          placeholderTextColor="#8E8E93"
                          value={name}
                          onChangeText={setName}
                          autoCapitalize="words"
                          autoCorrect={false}
                        />
                      </View>
                    </View>

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
                          placeholder="Mot de passe"
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

                    <View>
                      <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 8, color: '#000000' }}>
                        Confirmer le mot de passe
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
                          placeholder="Confirmer le mot de passe"
                          placeholderTextColor="#8E8E93"
                          value={confirmPassword}
                          onChangeText={setConfirmPassword}
                          secureTextEntry={!showConfirmPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                          <Ionicons 
                            name={showConfirmPassword ? "eye-off" : "eye"} 
                            size={20} 
                            color="#8E8E93"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Bouton d'inscription */}
                  <View style={{ marginTop: 24 }}>
                    <TouchableOpacity
                      onPress={handleSignup}
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
                        {loading ? 'Création...' : 'Créer mon compte'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Lien connexion */}
                  <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
                    <Text style={{ color: '#8E8E93' }}>
                      Déjà un compte ?{" "}
                    </Text>
                    <Link href="/auth/login" asChild>
                      <Text style={{ fontWeight: '600', color: '#007AFF' }}>
                        Se connecter
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