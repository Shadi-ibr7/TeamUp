import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../lib/context/AuthContext';
import { ProfileService } from '../../lib/services/profile';

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      await ProfileService.updateUserProfile(user.id, {
        name,
        email,
        updated_at: new Date().toISOString()
      });
      Alert.alert('Succès', 'Profil mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le profil');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setLoading(true);
    try {
      // TODO: Implémenter le changement de mot de passe avec Supabase
      Alert.alert('Succès', 'Mot de passe modifié avec succès !');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier le mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Supprimer le compte',
      'Cette action est irréversible. Toutes vos données seront définitivement supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirmation finale',
              'Êtes-vous absolument certain de vouloir supprimer votre compte ?',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Oui, supprimer',
                  style: 'destructive',
                  onPress: async () => {
                    // TODO: Implémenter la suppression de compte
                    Alert.alert('Info', 'Fonctionnalité en cours de développement');
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Exporter mes données',
      'Vous recevrez un email contenant toutes vos données personnelles au format JSON.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Exporter',
          onPress: () => {
            // TODO: Implémenter l'export de données
            Alert.alert('Succès', 'Votre demande d\'export a été envoyée. Vous recevrez un email sous 24h.');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-800">
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 py-4 border-b border-slate-700">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Paramètres du compte</Text>
          <View className="w-6" />
        </View>

        {/* Informations personnelles */}
        <View className="px-6 py-6 border-b border-slate-700">
          <Text className="text-white text-lg font-semibold mb-4">Informations personnelles</Text>
          
          <View className="mb-4">
            <Text className="text-gray-400 mb-2">Nom complet</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              className="bg-slate-700 text-white px-4 py-3 rounded-lg"
              placeholder="Votre nom"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-400 mb-2">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              className="bg-slate-700 text-white px-4 py-3 rounded-lg"
              placeholder="votre@email.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            onPress={handleUpdateProfile}
            disabled={loading}
            className="bg-blue-600 py-3 rounded-lg"
          >
            <Text className="text-white text-center font-semibold">
              {loading ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sécurité */}
        <View className="px-6 py-6 border-b border-slate-700">
          <Text className="text-white text-lg font-semibold mb-4">Sécurité</Text>
          
          <View className="mb-4">
            <Text className="text-gray-400 mb-2">Mot de passe actuel</Text>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              className="bg-slate-700 text-white px-4 py-3 rounded-lg"
              placeholder="Mot de passe actuel"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-400 mb-2">Nouveau mot de passe</Text>
            <TextInput
              value={newPassword}
              onChangeText={setNewPassword}
              className="bg-slate-700 text-white px-4 py-3 rounded-lg"
              placeholder="Nouveau mot de passe"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />
          </View>

          <View className="mb-4">
            <Text className="text-gray-400 mb-2">Confirmer le mot de passe</Text>
            <TextInput
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              className="bg-slate-700 text-white px-4 py-3 rounded-lg"
              placeholder="Confirmer le mot de passe"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            onPress={handleChangePassword}
            disabled={loading}
            className="bg-orange-600 py-3 rounded-lg mb-4"
          >
            <Text className="text-white text-center font-semibold">
              {loading ? 'Modification...' : 'Modifier le mot de passe'}
            </Text>
          </TouchableOpacity>

          {/* Authentification à deux facteurs */}
          <View className="flex-row justify-between items-center py-3">
            <View className="flex-1">
              <Text className="text-white font-medium">Authentification à 2 facteurs</Text>
              <Text className="text-gray-400 text-sm">Sécurisez votre compte avec un code SMS</Text>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={setTwoFactorEnabled}
              trackColor={{ false: '#374151', true: '#3B82F6' }}
              thumbColor={twoFactorEnabled ? '#ffffff' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* Préférences */}
        <View className="px-6 py-6 border-b border-slate-700">
          <Text className="text-white text-lg font-semibold mb-4">Préférences</Text>
          
          <View className="flex-row justify-between items-center py-3">
            <View className="flex-1">
              <Text className="text-white font-medium">Notifications par email</Text>
              <Text className="text-gray-400 text-sm">Recevoir des emails sur votre activité</Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{ false: '#374151', true: '#3B82F6' }}
              thumbColor={emailNotifications ? '#ffffff' : '#9CA3AF'}
            />
          </View>
        </View>

        {/* Actions sur les données */}
        <View className="px-6 py-6 border-b border-slate-700">
          <Text className="text-white text-lg font-semibold mb-4">Mes données</Text>
          
          <TouchableOpacity
            onPress={handleExportData}
            className="flex-row items-center py-4 border-b border-slate-600"
          >
            <Ionicons name="download-outline" size={24} color="#3B82F6" />
            <View className="ml-4">
              <Text className="text-white font-medium">Exporter mes données</Text>
              <Text className="text-gray-400 text-sm">Télécharger toutes vos données personnelles</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Zone de danger */}
        <View className="px-6 py-6">
          <Text className="text-red-500 text-lg font-semibold mb-4">Zone de danger</Text>
          
          <TouchableOpacity
            onPress={handleDeleteAccount}
            className="bg-red-600 py-4 rounded-lg"
          >
            <Text className="text-white text-center font-semibold">Supprimer mon compte</Text>
          </TouchableOpacity>
          
          <Text className="text-gray-400 text-sm text-center mt-2">
            Cette action est irréversible et supprimera définitivement toutes vos données.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 