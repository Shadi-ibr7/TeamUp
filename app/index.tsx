import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useState } from "react";
import { Alert, SafeAreaView, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { EventService } from '../lib/services/events';

export default function Index() {
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [isConnected, setIsConnected] = useState(false);

  // Test de connexion Supabase
  const testSupabaseConnection = async () => {
    try {
      const events = await EventService.getEvents();
      Alert.alert('Succès', `Connecté à Supabase ! ${events.length} événements trouvés.`);
      setIsConnected(true);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de se connecter à Supabase. Vérifiez votre configuration.');
      console.error('Supabase error:', error);
    }
  };

  const filters = ["All", "Today", "This Week", "Football", "Basketball", "Tennis"];

  const sportsCategories = [
    {
      title: "Events Happening Now",
      events: [
        { 
          id: 1,
          name: "Football Match", 
          time: "Live", 
          location: "Stadium A",
          image: "🏟️",
          color: "#22c55e",
          isLive: true
        },
        { 
          id: 2,
          name: "Basketball Game", 
          time: "Live", 
          location: "Court B",
          image: "🏀",
          color: "#f59e0b",
          isLive: true
        }
      ]
    },
    {
      title: "Football",
      events: [
        { 
          id: 3,
          name: "La Liga", 
          time: "Friendly Game", 
          participants: "22 Players", 
          location: "Central Park",
          image: "⚽",
          color: "#16a34a" 
        },
        { 
          id: 4,
          name: "Premier League", 
          time: "Championship", 
          participants: "18 Teams", 
          location: "Sports Complex",
          image: "🏆",
          color: "#2563eb" 
        }
      ]
    },
    {
      title: "Basketball",
      events: [
        { 
          id: 5,
          name: "3v3 Tournament", 
          time: "Pickup Game", 
          participants: "6 Players", 
          location: "Street Court",
          image: "🏀",
          color: "#dc2626" 
        },
        { 
          id: 6,
          name: "Finals Game", 
          time: "Championship", 
          participants: "2 Teams", 
          location: "Arena",
          image: "🏆",
          color: "#7c3aed" 
        }
      ]
    },
    {
      title: "Tennis/Padel",
      events: [
        { 
          id: 7,
          name: "Doubles Match", 
          time: "Padel Tournament", 
          participants: "4 Players", 
          location: "Tennis Club",
          image: "🎾",
          color: "#0891b2" 
        },
        { 
          id: 8,
          name: "Padel Tournament", 
          time: "Singles", 
          participants: "8 Players", 
          location: "Padel Center",
          image: "🏓",
          color: "#ea580c" 
        }
      ]
    },
    {
      title: "Running",
      events: [
        { 
          id: 9,
          name: "5K Race", 
          time: "Marathon", 
          participants: "50+ Runners", 
          location: "City Park",
          image: "🏃‍♂️",
          color: "#d97706" 
        },
        { 
          id: 10,
          name: "Trail Run", 
          time: "10K Challenge", 
          participants: "25 Runners", 
          location: "Forest Trail",
          image: "🌲",
          color: "#65a30d" 
        }
      ]
    },
    {
      title: "Don't Miss",
      events: [
        { 
          id: 11,
          name: "Ultimate Frisbee Tournament", 
          time: "Championship", 
          participants: "8 Teams", 
          location: "Beach Park",
          image: "🥏",
          color: "#059669" 
        },
        { 
          id: 12,
          name: "Volleyball Beach Tournament", 
          time: "Summer League", 
          participants: "12 Teams", 
          location: "Beach Court",
          image: "🏐",
          color: "#0284c7" 
        }
      ]
    },
    {
      title: "Cycling Group Ride",
      events: [
        { 
          id: 13,
          name: "Mountain Bike", 
          time: "Trail Ride", 
          participants: "15 Cyclists", 
          location: "Mountain Trail",
          image: "🚵‍♂️",
          color: "#16a34a" 
        },
        { 
          id: 14,
          name: "Road Cycling", 
          time: "Group Ride", 
          participants: "20 Cyclists", 
          location: "City Route",
          image: "🚴‍♂️",
          color: "#475569" 
        },
        { 
          id: 15,
          name: "BMX Competition", 
          time: "Freestyle", 
          participants: "12 Riders", 
          location: "Skate Park",
          image: "🚲",
          color: "#7c2d12" 
        },
        { 
          id: 16,
          name: "Cycling Marathon", 
          time: "Long Distance", 
          participants: "30 Cyclists", 
          location: "Highway Route",
          image: "🏁",
          color: "#1e40af" 
        }
      ]
    }
  ];

  const filteredCategories = sportsCategories.map(category => ({
    ...category,
    events: category.events.filter(event => 
      event.name.toLowerCase().includes(searchText.toLowerCase()) ||
      event.location.toLowerCase().includes(searchText.toLowerCase()) ||
      event.time.toLowerCase().includes(searchText.toLowerCase())
    )
  })).filter(category => category.events.length > 0);

  const EventCard = ({ event, isLive = false }) => (
    <Link href={`/events/${event.id}`} asChild>
      <TouchableOpacity 
        className="mr-4 rounded-3xl overflow-hidden shadow-lg"
        style={{ 
          backgroundColor: event.color,
          width: isLive ? 160 : 200,
          height: isLive ? 110 : 140
        }}
      >
        <View className="flex-1 p-4 justify-between relative">
          {isLive && (
            <View className="absolute top-3 right-3 bg-red-500 px-2 py-1 rounded-full">
              <Text className="text-white text-xs font-bold">LIVE</Text>
            </View>
          )}
          
          <View className="flex-1 justify-between">
            <View>
              <Text className="text-white font-bold text-lg mb-1">{event.name}</Text>
              <Text className="text-white/90 text-sm">{event.time}</Text>
            </View>
            
            <View className="mt-2">
              <Text className="text-white/80 text-xs">{event.location}</Text>
              {event.participants && (
                <Text className="text-white/90 text-xs font-medium mt-1">{event.participants}</Text>
              )}
            </View>
          </View>
          
          <View className="absolute bottom-2 right-2 text-4xl opacity-20">
            <Text style={{ fontSize: 30 }}>{event.image}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );

  const CategorySection = ({ category }) => (
    <View className="mb-8">
      <View className="flex-row justify-between items-center mb-4 px-4">
        <Text className="text-white text-xl font-bold">{category.title}</Text>
        <TouchableOpacity>
          <Text className="text-blue-400 text-sm font-medium">See All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {category.events.map((event) => (
          <EventCard 
            key={event.id} 
            event={event} 
            isLive={category.title === "Events Happening Now"}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-4">
        <View className="flex-row items-center">
          <View className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mr-3 items-center justify-center">
            <Text className="text-white font-bold text-xl">T</Text>
          </View>
          <View>
            <Text className="text-white text-2xl font-bold">TeamUp!</Text>
            <Text className="text-slate-400 text-sm">Find your game</Text>
          </View>
        </View>
        <View className="flex-row items-center space-x-3">
          <TouchableOpacity 
            onPress={testSupabaseConnection}
            className={`px-3 py-1 rounded-full ${isConnected ? 'bg-green-500' : 'bg-blue-500'}`}
          >
            <Text className="text-white text-xs font-medium">
              {isConnected ? 'DB ✓' : 'Test DB'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="relative">
            <Ionicons name="notifications-outline" size={26} color="white" />
            <View className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View className="mx-4 mb-4">
        <View className="bg-slate-800 rounded-2xl px-4 py-4 flex-row items-center border border-slate-700">
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            className="text-white ml-3 flex-1 text-base"
            placeholder="Search events, sports, locations..."
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

      {/* Filters */}
      <View className="mb-6">
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setSelectedFilter(filter)}
              className={`mr-3 px-4 py-2 rounded-full ${
                selectedFilter === filter 
                  ? 'bg-blue-500' 
                  : 'bg-slate-800 border border-slate-700'
              }`}
            >
              <Text className={`font-medium ${
                selectedFilter === filter 
                  ? 'text-white' 
                  : 'text-slate-400'
              }`}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category, index) => (
            <CategorySection key={index} category={category} />
          ))
        ) : (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="search" size={48} color="#64748b" />
            <Text className="text-slate-400 text-lg mt-4">No events found</Text>
            <Text className="text-slate-500 text-sm mt-2">Try adjusting your search</Text>
          </View>
        )}
        
        {/* Bottom spacing */}
        <View className="h-24" />
      </ScrollView>

      {/* Bottom Navigation */}
      <View className="bg-slate-800 flex-row justify-around items-center py-4 px-4 border-t border-slate-700">
        <TouchableOpacity className="items-center">
          <Ionicons name="home" size={24} color="#3b82f6" />
          <Text className="text-blue-500 text-xs mt-1 font-medium">Home</Text>
        </TouchableOpacity>
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
        <Link href="/chat" asChild>
          <TouchableOpacity className="items-center">
            <Ionicons name="chatbubble-outline" size={24} color="#64748b" />
            <Text className="text-slate-400 text-xs mt-1">Chat</Text>
          </TouchableOpacity>
        </Link>
        <TouchableOpacity className="items-center">
          <Ionicons name="person-outline" size={24} color="#64748b" />
          <Text className="text-slate-400 text-xs mt-1">Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
