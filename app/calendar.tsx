import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useState } from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from '../lib/context/ThemeContext';

export default function Calendar() {
  const { isDarkMode, colors } = useTheme();
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
      <TouchableOpacity style={{ backgroundColor: isDarkMode ? colors.card : '#f8f9fa', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: isDarkMode ? colors.border : '#e9ecef' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View 
            style={{ width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 16, backgroundColor: event.color }}
          >
            <Text style={{ fontSize: 24 }}>{event.icon}</Text>
          </View>
          
          <View style={{ flex: 1 }}>
            <Text style={{ color: isDarkMode ? colors.foreground : '#111', fontWeight: 'bold', fontSize: 18 }}>{event.title}</Text>
            <Text style={{ color: isDarkMode ? colors.mutedForeground : '#666', fontSize: 14 }}>{event.type}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Ionicons name="time" size={14} color={isDarkMode ? colors.mutedForeground : '#666'} />
              <Text style={{ color: isDarkMode ? colors.mutedForeground : '#666', fontSize: 14, marginLeft: 4 }}>{event.time}</Text>
              <Ionicons name="location" size={14} color={isDarkMode ? colors.mutedForeground : '#666'} style={{ marginLeft: 12 }} />
              <Text style={{ color: isDarkMode ? colors.mutedForeground : '#666', fontSize: 14, marginLeft: 4 }}>{event.location}</Text>
            </View>
            <Text style={{ color: colors.primary, fontSize: 14, marginTop: 4 }}>{event.participants}</Text>
          </View>
          
          <Ionicons name="chevron-forward" size={20} color={isDarkMode ? colors.mutedForeground : '#666'} />
        </View>
      </TouchableOpacity>
    </Link>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* StatusBar géré globalement */}
      
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 }}>
        <Text style={{ color: isDarkMode ? colors.foreground : '#111', fontSize: 24, fontWeight: 'bold' }}>Sports Events</Text>
        <TouchableOpacity>
          <Ionicons name="options-outline" size={24} color={isDarkMode ? colors.foreground : '#111'} />
        </TouchableOpacity>
      </View>

      {/* Calendar Navigation */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 }}>
        <TouchableOpacity onPress={() => navigateMonth('prev')}>
          <Ionicons name="chevron-back" size={24} color={isDarkMode ? colors.foreground : '#111'} />
        </TouchableOpacity>
        
        <Text style={{ color: isDarkMode ? colors.foreground : '#111', fontSize: 20, fontWeight: '600' }}>
          {currentMonth} {currentYear}
        </Text>
        
        <TouchableOpacity onPress={() => navigateMonth('next')}>
          <Ionicons name="chevron-forward" size={24} color={isDarkMode ? colors.foreground : '#111'} />
        </TouchableOpacity>
      </View>

      {/* Days of Week Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 16, paddingVertical: 8 }}>
        {daysOfWeek.map((day, index) => (
          <View key={index} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: isDarkMode ? colors.mutedForeground : '#666', fontWeight: '500', fontSize: 14 }}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
        {/* Generate calendar weeks */}
        {[0, 1, 2, 3, 4, 5].map((week) => (
          <View key={week} style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 }}>
            {[0, 1, 2, 3, 4, 5, 6].map((day) => {
              const dayIndex = week * 7 + day;
              const calendarDay = calendarDays[dayIndex];
              
              if (calendarDay === null || calendarDay === undefined) {
                return <View key={dayIndex} style={{ width: 40, height: 40 }} />;
              }
              
              const isSelected = calendarDay === selectedDate;
              const hasEvents = eventsByDate[calendarDay] && eventsByDate[calendarDay].length > 0;
              
              return (
                <TouchableOpacity
                  key={dayIndex}
                  onPress={() => setSelectedDate(calendarDay)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected 
                      ? colors.primary 
                      : hasEvents 
                        ? (isDarkMode ? colors.input : '#666')
                        : 'transparent'
                  }}
                >
                  <Text style={{
                    fontWeight: '500',
                    fontSize: 16,
                    color: isSelected 
                      ? '#fff' 
                      : hasEvents 
                        ? (isDarkMode ? colors.foreground : '#fff')
                        : (isDarkMode ? colors.mutedForeground : '#666')
                  }}>
                    {calendarDay}
                  </Text>
                  {hasEvents && !isSelected && (
                    <View style={{ position: 'absolute', bottom: 4, width: 4, height: 4, backgroundColor: colors.primary, borderRadius: 2 }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Upcoming Events Section */}
      <View style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ color: isDarkMode ? colors.foreground : '#111', fontSize: 20, fontWeight: 'bold' }}>
            {selectedEvents.length > 0 
              ? `Events on ${currentMonth} ${selectedDate}` 
              : 'Upcoming Events'
            }
          </Text>
        </View>

        <ScrollView 
          style={{ flex: 1, paddingHorizontal: 16 }} 
          showsVerticalScrollIndicator={false}
        >
          {selectedEvents.length > 0 ? (
            selectedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
              <Ionicons name="calendar-outline" size={48} color={isDarkMode ? colors.mutedForeground : '#64748b'} />
              <Text style={{ color: isDarkMode ? colors.mutedForeground : '#666', fontSize: 18, marginTop: 16 }}>No events on this date</Text>
              <Text style={{ color: isDarkMode ? colors.mutedForeground : '#888', fontSize: 14, marginTop: 8 }}>Select a different date or create an event</Text>
              
              <TouchableOpacity style={{ backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, marginTop: 24 }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>Create Event</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Bottom spacing */}
          <View style={{ height: 96 }} />
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