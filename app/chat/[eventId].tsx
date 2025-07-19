import { Ionicons } from "@expo/vector-icons";
import { Link, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
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
  timestamp: Date;
  type: 'text' | 'image';
  imageUrl?: string;
}

export default function EventChat() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [eventData, setEventData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
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
        userAvatar: msg.user?.avatar_url || '👤',
        content: msg.content,
        timestamp: new Date(msg.created_at),
        type: 'text' as const
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
          avatar: p.user?.avatar_url || '👤',
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
          timestamp: new Date(newMessage.created_at),
          type: 'text'
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
    if (!message.trim() || !user || !eventId) return;

    setSending(true);
    try {
      await ChatService.sendMessage(eventId as string, user.id, message.trim());
      setMessage("");
      
      // Le message sera ajouté automatiquement via la subscription
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      
      // En cas d'erreur, ajouter le message localement
      const newMessage: Message = {
        id: Date.now().toString(),
        userId: user.id,
        userName: (user as any)?.user_metadata?.name || user.email || 'Vous',
        userAvatar: '👤',
        content: message.trim(),
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, newMessage]);
      setMessage("");
    } finally {
      setSending(false);
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
      userId: '2',
      userName: 'Lucas',
      userAvatar: '👨🏻‍💻',
      content: 'Salut tout le monde !',
      timestamp: new Date(Date.now() - 3600000),
      type: 'text'
    },
    {
      id: '2',
      userId: '1',
      userName: 'Isabella',
      userAvatar: '👩🏻‍💼',
      content: 'Hâte de participer à cet événement !',
      timestamp: new Date(Date.now() - 3000000),
      type: 'text'
    },
    {
      id: '3',
      userId: '2',
      userName: 'Lucas',
      userAvatar: '👨🏻‍💻',
      content: 'Ça va être génial !',
      timestamp: new Date(Date.now() - 2400000),
      type: 'text'
    },
    {
      id: '4',
      userId: '3',
      userName: 'Ava',
      userAvatar: '👩🏼‍🎨',
      content: 'Je suis d\'accord !',
      timestamp: new Date(Date.now() - 1800000),
      type: 'text'
    },
    {
      id: '5',
      userId: '1',
      userName: 'Isabella',
      userAvatar: '👩🏻‍💼',
      content: 'Parfait ! N\'hésitez pas à inviter d\'autres personnes.',
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

  const ParticipantAvatar = ({ participant }: { participant: Participant }) => (
    <View className="items-center mr-3">
      <View className="relative">
        <View className="w-12 h-12 rounded-full bg-slate-600 items-center justify-center border-2 border-slate-500">
          <Text className="text-lg">{participant.avatar}</Text>
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
        <View className="w-8 h-8 rounded-full bg-slate-600 items-center justify-center mr-3 mt-1">
          <Text className="text-sm">{msg.userAvatar}</Text>
        </View>
      )}
      
      <View className={`max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        {!isCurrentUser && (
          <Text className="text-slate-400 text-xs mb-1 ml-1">{msg.userName}</Text>
        )}
        <View 
          className={`px-4 py-3 rounded-2xl ${
            isCurrentUser 
              ? 'bg-blue-500 rounded-br-md' 
              : 'bg-slate-700 rounded-bl-md'
          }`}
        >
          <Text className="text-white text-base">{msg.content}</Text>
        </View>
        <Text className="text-slate-500 text-xs mt-1 ml-1">
          {formatTime(msg.timestamp)}
        </Text>
      </View>
      
      {isCurrentUser && (
        <View className="w-8 h-8 rounded-full bg-slate-600 items-center justify-center ml-3 mt-1">
          <Text className="text-sm">{msg.userAvatar}</Text>
        </View>
      )}
    </View>
  );

  // Rediriger vers login si pas connecté
  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center">
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
    <SafeAreaView className="flex-1 bg-slate-900">
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
          renderItem={({ item }) => <ParticipantAvatar participant={item} />}
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
            <TouchableOpacity className="w-10 h-10 bg-slate-700 rounded-full items-center justify-center">
              <Ionicons name="camera" size={20} color="#64748b" />
            </TouchableOpacity>
            
            <TouchableOpacity className="w-10 h-10 bg-slate-700 rounded-full items-center justify-center">
              <Ionicons name="image" size={20} color="#64748b" />
            </TouchableOpacity>
            
            <View className="flex-1 bg-slate-700 rounded-full px-4 py-3 flex-row items-center">
              <TextInput
                className="text-white flex-1 text-base"
                placeholder="Tapez votre message..."
                placeholderTextColor="#64748b"
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={500}
                editable={!sending}
              />
            </View>
            
            <TouchableOpacity 
              className={`w-10 h-10 bg-blue-500 rounded-full items-center justify-center ${sending ? 'opacity-50' : ''}`}
              onPress={sendMessage}
              disabled={sending || !message.trim()}
            >
              <Ionicons name="send" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 