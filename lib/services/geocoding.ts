// Service pour la géocodification des adresses
export class GeocodingService {
  // Géocodification simple avec l'API gratuite de Nominatim (OpenStreetMap)
  static async geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Erreur de géocodification:', error);
      return null;
    }
  }

  // Géocodification avec fallback vers des coordonnées par défaut
  static async getCoordinatesForLocation(location: string): Promise<{ latitude: number; longitude: number }> {
    // Essayer la géocodification
    const coordinates = await this.geocodeAddress(location);
    
    if (coordinates) {
      return coordinates;
    }
    
    // Fallback vers des coordonnées par défaut (Paris)
    console.warn(`Impossible de géocoder l'adresse: ${location}. Utilisation des coordonnées par défaut.`);
    return {
      latitude: 48.8566,
      longitude: 2.3522
    };
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