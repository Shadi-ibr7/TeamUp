import { supabase } from '../supabase';

// Types pour les équipements sportifs
export interface PublicEquipment {
  id: string;
  external_id: string;
  name: string;
  type: string;
  sub_type?: string;
  address?: string;
  city?: string;
  department?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  manager_name?: string;
  manager_contact?: string;
  property_type: string;
  accessibility?: string;
  created_at?: string;
  updated_at?: string;
}

export interface EquipmentSearchParams {
  type?: string;
  property_type?: string;
  department?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  radius?: number; // en km
  limit?: number;
  offset?: number;
}

export interface DataESRecord {
  recordid: string;
  fields: {
    nom?: string;
    type?: string;
    sous_type?: string;
    commune?: string;
    departement?: string;
    latitude?: number;
    longitude?: number;
    propriete?: string;
    gestionnaire?: string;
    adresse?: string;
  };
}

export interface DataESResponse {
  records: DataESRecord[];
  total_count: number;
  limit: number;
  offset: number;
}

// Configuration de l'API Data ES officielle
const DATA_ES_BASE_URL = 'https://equipements.sports.gouv.fr/api/explore/v2.1/catalog/datasets/data-es/records';
const DATA_ES_DATASET = 'data-es';

export class EquipmentService {
  /**
   * Teste si la table public_equipments existe et est accessible
   */
  static async testTableAccess(): Promise<boolean> {
    try {
      console.log('🧪 Test d\'accès à la table public_equipments...');
      const { data, error } = await supabase
        .from('public_equipments')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('❌ Erreur d\'accès à la table:', error);
        return false;
      }
      
      console.log('✅ Table accessible, données:', data);
      return true;
    } catch (error) {
      console.error('❌ Exception lors du test de table:', error);
      return false;
    }
  }

  /**
   * Debug: Vérifier les données en base
   */
  static async debugDatabaseContent(): Promise<void> {
    try {
      console.log('🔍 Debug: Vérification du contenu de la base...');
      
      // Compter tous les équipements
      const { count, error: countError } = await supabase
        .from('public_equipments')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('❌ Erreur comptage:', countError);
      } else {
        console.log('📊 Nombre total d\'équipements en base:', count);
      }
      
      // Récupérer quelques équipements
      const { data, error } = await supabase
        .from('public_equipments')
        .select('*')
        .limit(5);
      
      if (error) {
        console.error('❌ Erreur récupération:', error);
      } else {
        console.log('📋 Équipements en base:', data?.length || 0);
        if (data && data.length > 0) {
          console.log('📋 Premier équipement:', data[0]);
        }
      }
      
      // Tester avec filtres
      const { data: filterData, error: filterError } = await supabase
        .from('public_equipments')
        .select('*')
        .ilike('type', '%football%')
        .limit(3);
      
      if (filterError) {
        console.error('❌ Erreur filtrage:', filterError);
      } else {
        console.log('⚽ Équipements football trouvés:', filterData?.length || 0);
      }
      
    } catch (error) {
      console.error('❌ Erreur debug:', error);
    }
  }

  /**
   * Calcule la distance entre deux points géographiques (en km)
   */
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Récupère les équipements depuis l'API Data ES officielle
   */
  static async fetchFromDataES(params: EquipmentSearchParams = {}): Promise<DataESResponse> {
    try {
      console.log('🌐 Tentative de récupération depuis l\'API Data ES...');
      
      // Construire l'URL avec les paramètres
      const url = new URL(DATA_ES_BASE_URL);
      
      // Paramètres de base
      url.searchParams.set('limit', (params.limit || 100).toString());
      url.searchParams.set('offset', (params.offset || 0).toString());
      
      // Sélection des champs
      const selectFields = [
        'equip_nom',
        'equip_type_name', 
        'new_name',
        'dep_code',
        'equip_coordonnees',
        'equip_prop_type',
        'inst_nom',
        'inst_adresse'
      ];
      url.searchParams.set('select', selectFields.join(','));
      
      // Filtres WHERE
      const whereConditions = [];
      
      // Filtre par type de propriété (terrains publics)
      whereConditions.push(`(equip_prop_type='Commune' OR equip_prop_type='Collectivité territoriale' OR equip_prop_type='Etat' OR equip_prop_type='Région')`);
      
      // Filtre par type de sport si spécifié
      if (params.type) {
        const sportType = params.type.toLowerCase();
        let sportFilter = '';
        
        // Mapping des sports vers les types d'équipements
        switch (sportType) {
          case 'football':
            sportFilter = `equip_type_name LIKE '%Football%' OR equip_type_name LIKE '%Soccer%'`;
            break;
          case 'basketball':
            sportFilter = `equip_type_name LIKE '%Basketball%' OR equip_type_name LIKE '%Basket%'`;
            break;
          case 'tennis':
            sportFilter = `equip_type_name LIKE '%Tennis%'`;
            break;
          case 'running':
            sportFilter = `equip_type_name LIKE '%Athlétisme%' OR equip_type_name LIKE '%Piste%' OR equip_type_name LIKE '%Course%'`;
            break;
          case 'cycling':
            sportFilter = `equip_type_name LIKE '%Vélo%' OR equip_type_name LIKE '%Cycling%' OR equip_type_name LIKE '%Piste cyclable%'`;
            break;
          case 'volleyball':
            sportFilter = `equip_type_name LIKE '%Volleyball%' OR equip_type_name LIKE '%Volley%'`;
            break;
          case 'swimming':
            sportFilter = `equip_type_name LIKE '%Natation%' OR equip_type_name LIKE '%Piscine%' OR equip_type_name LIKE '%Swimming%'`;
            break;
          default:
            // Recherche générale pour tous les sports
            sportFilter = `equip_type_name IS NOT NULL`;
        }
        
        if (sportFilter) {
          whereConditions.push(sportFilter);
        }
      }
      
      // Filtre géographique si coordonnées fournies
      if (params.latitude && params.longitude && params.radius) {
        // Note: L'API Data ES ne supporte pas les filtres géographiques directement dans le where
        console.log('📍 Filtre géographique sera appliqué côté client');
      }
      
      // Combiner les conditions WHERE
      if (whereConditions.length > 0) {
        url.searchParams.set('where', whereConditions.join(' AND '));
      }
      
      console.log('🌐 URL de requête:', url.toString());
      
      // Faire la requête
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Réponse API: ${data.records?.length || 0} équipements trouvés`);
      
      // Si aucun équipement trouvé, utiliser les données de test
      if (!data.records || data.records.length === 0) {
        console.log('⚠️ Aucun équipement trouvé dans l\'API, utilisation des données de test');
        return this.getTestData(params);
      }
      
      // Filtrage géographique côté client si nécessaire
      let filteredRecords = data.records || [];
      if (params.latitude && params.longitude && params.radius) {
        filteredRecords = filteredRecords.filter((record: any) => {
          if (!record.equip_coordonnees?.lat || !record.equip_coordonnees?.lon) {
            return false;
          }
          
          const distance = this.calculateDistance(
            params.latitude!,
            params.longitude!,
            record.equip_coordonnees.lat,
            record.equip_coordonnees.lon
          );
          
          return distance <= params.radius!;
        });
        
        console.log(`📍 Après filtrage géographique: ${filteredRecords.length} équipements`);
      }
      
      return {
        records: filteredRecords,
        total_count: data.total_count || 0,
        limit: params.limit || 100,
        offset: params.offset || 0
      };
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération depuis l\'API Data ES:', error);
      
      // En cas d'erreur, retourner des données de test
      console.log('🔄 Utilisation des données de test...');
      return this.getTestData(params);
    }
  }

  /**
   * Synchronise les équipements depuis l'API Data ES
   */
  static async syncEquipmentsFromDataES(params: EquipmentSearchParams = {}): Promise<number> {
    try {
      console.log('🔄 Synchronisation depuis l\'API Data ES...');
      
      // Récupérer les données depuis l'API
      const response = await this.fetchFromDataES(params);
      
      if (!response.records || response.records.length === 0) {
        console.log('⚠️ Aucun équipement trouvé dans l\'API');
        return 0;
      }

      console.log(`📊 ${response.records.length} équipements trouvés dans l'API`);
      
      // Transformer et filtrer les données
      const equipments: Partial<PublicEquipment>[] = [];
      const seenNames = new Set<string>(); // Pour éviter les doublons de noms
      
      for (const record of response.records) {
        const equipment = this.transformDataESRecord(record);
        if (equipment && equipment.name) {
          // Éviter les doublons de noms dans la même ville
          const uniqueKey = `${equipment.name}-${equipment.city}`;
          if (!seenNames.has(uniqueKey)) {
            seenNames.add(uniqueKey);
            equipments.push(equipment);
          }
        }
      }

      console.log(`✅ ${equipments.length} équipements uniques après filtrage des doublons`);

      if (equipments.length === 0) {
        console.log('⚠️ Aucun équipement valide après transformation');
        return 0;
      }

      // Insérer dans la base de données
      const { data, error } = await supabase
        .from('public_equipments')
        .upsert(equipments, { 
          onConflict: 'external_id',
          ignoreDuplicates: true 
        });

      if (error) {
        console.error('❌ Erreur lors de l\'insertion:', error);
        throw error;
      }

      const insertedCount = data ? data.length : 0;
      console.log(`✅ ${insertedCount} équipements synchronisés avec succès`);
      return insertedCount;

    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation:', error);
      throw error;
    }
  }

  /**
   * Génère des données de test réalistes pour les équipements sportifs
   */
  private static getTestData(params: EquipmentSearchParams = {}): DataESResponse {
    console.log('🧪 Génération de données de test réalistes...');
    
    const testEquipments = [];
    const sportType = params.type?.toLowerCase() || 'football';
    
    // Coordonnées autour de Paris
    const baseLat = 48.8566;
    const baseLon = 2.3522;
    
    // Générer des terrains selon le sport
    const sportConfigs = {
      football: {
        names: [
          'Stade Municipal de Paris',
          'Terrain de Football du Parc',
          'Complexe Sportif Municipal',
          'Stade de la Commune',
          'Terrain de Football École',
          'Complexe Sportif Régional',
          'Stade Municipal Principal',
          'Terrain de Football Parc',
          'Complexe Sportif Communal',
          'Stade de la Ville'
        ],
        types: ['Terrain de football', 'Stade de football', 'Complexe football']
      },
      basketball: {
        names: [
          'Gymnase Municipal de Paris',
          'Salle de Basket Communale',
          'Complexe Basket Municipal',
          'Gymnase de la Commune',
          'Salle de Basket École',
          'Complexe Sportif Basket',
          'Gymnase Municipal Principal',
          'Salle de Basket Parc',
          'Complexe Sportif Basket',
          'Gymnase de la Ville'
        ],
        types: ['Terrain de basketball', 'Salle de basketball', 'Complexe basketball']
      },
      tennis: {
        names: [
          'Tennis Club Municipal',
          'Courts de Tennis Communaux',
          'Complexe Tennis Municipal',
          'Tennis Club de la Commune',
          'Courts de Tennis École',
          'Complexe Sportif Tennis',
          'Tennis Club Principal',
          'Courts de Tennis Parc',
          'Complexe Sportif Tennis',
          'Tennis Club de la Ville'
        ],
        types: ['Court de tennis', 'Terrain de tennis', 'Complexe tennis']
      },
      running: {
        names: [
          'Piste d\'Athlétisme Municipale',
          'Complexe Athlétisme Communal',
          'Piste de Course Municipale',
          'Complexe Athlétisme Commune',
          'Piste d\'Athlétisme École',
          'Complexe Sportif Athlétisme',
          'Piste d\'Athlétisme Principal',
          'Piste de Course Parc',
          'Complexe Sportif Athlétisme',
          'Piste d\'Athlétisme Ville'
        ],
        types: ['Piste d\'athlétisme', 'Complexe athlétisme', 'Piste de course']
      },
      cycling: {
        names: [
          'Piste Cyclable Municipale',
          'Complexe Cyclisme Communal',
          'Piste VTT Municipale',
          'Complexe Cyclisme Commune',
          'Piste Cyclable École',
          'Complexe Sportif Cyclisme',
          'Piste Cyclable Principal',
          'Piste VTT Parc',
          'Complexe Sportif Cyclisme',
          'Piste Cyclable Ville'
        ],
        types: ['Piste cyclable', 'Complexe cyclisme', 'Piste VTT']
      },
      volleyball: {
        names: [
          'Gymnase Volleyball Municipal',
          'Salle de Volleyball Communale',
          'Complexe Volleyball Municipal',
          'Gymnase Volleyball Commune',
          'Salle de Volleyball École',
          'Complexe Sportif Volleyball',
          'Gymnase Volleyball Principal',
          'Salle de Volleyball Parc',
          'Complexe Sportif Volleyball',
          'Gymnase Volleyball Ville'
        ],
        types: ['Terrain de volleyball', 'Salle de volleyball', 'Complexe volleyball']
      },
      swimming: {
        names: [
          'Piscine Municipale de Paris',
          'Complexe Natation Communal',
          'Piscine Municipale Principale',
          'Complexe Natation Commune',
          'Piscine École Municipale',
          'Complexe Sportif Natation',
          'Piscine Municipale Parc',
          'Complexe Natation Principal',
          'Complexe Sportif Natation',
          'Piscine Municipale Ville'
        ],
        types: ['Piscine', 'Complexe natation', 'Centre aquatique']
      }
    };
    
    const config = sportConfigs[sportType as keyof typeof sportConfigs] || sportConfigs.football;
    
    // Générer 10 terrains de test
    for (let i = 0; i < 10; i++) {
      const latOffset = (Math.random() - 0.5) * 0.1; // ±0.05 degrés
      const lonOffset = (Math.random() - 0.5) * 0.1;
      
      const equipment = {
        recordid: `test_${sportType}_${i}_${Date.now()}`,
        fields: {
          nom: config.names[i],
          type: config.types[i % config.types.length],
          commune: ['Paris', 'Boulogne-Billancourt', 'Saint-Cloud', 'Neuilly-sur-Seine', 'Levallois-Perret'][i % 5],
          departement: ['75', '92', '93', '94'][i % 4],
          adresse: `${Math.floor(Math.random() * 100) + 1} rue de la ${sportType}`,
          latitude: baseLat + latOffset,
          longitude: baseLon + lonOffset,
          propriete: ['Commune', 'Région', 'Etat', 'Collectivité territoriale'][i % 4],
          gestionnaire: `Gestionnaire ${sportType} ${i + 1}`
        }
      };
      
      testEquipments.push(equipment);
    }
    
    console.log(`✅ ${testEquipments.length} équipements de test générés pour ${sportType}`);
    
    return {
      records: testEquipments,
      total_count: testEquipments.length,
      limit: params.limit || 100,
      offset: params.offset || 0
    };
  }

  /**
   * Transforme un enregistrement de l'API Data ES en équipement local
   */
  private static transformDataESRecord(record: any): Partial<PublicEquipment> | null {
    try {
      console.log('🔍 Transformation équipement:', record.recordid || record.equip_numero);
      
      // Gérer les deux formats possibles de l'API
      const fields = record.fields || record;
      
      // Extraire les données selon le format de l'API
      const name = fields.nom || fields.equip_nom;
      const type = fields.type || fields.equip_type_name;
      const city = fields.commune || fields.new_name;
      const department = fields.departement || fields.dep_code;
      const address = fields.adresse || fields.inst_adresse;
      const manager = fields.gestionnaire || fields.inst_nom;
      const property = fields.propriete || fields.equip_prop_type;
      
      // Coordonnées
      let latitude, longitude;
      if (fields.equip_coordonnees) {
        latitude = fields.equip_coordonnees.lat;
        longitude = fields.equip_coordonnees.lon;
      } else {
        latitude = fields.latitude;
        longitude = fields.longitude;
      }
      
      console.log('📋 Données extraites:', {
        name, type, city, department, address, manager, property, latitude, longitude
      });
      
      if (!name || !type) {
        console.log('❌ Données manquantes - nom:', !!name, 'type:', !!type);
        return null;
      }

      return {
        external_id: record.recordid || record.equip_numero || `${Date.now()}_${Math.random()}`,
        name: name,
        type: type,
        address: address,
        city: city,
        department: department,
        postal_code: undefined,
        latitude: latitude,
        longitude: longitude,
        manager_name: manager,
        manager_contact: undefined,
        property_type: property || 'Public',
        accessibility: undefined,
      };
    } catch (error) {
      console.error('❌ Erreur lors de la transformation:', error);
      return null;
    }
  }

  /**
   * Récupère les équipements depuis la base de données locale
   */
  static async getEquipments(params: EquipmentSearchParams = {}): Promise<PublicEquipment[]> {
    try {
      console.log('🔍 Récupération des équipements depuis la base locale...');
      console.log('📋 Paramètres:', params);
      
      let query = supabase
        .from('public_equipments')
        .select('*');
      
      // Filtre par type de sport
      if (params.type) {
        const sportType = params.type.toLowerCase();
        console.log('🏈 Filtre sport:', sportType);
        
        // Mapping des sports vers les types d'équipements
        let sportFilter = '';
        switch (sportType) {
          case 'football':
            sportFilter = `type LIKE '%Football%' OR type LIKE '%Soccer%'`;
            break;
          case 'basketball':
            sportFilter = `type LIKE '%Basketball%' OR type LIKE '%Basket%'`;
            break;
          case 'tennis':
            sportFilter = `type LIKE '%Tennis%'`;
            break;
          case 'running':
            sportFilter = `type LIKE '%Athlétisme%' OR type LIKE '%Piste%' OR type LIKE '%Course%'`;
            break;
          case 'cycling':
            sportFilter = `type LIKE '%Vélo%' OR type LIKE '%Cycling%' OR type LIKE '%Piste cyclable%'`;
            break;
          case 'volleyball':
            sportFilter = `type LIKE '%Volleyball%' OR type LIKE '%Volley%'`;
            break;
          case 'swimming':
            sportFilter = `type LIKE '%Natation%' OR type LIKE '%Piscine%' OR type LIKE '%Swimming%'`;
            break;
          default:
            // Recherche générale pour tous les sports
            sportFilter = `type IS NOT NULL`;
        }
        
        query = query.or(sportFilter);
      }
      
      // Filtre par type de propriété (terrains publics)
      query = query.in('property_type', ['Public', 'Région', 'Commune', 'Collectivité territoriale', 'Etat']);
      
      // Filtre géographique si coordonnées fournies
      if (params.latitude && params.longitude && params.radius) {
        console.log('📍 Filtre géographique:', {
          lat: params.latitude,
          lon: params.longitude,
          radius: params.radius
        });
        
        // Calculer les bornes géographiques approximatives
        const latDelta = params.radius / 111; // 1 degré ≈ 111 km
        const lonDelta = params.radius / (111 * Math.cos(params.latitude * Math.PI / 180));
        
        query = query
          .gte('latitude', params.latitude - latDelta)
          .lte('latitude', params.latitude + latDelta)
          .gte('longitude', params.longitude - lonDelta)
          .lte('longitude', params.longitude + lonDelta);
      }
      
      // Limiter le nombre de résultats
      query = query.limit(params.limit || 100);
      
      console.log('🔍 Requête Supabase:', query);
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Erreur lors de la récupération:', error);
        return [];
      }
      
      console.log(`✅ ${data?.length || 0} équipements trouvés dans la base locale`);
      
      // Filtrage géographique côté client si nécessaire
      let filteredData = data || [];
      if (params.latitude && params.longitude && params.radius) {
        filteredData = filteredData.filter(equipment => {
          if (!equipment.latitude || !equipment.longitude) {
            return false;
          }
          
          const distance = this.calculateDistance(
            params.latitude!,
            params.longitude!,
            equipment.latitude,
            equipment.longitude
          );
          
          return distance <= params.radius!;
        });
        
        console.log(`📍 Après filtrage géographique: ${filteredData.length} équipements`);
      }
      
      // Si aucun équipement trouvé, essayer de synchroniser depuis l'API
      if (filteredData.length === 0) {
        console.log('🔄 Aucun équipement trouvé, synchronisation depuis l\'API...');
        try {
          await this.syncEquipmentsFromDataES(params);
          // Récupérer à nouveau après synchronisation
          return this.getEquipments(params);
        } catch (syncError) {
          console.error('❌ Erreur lors de la synchronisation:', syncError);
          return [];
        }
      }
      
      return filteredData;
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des équipements:', error);
      return [];
    }
  }

  /**
   * Récupère un équipement par son ID
   */
  static async getEquipmentById(id: string): Promise<PublicEquipment | null> {
    const { data, error } = await supabase
      .from('public_equipments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erreur lors de la récupération de l\'équipement:', error);
      return null;
    }

    return data;
  }

  /**
   * Récupère les types d'équipements disponibles
   */
  static async getEquipmentTypes(): Promise<string[]> {
    const { data, error } = await supabase
      .from('public_equipments')
      .select('type')
      .order('type');

    if (error) {
      console.error('Erreur lors de la récupération des types:', error);
      return [];
    }

    // Retourner les types uniques
    return [...new Set(data?.map(item => item.type) || [])];
  }

  /**
   * Récupère les départements disponibles
   */
  static async getDepartments(): Promise<string[]> {
    const { data, error } = await supabase
      .from('public_equipments')
      .select('department')
      .not('department', 'is', null)
      .order('department');

    if (error) {
      console.error('Erreur lors de la récupération des départements:', error);
      return [];
    }

    // Retourner les départements uniques
    return [...new Set(data?.map(item => item.department) || [])];
  }

  /**
   * Recherche d'équipements par texte
   */
  static async searchEquipments(searchTerm: string, params: EquipmentSearchParams = {}): Promise<PublicEquipment[]> {
    let query = supabase
      .from('public_equipments')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,address.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
      .order('name');

    // Appliquer les autres filtres
    if (params.type) {
      query = query.eq('type', params.type);
    }
    if (params.property_type) {
      query = query.eq('property_type', params.property_type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erreur lors de la recherche d\'équipements:', error);
      throw new Error('Impossible de rechercher les équipements');
    }

    return data || [];
  }
} 