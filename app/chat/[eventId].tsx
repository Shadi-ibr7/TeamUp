import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/context/AuthContext';
import { ChatService } from '../../lib/services/chat';
import { EventService } from '../../lib/services/events';

interface Participant {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  messageType: 'text' | 'image';
  imageUrl?: string;
  timestamp: Date;
  type: 'text' | 'image';
}

export default function EventChat() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (eventId && user) {
      loadEventData();
      loadMessages();
      loadParticipants();
      subscribeToMessages();
    }

    return () => {
      // Cleanup subscription si nécessaire
    };
  }, [eventId, user]);

  const loadEventData = async () => {
    try {
      const event = await EventService.getEventById(eventId as string);
      setEventData(event);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'événement:', error);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const messagesData = await ChatService.getEventMessages(eventId as string);
      
      const formattedMessages = messagesData.map((msg: any) => ({
        id: msg.id,
        userId: msg.user_id,
        userName: msg.user?.name || 'Utilisateur',
        userAvatar: msg.user?.avatar_url && msg.user.avatar_url.trim() !== '' ? msg.user.avatar_url : '👤',
        content: msg.content,
        messageType: msg.message_type || 'text',
        imageUrl: msg.image_url,
        timestamp: new Date(msg.created_at),
        type: msg.message_type || 'text'
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
      // Utiliser les messages mock en cas d'erreur
      setMessages(mockMessages);
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async () => {
    try {
      const event = await EventService.getEventById(eventId as string);
      if (event?.participants) {
        const formattedParticipants = event.participants.map((p: any) => ({
          id: p.user_id,
          name: p.user?.name || 'Participant',
          avatar: p.user?.avatar_url && p.user.avatar_url.trim() !== '' ? p.user.avatar_url : '👤',
          isOnline: true // TODO: Implémenter le statut en ligne
        }));
        setParticipants(formattedParticipants);
      } else {
        setParticipants(mockParticipants);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des participants:', error);
      setParticipants(mockParticipants);
    }
  };

  const subscribeToMessages = () => {
    if (!eventId) return;

    const subscription = ChatService.subscribeToMessages(
      eventId as string,
      (newMessage: any) => {
        const formattedMessage: Message = {
          id: newMessage.id,
          userId: newMessage.user_id,
          userName: newMessage.user?.name || 'Utilisateur',
          userAvatar: newMessage.user?.avatar_url || '👤',
          content: newMessage.content,
          messageType: newMessage.message_type || 'text',
          imageUrl: newMessage.image_url,
          timestamp: new Date(newMessage.created_at),
          type: newMessage.message_type || 'text'
        };

        setMessages(prev => [...prev, formattedMessage]);
        
        // Auto-scroll vers le bas
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return subscription;
  };

  const sendMessage = async () => {
    if (!message.trim() || !user?.id || sending) return;
    
    setSending(true);
    try {
      console.log('📤 Envoi du message:', message);
      const sentMessage = await ChatService.sendMessage(eventId as string, user.id, message);
      
      if (sentMessage) {
        const newMessage: Message = {
          id: sentMessage.id,
          userId: sentMessage.user_id,
          userName: sentMessage.user?.name || user.user_metadata?.full_name || 'Vous',
          userAvatar: sentMessage.user?.avatar_url || '👤',
          content: sentMessage.content,
          messageType: 'text',
          timestamp: new Date(sentMessage.created_at),
          type: 'text'
        };
        
        setMessages(prev => [...prev, newMessage]);
        setMessage('');
        
        // Faire défiler vers le bas
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    } finally {
      setSending(false);
    }
  };

  const selectImage = async () => {
    try {
      // Demander la permission d'accéder à la galerie
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à vos photos.');
        return;
      }

      // Options de sélection d'image
      Alert.alert(
        'Partager une photo',
        'Comment souhaitez-vous choisir votre photo ?',
        [
          {
            text: 'Galerie',
            onPress: () => pickImageFromGallery(),
          },
          {
            text: 'Appareil photo',
            onPress: () => takePhoto(),
          },
          {
            text: 'Annuler',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner une image');
    }
  };

  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await sendImageMessage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur lors de la sélection depuis la galerie:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner une image depuis la galerie');
    }
  };

  const takePhoto = async () => {
    try {
      // Demander la permission d'accéder à la caméra
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Nous avons besoin de votre permission pour accéder à l\'appareil photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await sendImageMessage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Erreur lors de la prise de photo:', error);
      Alert.alert('Erreur', 'Impossible de prendre une photo');
    }
  };

  const sendImageMessage = async (imageUri: string) => {
    if (!user?.id || uploadingImage) return;
    
    setUploadingImage(true);
    try {
      console.log('📸 Envoi d\'une image:', imageUri);
      
      // Upload de l'image
      const imageUrl = await ChatService.uploadChatImage(eventId as string, user.id, imageUri);
      
      if (!imageUrl) {
        throw new Error('Échec de l\'upload de l\'image');
      }
      
      // Envoyer le message avec l'image
      const sentMessage = await ChatService.sendImageMessage(eventId as string, user.id, imageUrl, '');
      
      if (sentMessage) {
        const newMessage: Message = {
          id: sentMessage.id,
          userId: sentMessage.user_id,
          userName: sentMessage.user?.name || user.user_metadata?.full_name || 'Vous',
          userAvatar: sentMessage.user?.avatar_url || '👤',
          content: sentMessage.content,
          messageType: 'image',
          imageUrl: sentMessage.image_url,
          timestamp: new Date(sentMessage.created_at),
          type: 'image'
        };
        
        setMessages(prev => [...prev, newMessage]);
        
        // Faire défiler vers le bas
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de l\'image:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer l\'image');
    } finally {
      setUploadingImage(false);
    }
  };

  // Données mock de secours
  const mockParticipants: Participant[] = [
    { id: '1', name: 'Isabella', avatar: '👩🏻‍💼', isOnline: true },
    { id: '2', name: 'Lucas', avatar: '👨🏻‍💻', isOnline: true },
    { id: '3', name: 'Ava', avatar: '👩🏼‍🎨', isOnline: false },
    { id: '4', name: 'Noah', avatar: '👨🏽‍⚕️', isOnline: true },
    { id: '5', name: 'Emma', avatar: '👩🏻‍🏫', isOnline: true },
  ];

  const mockMessages: Message[] = [
    {
      id: '1',
      userId: 'user1',
      userName: 'Alice',
      userAvatar: '👩',
      content: 'Salut tout le monde ! J\'ai hâte de jouer au basketball avec vous !',
      messageType: 'text',
      timestamp: new Date(Date.now() - 3600000),
      type: 'text'
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Bob',
      userAvatar: '👨',
      content: 'Parfait ! J\'apporte le ballon. Rendez-vous à 14h ?',
      messageType: 'text',
      timestamp: new Date(Date.now() - 1800000),
      type: 'text'
    },
    {
      id: '3',
      userId: user?.id || 'current-user',
      userName: 'Vous',
      userAvatar: '😊',
      content: 'Super ! J\'apporte de l\'eau pour tout le monde',
      messageType: 'text',
      timestamp: new Date(Date.now() - 900000),
      type: 'text'
    }
  ];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const ParticipantItem = ({ participant }: { participant: Participant }) => (
    <View className="items-center mr-4">
      <View className="relative">
        <View className="w-12 h-12 rounded-full bg-slate-600 items-center justify-center border-2 border-slate-500 overflow-hidden">
          {participant.avatar && participant.avatar !== '👤' && participant.avatar.startsWith('http') ? (
            <Image
              source={{ uri: participant.avatar }}
              className="w-full h-full"
              style={{ width: 48, height: 48, borderRadius: 24 }}
              resizeMode="cover"
            />
          ) : (
            <Text className="text-lg">
              {participant.avatar && participant.avatar !== '👤' ? participant.avatar : participant.name.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
        {participant.isOnline && (
          <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-800" />
        )}
      </View>
      <Text className="text-slate-400 text-xs mt-1 max-w-[48px]" numberOfLines={1}>
        {participant.name}
      </Text>
    </View>
  );

  const MessageBubble = ({ message: msg, isCurrentUser }: { message: Message; isCurrentUser: boolean }) => (
    <View className={`flex-row mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
      {!isCurrentUser && (
        <View className="w-8 h-8 rounded-full bg-slate-600 items-center justify-center mr-3 mt-1 overflow-hidden">
          {msg.userAvatar && msg.userAvatar !== '👤' && msg.userAvatar.startsWith('http') ? (
            <Image
              source={{ uri: msg.userAvatar }}
              className="w-full h-full"
              style={{ width: 32, height: 32, borderRadius: 16 }}
              resizeMode="cover"
            />
          ) : (
            <Text className="text-sm">
              {msg.userAvatar && msg.userAvatar !== '👤' ? msg.userAvatar : msg.userName.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
      )}
      
      <View className={`max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        {!isCurrentUser && (
          <Text className="text-slate-400 text-xs mb-1 ml-1">{msg.userName}</Text>
        )}
        
        {msg.messageType === 'image' && msg.imageUrl ? (
          <View className={`rounded-2xl overflow-hidden ${
            isCurrentUser ? 'rounded-br-md' : 'rounded-bl-md'
          }`}>
            <Image
              source={{ uri: msg.imageUrl }}
              style={{ width: 200, height: 150 }}
              resizeMode="cover"
            />
            {msg.content && msg.content.trim() !== '' && (
              <View className={`px-4 py-2 ${
                isCurrentUser ? 'bg-blue-500' : 'bg-slate-700'
              }`}>
                <Text className="text-white text-sm">{msg.content}</Text>
              </View>
            )}
          </View>
        ) : (
          <View 
            className={`px-4 py-3 rounded-2xl ${
              isCurrentUser 
                ? 'bg-blue-500 rounded-br-md' 
                : 'bg-slate-700 rounded-bl-md'
            }`}
          >
            <Text className="text-white text-base">{msg.content}</Text>
          </View>
        )}
        
        <Text className="text-slate-500 text-xs mt-1 ml-1">
          {formatTime(msg.timestamp)}
        </Text>
      </View>
      
      {isCurrentUser && (
        <View className="w-8 h-8 rounded-full bg-slate-600 items-center justify-center ml-3 mt-1 overflow-hidden">
          {msg.userAvatar && msg.userAvatar !== '👤' && msg.userAvatar.startsWith('http') ? (
            <Image
              source={{ uri: msg.userAvatar }}
              className="w-full h-full"
              style={{ width: 32, height: 32, borderRadius: 16 }}
              resizeMode="cover"
            />
          ) : (
            <Text className="text-sm">
              {msg.userAvatar && msg.userAvatar !== '👤' ? msg.userAvatar : msg.userName.charAt(0).toUpperCase()}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  // Rediriger vers login si pas connecté
  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center" edges={['top', 'bottom', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        
        <View className="items-center px-8">
          <View className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full items-center justify-center mb-6">
            <Text className="text-white font-bold text-4xl">T</Text>
          </View>
          <Text className="text-white text-3xl font-bold mb-4">Connectez-vous</Text>
          <Text className="text-slate-400 text-center mb-8">
            Vous devez être connecté pour accéder au chat
          </Text>
          
          <Link href="/auth/login" asChild>
            <TouchableOpacity className="bg-blue-500 rounded-2xl py-4 px-8 mb-4 w-full">
              <Text className="text-white font-bold text-lg text-center">Se connecter</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 bg-slate-800 border-b border-slate-700">
        <Link href="/chat" asChild>
          <TouchableOpacity className="mr-4">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </Link>
        <View className="flex-1">
          <Text className="text-white text-lg font-semibold">
            {eventData?.title || `Chat Événement ${eventId}`}
          </Text>
          <Text className="text-slate-400 text-sm">
            {participants.filter(p => p.isOnline).length} participants en ligne
          </Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="videocam" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity className="ml-4">
          <Ionicons name="call" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Participants */}
      <View className="bg-slate-800 px-4 py-3 border-b border-slate-700">
        <Text className="text-slate-300 text-sm font-medium mb-3">Participants</Text>
        <FlatList
          horizontal
          data={participants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ParticipantItem participant={item} />}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Messages */}
      <KeyboardAvoidingView 
        className="flex-1" 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 bg-slate-900">
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-slate-400 text-lg">Chargement des messages...</Text>
            </View>
          ) : (
            <>
              <Text className="text-slate-500 text-xs text-center py-3">Messages</Text>
              
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <MessageBubble 
                    message={item} 
                    isCurrentUser={item.userId === user.id} 
                  />
                )}
                className="flex-1 px-4"
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
              />
            </>
          )}
        </View>

        {/* Input Area */}
        <View className="bg-slate-800 px-4 py-3 border-t border-slate-700">
          <View className="flex-row items-center space-x-3">
            <TouchableOpacity 
              className="w-10 h-10 bg-slate-700 rounded-full items-center justify-center"
              onPress={selectImage}
              disabled={uploadingImage}
            >
              <Ionicons 
                name="camera" 
                size={20} 
                color={uploadingImage ? "#64748b" : "#9ca3af"} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="w-10 h-10 bg-slate-700 rounded-full items-center justify-center"
              onPress={selectImage}
              disabled={uploadingImage}
            >
              <Ionicons 
                name="image" 
                size={20} 
                color={uploadingImage ? "#64748b" : "#9ca3af"} 
              />
            </TouchableOpacity>
            
            <View className="flex-1 bg-slate-700 rounded-full px-4 py-3 flex-row items-center">
              <TextInput
                className="text-white flex-1 text-base"
                placeholder={uploadingImage ? "Envoi d'image..." : "Tapez votre message..."}
                placeholderTextColor="#64748b"
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={500}
                editable={!sending && !uploadingImage}
              />
            </View>
            
            <TouchableOpacity 
              className={`w-10 h-10 bg-blue-500 rounded-full items-center justify-center ${(sending || uploadingImage || !message.trim()) ? 'opacity-50' : ''}`}
              onPress={sendMessage}
              disabled={sending || uploadingImage || !message.trim()}
            >
              <Ionicons name="send" size={18} color="white" />
            </TouchableOpacity>
          </View>
          <SafeAreaView edges={['bottom']} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 