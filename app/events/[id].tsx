import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";

export default function EventDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  // Mock data - in a real app, you'd fetch this based on the ID
  const eventData = {
    title: "Football Championship",
    date: "Today, 6:00 PM",
    location: "Central Stadium, Downtown",
    description: "Join us for an exciting football championship match. All skill levels welcome!",
    participants: 22,
    maxParticipants: 24,
    organizer: "Sports Club FC",
    price: "Free",
    category: "Football",
    color: "#4CAF50"
  };

  const participants = [
    { name: "John Doe", avatar: "👤" },
    { name: "Jane Smith", avatar: "👤" },
    { name: "Mike Johnson", avatar: "👤" },
    { name: "Sarah Wilson", avatar: "👤" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-4">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">Event Details</Text>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1">
        {/* Event Header */}
        <View className="px-4 mb-6">
          <View 
            className="rounded-2xl p-6 mb-4"
            style={{ backgroundColor: eventData.color }}
          >
            <Text className="text-white text-2xl font-bold mb-2">{eventData.title}</Text>
            <Text className="text-white/90 text-base">{eventData.category}</Text>
          </View>
        </View>

        {/* Event Info */}
        <View className="px-4 mb-6">
          <View className="bg-slate-800 rounded-2xl p-4">
            <View className="flex-row items-center mb-4">
              <Ionicons name="calendar" size={20} color="#3b82f6" />
              <Text className="text-white ml-3 text-base">{eventData.date}</Text>
            </View>
            
            <View className="flex-row items-center mb-4">
              <Ionicons name="location" size={20} color="#3b82f6" />
              <Text className="text-white ml-3 text-base">{eventData.location}</Text>
            </View>
            
            <View className="flex-row items-center mb-4">
              <Ionicons name="person" size={20} color="#3b82f6" />
              <Text className="text-white ml-3 text-base">
                {eventData.participants}/{eventData.maxParticipants} participants
              </Text>
            </View>
            
            <View className="flex-row items-center">
              <Ionicons name="card" size={20} color="#3b82f6" />
              <Text className="text-white ml-3 text-base">{eventData.price}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View className="px-4 mb-6">
          <Text className="text-white text-lg font-semibold mb-3">Description</Text>
          <View className="bg-slate-800 rounded-2xl p-4">
            <Text className="text-slate-300 text-base leading-6">{eventData.description}</Text>
          </View>
        </View>

        {/* Organizer */}
        <View className="px-4 mb-6">
          <Text className="text-white text-lg font-semibold mb-3">Organizer</Text>
          <View className="bg-slate-800 rounded-2xl p-4 flex-row items-center">
            <View className="w-12 h-12 bg-blue-500 rounded-full items-center justify-center mr-3">
              <Text className="text-white font-bold">SC</Text>
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold">{eventData.organizer}</Text>
              <Text className="text-slate-400 text-sm">Event Organizer</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="chatbubble-outline" size={20} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Participants */}
        <View className="px-4 mb-6">
          <Text className="text-white text-lg font-semibold mb-3">Participants</Text>
          <View className="bg-slate-800 rounded-2xl p-4">
            {participants.map((participant, index) => (
              <View key={index} className="flex-row items-center mb-3 last:mb-0">
                <View className="w-10 h-10 bg-slate-700 rounded-full items-center justify-center mr-3">
                  <Text className="text-white">{participant.avatar}</Text>
                </View>
                <Text className="text-white flex-1">{participant.name}</Text>
              </View>
            ))}
            <TouchableOpacity className="mt-3 pt-3 border-t border-slate-700">
              <Text className="text-blue-400 text-center">View all participants</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom spacing */}
        <View className="h-32" />
      </ScrollView>

      {/* Join Button */}
      <View className="px-4 pb-4">
        <TouchableOpacity 
          className="bg-blue-500 rounded-2xl py-4 items-center"
          style={{ backgroundColor: eventData.color }}
          onPress={() => {
            // Simulation de rejoindre l'événement et création automatique du groupe de chat
            console.log("Joined event:", eventData.title);
            console.log("Chat group created automatically for event:", id);
            // Redirection vers la page de chat principale où le nouveau groupe apparaîtra
            router.push("/chat");
          }}
        >
          <Text className="text-white font-bold text-lg">Join Event</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}