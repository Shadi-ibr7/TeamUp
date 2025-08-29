// Service pour la géocodification des adresses
export class GeocodingService {
  // Géocodification simple avec l'API gratuite de Nominatim (OpenStreetMap)
  static async geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      console.log('🌍 Tentative de géocodification pour:', address);
      
      const encodedAddress = encodeURIComponent(address);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`;
      
      console.log('🌍 URL de géocodification:', url);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'TeamUp-App/1.0'
        }
      });
      
      if (!response.ok) {
        console.error('❌ Erreur HTTP:', response.status, response.statusText);
        return null;
      }
      
      const data = await response.json();
      console.log('🌍 Réponse de géocodification:', data);
      
      if (data && data.length > 0) {
        const result = {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        };
        console.log('✅ Géocodification réussie:', result);
        return result;
      }
      
      console.log('⚠️ Aucun résultat trouvé pour:', address);
      return null;
    } catch (error) {
      console.error('❌ Erreur de géocodification:', error);
      return null;
    }
  }

  // Géocodification avec fallback vers des coordonnées par défaut
  static async getCoordinatesForLocation(location: string): Promise<{ latitude: number; longitude: number }> {
    console.log('📍 Début de géocodification pour:', location);
    
    // Essayer la géocodification
    const coordinates = await this.geocodeAddress(location);
    
    if (coordinates) {
      console.log('✅ Coordonnées obtenues avec succès:', coordinates);
      return coordinates;
    }
    
    // Fallback vers des coordonnées aléatoires autour de Paris
    console.warn(`⚠️ Impossible de géocoder l'adresse: ${location}. Utilisation de coordonnées aléatoires autour de Paris.`);
    const randomCoords = {
      latitude: 48.8566 + (Math.random() - 0.5) * 0.05, // ±0.05 degrés autour de Paris
      longitude: 2.3522 + (Math.random() - 0.5) * 0.05
    };
    console.log('📍 Coordonnées aléatoires utilisées:', randomCoords);
    return randomCoords;
  }

  // Calculer la distance entre deux points (formule de Haversine)
  static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
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

  // Formater la distance pour l'affichage
  static formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    } else {
      return `${distance.toFixed(1)}km`;
    }
  }
} 