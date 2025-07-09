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
  const flatListRef = useRef<FlatList>(null);

  // Debug: log the eventId
  console.log("Event ID received:", eventId);

  // Participants fictifs
  const participants: Participant[] = [
    { id: '1', name: 'Isabella', avatar: '👩🏻‍💼', isOnline: true },
    { id: '2', name: 'Lucas', avatar: '👨🏻‍💻', isOnline: true },
    { id: '3', name: 'Ava', avatar: '👩🏼‍🎨', isOnline: false },
    { id: '4', name: 'Noah', avatar: '👨🏽‍⚕️', isOnline: true },
    { id: '5', name: 'Emma', avatar: '👩🏻‍🏫', isOnline: true },
  ];

  // Messages fictifs
  const initialMessages: Message[] = [
    {
      id: '1',
      userId: '2',
      userName: 'Lucas',
      userAvatar: '👨🏻‍💻',
      content: 'Hey everyone.',
      timestamp: new Date(Date.now() - 3600000),
      type: 'text'
    },
    {
      id: '2',
      userId: '1',
      userName: 'Isabella',
      userAvatar: '👩🏻‍💼',
      content: 'Yes, that\'s exactly what we wanted',
      timestamp: new Date(Date.now() - 3000000),
      type: 'text'
    },
    {
      id: '3',
      userId: '2',
      userName: 'Lucas',
      userAvatar: '👨🏻‍💻',
      content: 'Sounds good!',
      timestamp: new Date(Date.now() - 2400000),
      type: 'text'
    },
    {
      id: '4',
      userId: '3',
      userName: 'Ava',
      userAvatar: '👩🏼‍🎨',
      content: 'Me too!',
      timestamp: new Date(Date.now() - 1800000),
      type: 'text'
    },
    {
      id: '5',
      userId: '1',
      userName: 'Isabella',
      userAvatar: '👩🏻‍💼',
      content: 'Great! If you want to join forward this to the group.',
      timestamp: new Date(Date.now() - 900000),
      type: 'text'
    }
  ];

  useEffect(() => {
    setMessages(initialMessages);
  }, []);

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        userId: 'current_user',
        userName: 'You',
        userAvatar: '👤',
        content: message.trim(),
        timestamp: new Date(),
        type: 'text'
      };
      setMessages(prev => [...prev, newMessage]);
      setMessage("");
      // Auto-scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

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

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Header */}
      <View className="flex-row items-center px-4 py-4 bg-slate-800 border-b border-slate-700">
        <Link href="/events" asChild>
          <TouchableOpacity className="mr-4">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </Link>
        <View className="flex-1">
          <Text className="text-white text-lg font-semibold">Event Chat {eventId}</Text>
          <Text className="text-slate-400 text-sm">{participants.filter(p => p.isOnline).length} participants online</Text>
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
          <Text className="text-slate-500 text-xs text-center py-3">Messages</Text>
          
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble 
                message={item} 
                isCurrentUser={item.userId === 'current_user'} 
              />
            )}
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
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
                placeholder="Type a message..."
                placeholderTextColor="#64748b"
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={500}
              />
            </View>
            
            <TouchableOpacity 
              className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center"
              onPress={sendMessage}
            >
              <Ionicons name="send" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 