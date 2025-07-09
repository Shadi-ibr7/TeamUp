import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useState } from "react";
import { SafeAreaView, ScrollView, StatusBar, Text, TouchableOpacity, View } from "react-native";

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState(5); // 5 octobre comme sur la photo
  const [currentMonth, setCurrentMonth] = useState("October");
  const [currentYear, setCurrentYear] = useState("2024");

  // Données du calendrier pour octobre 2024 (commence un mardi)
  const calendarDays = [
    null, null, 1, 2, 3, 4, 5,  // Première semaine (octobre commence un mardi)
    6, 7, 8, 9, 10, 11, 12,     // Deuxième semaine
    13, 14, 15, 16, 17, 18, 19, // Troisième semaine
    20, 21, 22, 23, 24, 25, 26, // Quatrième semaine
    27, 28, 29, 30, 31, null, null, // Cinquième semaine
    null, null, null, null, null, null, null // Sixième semaine (vide)
  ];

  const daysOfWeek = ["S", "M", "T", "W", "T", "F", "S"];

  // Événements par date
  const eventsByDate = {
    5: [
      {
        id: 1,
        title: "Community Basketball Game",
        type: "Basketball",
        time: "2:00 PM",
        location: "Sports Center",
        participants: "12/16 players",
        icon: "🏀",
        color: "#f59e0b"
      },
      {
        id: 2,
        title: "Soccer Tournament",
        type: "Soccer",
        time: "4:00 PM", 
        location: "Central Park",
        participants: "18/22 players",
        icon: "⚽",
        color: "#22c55e"
      },
      {
        id: 3,
        title: "Tennis Doubles Match",
        type: "Tennis",
        time: "6:00 PM",
        location: "Tennis Club",
        participants: "4/8 players", 
        icon: "🎾",
        color: "#0891b2"
      }
    ],
    12: [
      {
        id: 4,
        title: "Running Marathon",
        type: "Running",
        time: "7:00 AM",
        location: "City Park",
        participants: "50+ runners",
        icon: "🏃‍♂️",
        color: "#d97706"
      }
    ],
    18: [
      {
        id: 5,
        title: "Volleyball Tournament",
        type: "Volleyball",
        time: "3:00 PM",
        location: "Beach Court",
        participants: "8/12 teams",
        icon: "🏐",
        color: "#7c3aed"
      }
    ],
    25: [
      {
        id: 6,
        title: "Cycling Group Ride",
        type: "Cycling",
        time: "9:00 AM",
        location: "Mountain Trail",
        participants: "15/20 cyclists",
        icon: "🚴‍♂️",
        color: "#16a34a"
      }
    ]
  };

  const selectedEvents = eventsByDate[selectedDate] || [];

  const navigateMonth = (direction) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    const currentMonthIndex = months.indexOf(currentMonth);
    let newMonthIndex;
    let newYear = parseInt(currentYear);
    
    if (direction === 'next') {
      newMonthIndex = currentMonthIndex + 1;
      if (newMonthIndex > 11) {
        newMonthIndex = 0;
        newYear += 1;
      }
    } else {
      newMonthIndex = currentMonthIndex - 1;
      if (newMonthIndex < 0) {
        newMonthIndex = 11;
        newYear -= 1;
      }
    }
    
    setCurrentMonth(months[newMonthIndex]);
    setCurrentYear(newYear.toString());
    setSelectedDate(1); // Reset to first day of new month
  };

  const EventCard = ({ event }) => (
    <Link href={`/events/${event.id}`} asChild>
      <TouchableOpacity className="bg-slate-800 rounded-2xl p-4 mb-3 border border-slate-700">
        <View className="flex-row items-center">
          <View 
            className="w-12 h-12 rounded-2xl items-center justify-center mr-4"
            style={{ backgroundColor: event.color }}
          >
            <Text style={{ fontSize: 24 }}>{event.icon}</Text>
          </View>
          
          <View className="flex-1">
            <Text className="text-white font-bold text-lg">{event.title}</Text>
            <Text className="text-slate-400 text-sm">{event.type}</Text>
            <View className="flex-row items-center mt-1">
              <Ionicons name="time" size={14} color="#64748b" />
              <Text className="text-slate-400 text-sm ml-1">{event.time}</Text>
              <Ionicons name="location" size={14} color="#64748b" className="ml-3" />
              <Text className="text-slate-400 text-sm ml-1">{event.location}</Text>
            </View>
            <Text className="text-blue-400 text-sm mt-1">{event.participants}</Text>
          </View>
          
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </View>
      </TouchableOpacity>
    </Link>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-4">
        <Text className="text-white text-2xl font-bold">Sports Events</Text>
        <TouchableOpacity>
          <Ionicons name="options-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Calendar Navigation */}
      <View className="flex-row justify-between items-center px-4 py-4">
        <TouchableOpacity onPress={() => navigateMonth('prev')}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        
        <Text className="text-white text-xl font-semibold">
          {currentMonth} {currentYear}
        </Text>
        
        <TouchableOpacity onPress={() => navigateMonth('next')}>
          <Ionicons name="chevron-forward" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Days of Week Header */}
      <View className="flex-row justify-around px-4 py-2">
        {daysOfWeek.map((day, index) => (
          <View key={index} className="w-10 h-10 items-center justify-center">
            <Text className="text-slate-400 font-medium text-sm">{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View className="px-4 mb-6">
        {/* Generate calendar weeks */}
        {[0, 1, 2, 3, 4, 5].map((week) => (
          <View key={week} className="flex-row justify-around mb-2">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => {
              const dayIndex = week * 7 + day;
              const calendarDay = calendarDays[dayIndex];
              
              if (calendarDay === null || calendarDay === undefined) {
                return <View key={dayIndex} className="w-10 h-10" />;
              }
              
              const isSelected = calendarDay === selectedDate;
              const hasEvents = eventsByDate[calendarDay] && eventsByDate[calendarDay].length > 0;
              
              return (
                <TouchableOpacity
                  key={dayIndex}
                  onPress={() => setSelectedDate(calendarDay)}
                  className={`w-10 h-10 rounded-full items-center justify-center ${
                    isSelected 
                      ? 'bg-blue-500' 
                      : hasEvents 
                      ? 'bg-slate-700' 
                      : 'bg-transparent'
                  }`}
                >
                  <Text className={`font-medium text-base ${
                    isSelected 
                      ? 'text-white' 
                      : hasEvents 
                      ? 'text-white' 
                      : 'text-slate-300'
                  }`}>
                    {calendarDay}
                  </Text>
                  {hasEvents && !isSelected && (
                    <View className="absolute bottom-1 w-1 h-1 bg-blue-400 rounded-full" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Upcoming Events Section */}
      <View className="flex-1">
        <View className="px-4 mb-4">
          <Text className="text-white text-xl font-bold">
            {selectedEvents.length > 0 
              ? `Events on ${currentMonth} ${selectedDate}` 
              : 'Upcoming Events'
            }
          </Text>
        </View>

        <ScrollView 
          className="flex-1 px-4" 
          showsVerticalScrollIndicator={false}
        >
          {selectedEvents.length > 0 ? (
            selectedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="calendar-outline" size={48} color="#64748b" />
              <Text className="text-slate-400 text-lg mt-4">No events on this date</Text>
              <Text className="text-slate-500 text-sm mt-2">Select a different date or create an event</Text>
              
              <TouchableOpacity className="bg-blue-500 px-6 py-3 rounded-2xl mt-6">
                <Text className="text-white font-semibold">Create Event</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Bottom spacing */}
          <View className="h-24" />
        </ScrollView>
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
        <TouchableOpacity className="items-center">
          <Ionicons name="calendar" size={24} color="#3b82f6" />
          <Text className="text-blue-500 text-xs mt-1 font-medium">Calendar</Text>
        </TouchableOpacity>
        <Link href="/discover" asChild>
          <TouchableOpacity className="items-center">
            <Ionicons name="location-outline" size={24} color="#64748b" />
            <Text className="text-slate-400 text-xs mt-1">Discover</Text>
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