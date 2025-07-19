import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
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
    <SafeAreaView className="flex-1 bg-[#141A1F]">
      <StatusBar barStyle="light-content" backgroundColor="#141A1F" />
      
      {/* Header */}
      <View className="flex-row items-center px-4 py-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Logo et titre */}
      <View className="items-center px-4 py-8">
        <Text className="text-[#FFFFFF] text-3xl font-bold mb-2">Bienvenue !</Text>
        <Text className="text-[#9EB0BD] text-center">Connectez-vous pour rejoindre vos événements sportifs</Text>
      </View>

      {/* Formulaire */}
      <View className="px-4 pb-8">
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

        <View className="mb-6">
          <Text className="text-[#FFFFFF] text-base font-medium mb-2">Mot de passe</Text>
          <View className="bg-[#2B3840] rounded-2xl px-4 py-4 border border-[#2B3840] flex-row items-center">
            <TextInput
              className="text-[#FFFFFF] text-base flex-1"
              placeholder="••••••••"
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

        <TouchableOpacity
          className={`bg-[#C4D9EB] rounded-2xl py-4 items-center mb-4 ${loading ? 'opacity-50' : ''}`}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text className="text-[#141A1F] font-bold text-lg">
            {loading ? 'Connexion...' : 'Se connecter'}
          </Text>
        </TouchableOpacity>

        <View className="flex-row justify-center">
          <Text className="text-[#9EB0BD]">Pas encore de compte ? </Text>
          <Link href="/auth/signup" asChild>
            <TouchableOpacity>
              <Text className="text-[#0F80DB] font-medium">Créer un compte</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
} 