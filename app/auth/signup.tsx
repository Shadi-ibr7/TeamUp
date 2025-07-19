import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
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
    <SafeAreaView className="flex-1 bg-[#141A1F]">
      <StatusBar barStyle="light-content" backgroundColor="#141A1F" />
      
      {/* Header */}
      <View className="flex-row items-center px-4 py-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Logo et titre */}
      <View className="items-center px-4 py-6">
        <Text className="text-[#FFFFFF] text-3xl font-bold mb-2">Créer un compte</Text>
        <Text className="text-[#9EB0BD] text-center">Rejoignez la communauté sportive TeamUp</Text>
      </View>

      {/* Formulaire */}
      <View className="flex-1 px-4">
        <View className="mb-4">
          <Text className="text-[#FFFFFF] text-base font-medium mb-2">Nom complet</Text>
          <View className="bg-[#2B3840] rounded-2xl px-4 py-4 border border-[#2B3840]">
            <TextInput
              className="text-[#FFFFFF] text-base"
              placeholder="Votre nom complet"
              placeholderTextColor="#9EB0BD"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-[#FFFFFF] text-base font-medium mb-2">Email</Text>
          <View className="bg-[#2B3840] rounded-2xl px-4 py-4 border border-[#2B3840]">
            <TextInput
              className="text-[#FFFFFF] text-base"
              placeholder="votre@email.com"
              placeholderTextColor="#9EB0BD"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-[#FFFFFF] text-base font-medium mb-2">Mot de passe</Text>
          <View className="bg-[#2B3840] rounded-2xl px-4 py-4 border border-[#2B3840] flex-row items-center">
            <TextInput
              className="text-[#FFFFFF] text-base flex-1"
              placeholder="Mot de passe"
              placeholderTextColor="#9EB0BD"
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
                color="#9EB0BD" 
                />
              </TouchableOpacity>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-[#FFFFFF] text-base font-medium mb-2">Confirmer le mot de passe</Text>
          <View className="bg-[#2B3840] rounded-2xl px-4 py-4 border border-[#2B3840] flex-row items-center">
            <TextInput
              className="text-[#FFFFFF] text-base flex-1"
              placeholder="Confirmer le mot de passe"
              placeholderTextColor="#9EB0BD"
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
                color="#9EB0BD" 
                />
              </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
            className={`bg-[#C4D9EB] rounded-2xl py-4 items-center mb-4 ${loading ? 'opacity-50' : ''}`}
            onPress={handleSignup}
            disabled={loading}
        >
            <Text className="text-[#141A1F] font-bold text-lg">
              {loading ? 'Création...' : 'Créer mon compte'}
            </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center">
          <Text className="text-[#9EB0BD]">Déjà un compte ? </Text>
          <Link href="/auth/login" asChild>
            <TouchableOpacity>
              <Text className="text-[#0F80DB] font-medium">Se connecter</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
} 