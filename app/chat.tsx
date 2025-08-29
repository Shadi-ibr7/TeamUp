import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from '../lib/context/AuthContext';
import { ChatService } from '../lib/services/chat';
import { EventService } from '../lib/services/events';

const COLORS = {
  background: '#F2F4F7',
  surface: '#FFFFFF',
  text: '#0F172A',
  subtitle: '#475569',
  muted: '#94A3B8',
  border: '#E2E8F0',
  accent: '#3B82F6',
};

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
      const userEvents = await EventService.getUserEvents(user?.id || '');
      
      const groups: ChatGroup[] = await Promise.all(
        userEvents.map(async (event: any) => {
          try {
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
      setChatGroups(mockChatGroups);
    } finally {
      setLoading(false);
    }
  };

  const getSportIcon = (sport: string) => {
    const icons: { [key: string]: string } = {
      'Football': '⚽',
      'Basketball': '🏀',
      'Tennis': '\ud83c\udfbe',
      'Running': '🏃‍♂️',
      'Cycling': '🚴‍♂️',
      'Swimming': '🏊‍♂️'
    };
    return icons[sport] || '\ud83c\udfdf️';
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
    
    if (diffInMinutes < 1) return 'Maintenant';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}j`;
  };

  const mockChatGroups: ChatGroup[] = [
    {
      id: "1",
      eventTitle: "Tournoi de foot",
      eventType: "Football",
      lastMessage: "Salut tout le monde",
      lastMessageTime: "26j",
      unreadCount: 3,
      participants: 22,
      eventColor: "#22c55e",
      eventIcon: "⚽",
      isActive: true
    },
    {
      id: "2",
      eventTitle: "Match amical",
      eventType: "Basketball",
      lastMessage: "Aucun message pour le moment",
      lastMessageTime: "Nouveau",
      unreadCount: 0,
      participants: 2,
      eventColor: "#f59e0b",
      eventIcon: "\ud83c\udfc0",
      isActive: true
    }
  ];

  const filteredChats = chatGroups.filter(chat =>
    chat.eventTitle.toLowerCase().includes(searchText.toLowerCase()) ||
    chat.eventType.toLowerCase().includes(searchText.toLowerCase())
  );

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: 24, backgroundColor: COLORS.accent }}>
            <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 36 }}>T</Text>
          </View>
          <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '700', marginBottom: 16 }}>Connectez-vous</Text>
          <Text style={{ color: COLORS.subtitle, textAlign: 'center', marginBottom: 32 }}>
            Vous devez être connecté pour accéder aux chats
          </Text>
          <Link href="/auth/login" asChild>
            <TouchableOpacity style={{ backgroundColor: COLORS.accent, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 32, marginBottom: 16, width: '100%' }}>
              <Text style={{ color: '#ffffff', fontWeight: '700', fontSize: 18, textAlign: 'center' }}>Se connecter</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      
      {/* Header clair */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16 }}>
        <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '700' }}>Messages</Text>
        <TouchableOpacity onPress={() => setShowSearch(!showSearch)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border }}>
          <Ionicons name="search-outline" size={18} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          <View style={{ backgroundColor: COLORS.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
            <Ionicons name="search" size={18} color={COLORS.muted} />
            <TextInput
              style={{ marginLeft: 10, flex: 1, color: COLORS.text, fontSize: 16 }}
              placeholder="Rechercher une conversation..."
              placeholderTextColor={COLORS.muted}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>
      )}

      {/* Chat List */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 80 }}>
            <Text style={{ color: COLORS.subtitle, fontSize: 16 }}>Chargement des messages...</Text>
          </View>
        ) : filteredChats.length === 0 ? (
          <View style={{ justifyContent: 'center', alignItems: 'center', paddingVertical: 80 }}>
            <Ionicons name="chatbubble-outline" size={48} color={COLORS.muted} />
            <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 }}>Aucun message</Text>
            <Text style={{ color: COLORS.subtitle, textAlign: 'center' }}>Rejoignez un événement pour commencer à discuter</Text>
          </View>
        ) : (
          <View style={{ paddingBottom: 16 }}>
            {filteredChats.map((chat) => (
              <TouchableOpacity
                key={chat.id}
                style={{ backgroundColor: COLORS.surface, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } }}
                onPress={() => router.push(`/chat/${chat.id}`)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 48, height: 48, backgroundColor: '#EEF2FF', borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12, borderWidth: 1, borderColor: COLORS.border }}>
                    <Text style={{ color: COLORS.text, fontWeight: '700', fontSize: 18 }}>
                      {chat.eventTitle?.charAt(0) || 'E'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: COLORS.text, fontWeight: '700', fontSize: 16 }}>{chat.eventTitle}</Text>
                    <Text style={{ color: COLORS.subtitle, fontSize: 13 }}>
                      {chat.lastMessage || 'Aucun message'}
                    </Text>
                    <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>
                      {chat.participants} participants
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 8 }}>
                      {chat.lastMessageTime || ''}
                    </Text>
                    {chat.unreadCount > 0 && (
                      <View style={{ backgroundColor: COLORS.accent, borderRadius: 999, minWidth: 22, height: 22, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
                        <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>
                          {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
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

      {/* Bottom Navigation clair */}
      <View style={{ backgroundColor: COLORS.surface, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderTopWidth: 1, borderColor: COLORS.border }}>
        <Link href="/" asChild>
          <TouchableOpacity style={{ alignItems: 'center' }}>
            <Ionicons name="home-outline" size={22} color={COLORS.muted} />
            <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>Home</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/events" asChild>
          <TouchableOpacity style={{ alignItems: 'center' }}>
            <Ionicons name="calendar-outline" size={22} color={COLORS.muted} />
            <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>Events</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/discover" asChild>
          <TouchableOpacity style={{ alignItems: 'center' }}>
            <Ionicons name="location-outline" size={22} color={COLORS.muted} />
            <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>Discover</Text>
          </TouchableOpacity>
        </Link>
        <TouchableOpacity style={{ alignItems: 'center' }}>
          <Ionicons name="chatbubble" size={22} color={COLORS.accent} />
          <Text style={{ color: COLORS.accent, fontSize: 12, marginTop: 4, fontWeight: '600' }}>Chat</Text>
        </TouchableOpacity>
        <Link href="/profile" asChild>
          <TouchableOpacity style={{ alignItems: 'center' }}>
            <Ionicons name="person-outline" size={22} color={COLORS.muted} />
            <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>Profile</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
  );
} 