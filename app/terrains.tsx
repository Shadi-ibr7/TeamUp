import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../lib/context/AuthContext';
import { useTheme } from '../lib/context/ThemeContext';
import { EquipmentSearchParams, EquipmentService, PublicEquipment } from '../lib/services/equipments';

interface TerrainItemProps {
  equipment: PublicEquipment;
  onPress: () => void;
}

const TerrainItem: React.FC<TerrainItemProps> = ({ equipment, onPress }) => {
  const { isDarkMode, colors } = useTheme();

  return (
    <TouchableOpacity style={[styles.terrainItem, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={onPress}>
      <View style={styles.terrainHeader}>
        <Text style={[styles.terrainName, { color: colors.foreground }]}>{equipment.name}</Text>
        <View style={[styles.terrainType, { backgroundColor: colors.input }]}>
          <Ionicons name="football" size={16} color={colors.primary} />
          <Text style={[styles.terrainTypeText, { color: colors.primary }]}>{equipment.type}</Text>
        </View>
      </View>
      
      <View style={styles.terrainDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="location" size={14} color={colors.mutedForeground} />
          <Text style={[styles.detailText, { color: colors.mutedForeground }]}>
            {equipment.address}, {equipment.city} ({equipment.department})
          </Text>
        </View>
        
        {equipment.manager_name && (
          <View style={styles.detailRow}>
            <Ionicons name="business" size={14} color={colors.mutedForeground} />
            <Text style={[styles.detailText, { color: colors.mutedForeground }]}>{equipment.manager_name}</Text>
          </View>
        )}
        
        {equipment.accessibility && (
          <View style={styles.detailRow}>
            <Ionicons name="accessibility" size={14} color={colors.mutedForeground} />
            <Text style={[styles.detailText, { color: colors.mutedForeground }]}>{equipment.accessibility}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.terrainActions}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.input }]}>
          <Ionicons name="calendar" size={16} color={colors.primary} />
          <Text style={[styles.actionButtonText, { color: colors.mutedForeground }]}>Réserver</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.input }]}>
          <Ionicons name="map" size={16} color={colors.mutedForeground} />
          <Text style={[styles.actionButtonText, { color: colors.mutedForeground }]}>Voir sur la carte</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default function TerrainsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDarkMode, colors } = useTheme();
  const [equipments, setEquipments] = useState<PublicEquipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [types, setTypes] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);

  // Charger les équipements
  const loadEquipments = async (refresh = false) => {
    try {
      setLoading(true);
      
      const params: EquipmentSearchParams = {
        property_type: 'Public',
        limit: 50,
      };

      if (selectedType) params.type = selectedType;
      if (selectedDepartment) params.department = selectedDepartment;
      if (searchTerm) {
        // Recherche par texte
        const searchResults = await EquipmentService.searchEquipments(searchTerm, params);
        setEquipments(searchResults);
      } else {
        // Recherche normale
        const results = await EquipmentService.getEquipments(params);
        setEquipments(results);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des équipements:', error);
      Alert.alert('Erreur', 'Impossible de charger les terrains');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Charger les filtres
  const loadFilters = async () => {
    try {
      const [typesData, departmentsData] = await Promise.all([
        EquipmentService.getEquipmentTypes(),
        EquipmentService.getDepartments(),
      ]);
      setTypes(typesData);
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Erreur lors du chargement des filtres:', error);
    }
  };

  // Initialisation
  useEffect(() => {
    loadEquipments();
    loadFilters();
  }, []);

  // Recherche avec délai
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        loadEquipments();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Filtres
  useEffect(() => {
    loadEquipments();
  }, [selectedType, selectedDepartment]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadEquipments(true);
  };

  const handleTerrainPress = (equipment: PublicEquipment) => {
    router.push({
      pathname: '/reservation',
      params: { equipmentId: equipment.id }
    });
  };

  const handleReservationPress = (equipment: PublicEquipment) => {
    if (!user) {
      Alert.alert('Connexion requise', 'Vous devez être connecté pour réserver un terrain');
      return;
    }
    
    router.push({
      pathname: '/reservation',
      params: { equipmentId: equipment.id }
    });
  };

  const renderFilterChip = (
    title: string,
    value: string,
    onPress: () => void,
    isSelected: boolean
  ) => (
    <TouchableOpacity
      style={[
        styles.filterChip, 
        { backgroundColor: isSelected ? colors.primary : (isDarkMode ? colors.input : '#1e293b'), borderColor: isSelected ? colors.primary : (isDarkMode ? colors.border : '#334155') }
      ]}
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, { color: isSelected ? '#ffffff' : (isDarkMode ? colors.mutedForeground : '#64748b') }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: isDarkMode ? colors.mutedForeground : '#64748b' }]}>Chargement des terrains...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDarkMode ? colors.border : '#1e293b' }]}>
        <Text style={[styles.title, { color: isDarkMode ? colors.foreground : '#f8fafc' }]}>Terrains Publics</Text>
        <TouchableOpacity
          style={styles.syncButton}
          onPress={() => {
            Alert.alert(
              'Synchronisation',
              'Voulez-vous synchroniser les terrains depuis l\'API Data ES ?',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Synchroniser',
                  onPress: async () => {
                    try {
                      setLoading(true);
                      const count = await EquipmentService.syncEquipmentsFromDataES({
                        property_type: 'Public',
                        limit: 100
                      });
                      Alert.alert('Succès', `${count} terrains synchronisés`);
                      loadEquipments();
                    } catch (error) {
                      Alert.alert('Erreur', 'Impossible de synchroniser les terrains');
                    } finally {
                      setLoading(false);
                    }
                  }
                }
              ]
            );
          }}
        >
          <Ionicons name="refresh" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Barre de recherche */}
      <View style={[styles.searchContainer, { backgroundColor: isDarkMode ? colors.input : '#1e293b' }]}>
        <Ionicons name="search" size={20} color={isDarkMode ? colors.mutedForeground : '#64748b'} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: isDarkMode ? colors.foreground : '#f8fafc' }]}
          placeholder="Rechercher un terrain..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor={isDarkMode ? colors.mutedForeground : '#64748b'}
        />
        {searchTerm ? (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Ionicons name="close-circle" size={20} color={isDarkMode ? colors.mutedForeground : '#64748b'} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        <Text style={[styles.filtersTitle, { color: isDarkMode ? colors.foreground : '#f8fafc' }]}>Filtres :</Text>
        
        <View style={styles.filtersRow}>
          <Text style={[styles.filterLabel, { color: isDarkMode ? colors.mutedForeground : '#64748b' }]}>Type :</Text>
          <FlatList
            horizontal
            data={types.slice(0, 10)}
            keyExtractor={(item) => item}
            renderItem={({ item }) =>
              renderFilterChip(
                item,
                item,
                () => setSelectedType(selectedType === item ? '' : item),
                selectedType === item
              )
            }
            showsHorizontalScrollIndicator={false}
            style={styles.filtersList}
          />
        </View>

        <View style={styles.filtersRow}>
          <Text style={[styles.filterLabel, { color: isDarkMode ? colors.mutedForeground : '#64748b' }]}>Département :</Text>
          <FlatList
            horizontal
            data={departments.slice(0, 10)}
            keyExtractor={(item) => item}
            renderItem={({ item }) =>
              renderFilterChip(
                item,
                item,
                () => setSelectedDepartment(selectedDepartment === item ? '' : item),
                selectedDepartment === item
              )
            }
            showsHorizontalScrollIndicator={false}
            style={styles.filtersList}
          />
        </View>
      </View>

      {/* Liste des terrains */}
      <FlatList
        data={equipments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TerrainItem
            equipment={item}
            onPress={() => handleTerrainPress(item)}
          />
        )}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="football-outline" size={64} color={isDarkMode ? colors.mutedForeground : '#64748b'} />
            <Text style={[styles.emptyText, { color: isDarkMode ? colors.mutedForeground : '#64748b' }]}>Aucun terrain trouvé</Text>
            <Text style={[styles.emptySubtext, { color: isDarkMode ? colors.mutedForeground : '#475569' }]}>
              Essayez de modifier vos filtres ou votre recherche
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  syncButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  filtersTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterLabel: {
    fontSize: 14,
    marginRight: 12,
    minWidth: 80,
  },
  filtersList: {
    flex: 1,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  terrainItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  terrainHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  terrainName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  terrainType: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  terrainTypeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  terrainDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  terrainActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontSize: 12,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
}); 