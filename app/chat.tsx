import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, SafeAreaView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";

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

  // Simulation des groupes de chat des événements rejoints
  const joinedEventChats: ChatGroup[] = [
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

  useEffect(() => {
    setChatGroups(joinedEventChats);
  }, []);

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

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-slate-800">
        <Text className="text-white text-2xl font-bold">Chats</Text>
        <View className="flex-row space-x-4">
          <TouchableOpacity>
            <Ionicons name="camera" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="add-circle" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View className="px-4 py-3 bg-slate-800">
        <View className="bg-slate-700 rounded-full px-4 py-3 flex-row items-center">
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            className="text-white ml-3 flex-1 text-base"
            placeholder="Search chats..."
            placeholderTextColor="#64748b"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Ionicons name="close-circle" size={20} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Chat Groups List */}
      <View className="flex-1">
        {filteredChats.length > 0 ? (
          <FlatList
            data={filteredChats}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ChatGroupItem group={item} />}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-8">
            <View className="w-24 h-24 bg-slate-800 rounded-full items-center justify-center mb-4">
              <Ionicons name="chatbubble-outline" size={40} color="#64748b" />
            </View>
            <Text className="text-slate-400 text-lg font-medium mb-2">No chats yet</Text>
            <Text className="text-slate-500 text-center">
              Join an event to start chatting with other participants!
            </Text>
            <Link href="/events" asChild>
              <TouchableOpacity className="bg-blue-500 rounded-full px-6 py-3 mt-6">
                <Text className="text-white font-semibold">Browse Events</Text>
              </TouchableOpacity>
            </Link>
          </View>
        )}
      </View>

      {/* Bottom Navigation */}
      <View className="bg-slate-800 flex-row justify-around items-center py-4 px-4 border-t border-slate-700">
        <Link href="/" asChild>
          <TouchableOpacity className="items-center">
            <Ionicons name="home-outline" size={24} color="#64748b" />
            <Text className="text-slate-400 text-xs mt-1">Home</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/events" asChild>
          <TouchableOpacity className="items-center">
            <Ionicons name="calendar-outline" size={24} color="#64748b" />
            <Text className="text-slate-400 text-xs mt-1">Events</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/discover" asChild>
          <TouchableOpacity className="items-center">
            <Ionicons name="location-outline" size={24} color="#64748b" />
            <Text className="text-slate-400 text-xs mt-1">Discover</Text>
          </TouchableOpacity>
        </Link>
        <TouchableOpacity className="items-center">
          <Ionicons name="chatbubble" size={24} color="#3b82f6" />
          <Text className="text-blue-500 text-xs mt-1 font-medium">Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center">
          <Ionicons name="person-outline" size={24} color="#64748b" />
          <Text className="text-slate-400 text-xs mt-1">Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
} 