import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from '../lib/context/AuthContext';
import { ChatService } from '../lib/services/chat';
import { EventService } from '../lib/services/events';

interface ChatGroup {
  id: string;
  eventTitle: string;
  eventType: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  participants: number;
  eventColor: string;
  eventIcon: string;
  isActive: boolean;
}

export default function ChatMain() {
  const [searchText, setSearchText] = useState("");
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadUserEvents();
    }
  }, [user]);

  const loadUserEvents = async () => {
    try {
      setLoading(true);
      // Récupérer les événements de l'utilisateur (événements rejoints)
      const userEvents = await EventService.getUserEvents(user?.id || '');
      
      // Convertir en format ChatGroup avec les derniers messages
      const groups: ChatGroup[] = await Promise.all(
        userEvents.map(async (event: any) => {
          try {
            // Récupérer le dernier message de chaque événement
            const lastMessage = await ChatService.getLastMessage(event.id);
            
            return {
              id: event.id.toString(),
              eventTitle: event.title,
              eventType: event.sport_type,
              lastMessage: lastMessage?.content || "Aucun message pour le moment",
              lastMessageTime: lastMessage ? formatTimeAgo(lastMessage.created_at) : "Nouveau",
              unreadCount: await ChatService.getUnreadCount(event.id, user?.id || ''),
              participants: event.current_participants || 0,
              eventColor: getSportColor(event.sport_type),
              eventIcon: getSportIcon(event.sport_type),
              isActive: event.is_active
            };
          } catch (error) {
            // En cas d'erreur pour un événement spécifique, utiliser des valeurs par défaut
            return {
              id: event.id.toString(),
              eventTitle: event.title,
              eventType: event.sport_type,
              lastMessage: "Groupe de chat créé",
              lastMessageTime: formatTimeAgo(event.created_at),
              unreadCount: 0,
              participants: event.current_participants || 0,
              eventColor: getSportColor(event.sport_type),
              eventIcon: getSportIcon(event.sport_type),
              isActive: event.is_active
            };
          }
        })
      );

      setChatGroups(groups);
    } catch (error) {
      console.error('Erreur lors du chargement des groupes de chat:', error);
      // Utiliser les données mock en cas d'erreur
      setChatGroups(mockChatGroups);
    } finally {
      setLoading(false);
    }
  };

  const getSportIcon = (sport: string) => {
    const icons: { [key: string]: string } = {
      'Football': '⚽',
      'Basketball': '🏀',
      'Tennis': '🎾',
      'Running': '🏃‍♂️',
      'Cycling': '🚴‍♂️',
      'Swimming': '🏊‍♂️'
    };
    return icons[sport] || '🏟️';
  };

  const getSportColor = (sport: string) => {
    const colors: { [key: string]: string } = {
      'Football': '#22c55e',
      'Basketball': '#f59e0b',
      'Tennis': '#0891b2',
      'Running': '#d97706',
      'Cycling': '#16a34a',
      'Swimming': '#0284c7'
    };
    return colors[sport] || '#6b7280';
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  // Données mock de secours
  const mockChatGroups: ChatGroup[] = [
    {
      id: "1",
      eventTitle: "Football Championship",
      eventType: "Football",
      lastMessage: "Great! If you want to join forward this to the group.",
      lastMessageTime: "15 min",
      unreadCount: 3,
      participants: 22,
      eventColor: "#22c55e",
      eventIcon: "⚽",
      isActive: true
    },
    {
      id: "2",
      eventTitle: "Basketball Tournament",
      eventType: "Basketball",
      lastMessage: "See you tomorrow at 2 PM!",
      lastMessageTime: "1h",
      unreadCount: 0,
      participants: 16,
      eventColor: "#f59e0b",
      eventIcon: "🏀",
      isActive: true
    },
    {
      id: "3",
      eventTitle: "Tennis Match",
      eventType: "Tennis",
      lastMessage: "Who's bringing the water bottles?",
      lastMessageTime: "3h",
      unreadCount: 1,
      participants: 8,
      eventColor: "#0891b2",
      eventIcon: "🎾",
      isActive: true
    },
    {
      id: "4",
      eventTitle: "Running Group",
      eventType: "Running",
      lastMessage: "Weather looks perfect for tomorrow!",
      lastMessageTime: "Yesterday",
      unreadCount: 0,
      participants: 15,
      eventColor: "#d97706",
      eventIcon: "🏃‍♂️",
      isActive: false
    }
  ];

  const filteredChats = chatGroups.filter(chat =>
    chat.eventTitle.toLowerCase().includes(searchText.toLowerCase()) ||
    chat.eventType.toLowerCase().includes(searchText.toLowerCase())
  );

  const ChatGroupItem = ({ group }: { group: ChatGroup }) => (
    <Link href={`/chat/${group.id}`} asChild>
      <TouchableOpacity className="flex-row items-center px-4 py-4 border-b border-slate-800">
        {/* Event Icon */}
        <View 
          className="w-14 h-14 rounded-full items-center justify-center mr-4"
          style={{ backgroundColor: group.eventColor }}
        >
          <Text style={{ fontSize: 24 }}>{group.eventIcon}</Text>
        </View>

        {/* Chat Info */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-white font-semibold text-lg">{group.eventTitle}</Text>
            <Text className="text-slate-400 text-sm">{group.lastMessageTime}</Text>
          </View>
          
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-2">
              <Text className="text-slate-400 text-sm" numberOfLines={1}>
                {group.lastMessage}
              </Text>
              <Text className="text-slate-500 text-xs mt-1">
                {group.participants} participants
              </Text>
            </View>
            
            <View className="items-end">
              {group.unreadCount > 0 && (
                <View className="bg-blue-500 rounded-full min-w-6 h-6 items-center justify-center px-2">
                  <Text className="text-white text-xs font-bold">
                    {group.unreadCount > 99 ? "99+" : group.unreadCount}
                  </Text>
                </View>
              )}
              {group.isActive && (
                <View className="w-3 h-3 bg-green-500 rounded-full mt-1" />
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
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
            Vous devez être connecté pour accéder aux chats
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
    <SafeAreaView className="flex-1 bg-[#141A1F]">
      <StatusBar barStyle="light-content" backgroundColor="#141A1F" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-[#141A1F]">
        <Text className="text-[#FFFFFF] text-2xl font-bold">Messages</Text>
        <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
          <Ionicons name="search-outline" size={24} color="#C4D9EB" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View className="px-4 py-2">
          <View className="bg-[#2B3840] rounded-2xl px-4 py-3 flex-row items-center border border-[#2B3840]">
            <Ionicons name="search" size={20} color="#9EB0BD" />
            <TextInput
              className="flex-1 ml-3 text-[#FFFFFF] text-base"
              placeholder="Rechercher une conversation..."
              placeholderTextColor="#9EB0BD"
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>
      )}

      {/* Chat List */}
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {loading ? (
          <View className="flex-1 justify-center items-center py-20">
            <Text className="text-[#9EB0BD] text-lg">Chargement des messages...</Text>
          </View>
        ) : filteredChats.length === 0 ? (
          <View className="flex-1 justify-center items-center py-20">
            <Ionicons name="chatbubble-outline" size={64} color="#9EB0BD" />
            <Text className="text-[#9EB0BD] text-lg font-medium mt-4 mb-2">Aucun message</Text>
            <Text className="text-[#9EB0BD] text-center">Rejoignez un événement pour commencer à discuter</Text>
          </View>
        ) : (
          <View className="pb-4">
            {filteredChats.map((chat) => (
              <TouchableOpacity
                key={chat.id}
                className="bg-[#2B3840] rounded-2xl p-4 mb-3 border border-[#2B3840]"
                onPress={() => router.push(`/chat/${chat.id}`)}
              >
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-[#C4D9EB] rounded-full items-center justify-center mr-3">
                    <Text className="text-[#141A1F] font-bold text-lg">
                      {chat.eventTitle?.charAt(0) || 'E'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[#FFFFFF] font-bold text-lg">{chat.eventTitle}</Text>
                    <Text className="text-[#9EB0BD] text-sm" numberOfLines={1}>
                      {chat.lastMessage || 'Aucun message'}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[#C4D9EB] text-xs">
                      {chat.lastMessageTime || ''}
                    </Text>
                    {chat.unreadCount > 0 && (
                      <View className="bg-[#C4D9EB] rounded-full w-6 h-6 items-center justify-center mt-1">
                        <Text className="text-[#141A1F] text-xs font-bold">
                          {chat.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <SafeAreaView edges={['bottom']} className="bg-[#141A1F]">
        <View className="bg-[#2B3840] flex-row justify-around items-center py-2 px-2 border-t border-[#2B3840]">
          <Link href="/" asChild>
            <TouchableOpacity className="items-center">
              <Ionicons name="home-outline" size={24} color="#9EB0BD" />
              <Text className="text-[#9EB0BD] text-xs mt-1">Home</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/events" asChild>
            <TouchableOpacity className="items-center">
              <Ionicons name="calendar-outline" size={24} color="#9EB0BD" />
              <Text className="text-[#9EB0BD] text-xs mt-1">Events</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/discover" asChild>
            <TouchableOpacity className="items-center">
              <Ionicons name="location-outline" size={24} color="#9EB0BD" />
              <Text className="text-[#9EB0BD] text-xs mt-1">Discover</Text>
            </TouchableOpacity>
          </Link>
          <TouchableOpacity className="items-center">
            <Ionicons name="chatbubble" size={24} color="#C4D9EB" />
            <Text className="text-[#C4D9EB] text-xs mt-1 font-medium">Chat</Text>
          </TouchableOpacity>
          <Link href="/profile" asChild>
            <TouchableOpacity className="items-center">
              <Ionicons name="person-outline" size={24} color="#9EB0BD" />
              <Text className="text-[#9EB0BD] text-xs mt-1">Profile</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
} 