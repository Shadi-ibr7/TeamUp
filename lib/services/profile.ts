import { supabase } from '../supabase';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  preferred_sports: string[];
  skill_levels: { [sport: string]: 'Beginner' | 'Intermediate' | 'Advanced' };
  availability: string;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  user_id: string;
  events_created: number;
  events_participated: number;
  participation_rate: number;
  wins: number; // Représente maintenant le nombre d'amis
  badges_earned: string[];
}

export class ProfileService {
  // Créer le bucket avatars s'il n'existe pas
  static async ensureAvatarBucket() {
    try {
      // Vérifier si le bucket existe
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) throw listError;
      
      const avatarBucket = buckets?.find(bucket => bucket.id === 'avatars');
      
      if (!avatarBucket) {
        // Créer le bucket s'il n'existe pas
        const { error: createError } = await supabase.storage.createBucket('avatars', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (createError) {
          console.error('Erreur lors de la création du bucket:', createError);
          throw createError;
        }
        
        console.log('Bucket avatars créé avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification/création du bucket:', error);
      throw error;
    }
  }

  // Récupérer le profil d'un utilisateur
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Utilise maybeSingle au lieu de single pour éviter l'erreur si aucune ligne
      
      if (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        return null;
      }
      
      // Si aucun profil n'existe, créer un profil par défaut
      if (!data) {
        console.log('Aucun profil trouvé, création d\'un profil par défaut');
        return await this.createDefaultProfile(userId);
      }
      
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      return null;
    }
  }

  // Créer un profil par défaut pour un nouvel utilisateur
  static async createDefaultProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      const defaultProfile = {
        id: userId,
        name: authUser.user?.user_metadata?.full_name || authUser.user?.email?.split('@')[0] || 'Utilisateur',
        email: authUser.user?.email || '',
        bio: '',
        preferred_sports: [],
        skill_levels: {},
        availability: '',
        avatar_url: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('users')
        .insert(defaultProfile)
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de la création du profil par défaut:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la création du profil par défaut:', error);
      return null;
    }
  }

  // Mettre à jour le profil utilisateur
  static async updateUserProfile(userId: string, updates: Partial<UserProfile>) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
  }

  // Récupérer les statistiques de l'utilisateur
  static async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      // Récupérer le nombre d'événements créés
      const { count: eventsCreated } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('organizer_id', userId);

      // Récupérer le nombre de participations
      const { count: eventsParticipated } = await supabase
        .from('event_participants')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'confirmed');

      // Récupérer le nombre d'amis (participations communes à des événements)
      const { data: userEvents, error: userEventsError } = await supabase
        .from('event_participants')
        .select('event_id')
        .eq('user_id', userId)
        .eq('status', 'confirmed');

      let friendsCount = 0;
      if (!userEventsError && userEvents && userEvents.length > 0) {
        const eventIds = userEvents.map(e => e.event_id);
        
        // Trouver tous les autres participants à ces événements
        const { data: otherParticipants, error: participantsError } = await supabase
          .from('event_participants')
          .select('user_id')
          .in('event_id', eventIds)
          .eq('status', 'confirmed')
          .neq('user_id', userId);

        if (!participantsError && otherParticipants) {
          // Compter les utilisateurs uniques
          const uniqueFriends = new Set(otherParticipants.map(p => p.user_id));
          friendsCount = uniqueFriends.size;
        }
      }

      // Calculer le taux de participation
      const totalEvents = (eventsCreated || 0) + (eventsParticipated || 0);
      const participationRate = totalEvents > 0 ? Math.round((eventsParticipated || 0) / totalEvents * 100) : 0;

      // Générer les badges basés sur les statistiques
      const badges: string[] = [];
      
      if (eventsCreated && eventsCreated >= 5) {
        badges.push('Organisateur régulier');
      }
      if (eventsCreated && eventsCreated >= 10) {
        badges.push('Organisateur expert');
      }
      if (eventsParticipated && eventsParticipated >= 10) {
        badges.push('Participant assidu');
      }
      if (participationRate >= 80) {
        badges.push('Fair-play');
      }
      if (friendsCount >= 10) {
        badges.push('Sociable');
      }
      if (totalEvents >= 20) {
        badges.push('Sportif du mois');
      }

      return {
        user_id: userId,
        events_created: eventsCreated || 0,
        events_participated: eventsParticipated || 0,
        participation_rate: participationRate,
        wins: friendsCount, // On utilise wins pour stocker le nombre d'amis
        badges_earned: badges
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return null;
    }
  }

  // Récupérer l'historique des événements passés de l'utilisateur
  static async getUserPastEvents(userId: string) {
    try {
      // Première approche : récupérer tous les événements de l'utilisateur
      const { data: participations, error: participationsError } = await supabase
        .from('event_participants')
        .select('event_id')
        .eq('user_id', userId)
        .eq('status', 'confirmed');

      if (participationsError) throw participationsError;

      if (!participations || participations.length === 0) {
        return [];
      }

      const eventIds = participations.map(p => p.event_id);

      // Récupérer les détails des événements passés
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, title, sport_type, date, location')
        .in('id', eventIds)
        .lt('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: false })
        .limit(10);

      if (eventsError) throw eventsError;
      
      return events?.map(event => ({
        id: event.id,
        title: event.title,
        sport: event.sport_type,
        date: event.date,
        location: event.location
      })) || [];
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'historique:', error);
      return [];
    }
  }

  // Uploader une photo de profil
  static async uploadAvatar(userId: string, fileData: File | Blob | string, mimeType?: string): Promise<string | null> {
    try {
      const fileExt = mimeType ? mimeType.split('/')[1] : 'jpeg';
      const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

      console.log('Tentative d\'upload vers le bucket avatars...');

      let uploadData;
      if (typeof fileData === 'string') {
        // Si c'est du base64, le décoder
        const binaryString = atob(fileData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        uploadData = bytes;
        console.log('📦 Données préparées depuis base64, taille:', bytes.length, 'bytes');
      } else {
        // Si c'est un File ou Blob
        uploadData = fileData;
        console.log('📦 Utilisation directe du File/Blob');
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, uploadData, {
          upsert: true,
          contentType: mimeType || 'image/jpeg'
        });

      if (uploadError) {
        console.error('Erreur d\'upload détaillée:', uploadError);
        throw uploadError;
      }

      console.log('Upload réussi, récupération de l\'URL publique...');

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('URL publique générée:', data.publicUrl);

      // Mettre à jour le profil avec la nouvelle URL
      await this.updateUserProfile(userId, { avatar_url: data.publicUrl });

      return data.publicUrl;
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'avatar:', error);
      return null;
    }
  }

  // Uploader une photo d'événement
  static async uploadEventImage(userId: string, imageUri: string): Promise<string | null> {
    try {
      const fileExt = 'jpeg';
      const fileName = `${userId}/event-${Date.now()}.${fileExt}`; // Structure plus simple

      console.log('Tentative d\'upload d\'image d\'événement...');

      // Convertir l'URI en base64
      const response = await fetch(imageUri);
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('📦 Blob créé, taille:', blob.size, 'bytes');
      
      const { error: uploadError } = await supabase.storage
        .from('avatars') // On utilise le même bucket pour l'instant
        .upload(fileName, blob, {
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        console.error('Erreur d\'upload d\'image d\'événement:', uploadError);
        throw uploadError;
      }

      console.log('Upload d\'image d\'événement réussi, récupération de l\'URL publique...');

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('URL publique générée pour l\'événement:', data.publicUrl);

      return data.publicUrl;
    } catch (error) {
      console.error('Erreur lors de l\'upload de l\'image d\'événement:', error);
      
      // Si c'est une erreur de réseau, essayer une approche alternative
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        console.log('🔄 Tentative avec approche alternative...');
        try {
          // Essayer avec une requête plus simple
          const response = await fetch(imageUri, {
            method: 'GET',
            headers: {
              'Accept': 'image/*',
            },
          });
          
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            
            const fileExt = 'jpeg';
            const fileName = `${userId}/event-${Date.now()}.${fileExt}`;
            
            const { error: uploadError2 } = await supabase.storage
              .from('avatars')
              .upload(fileName, uint8Array, {
                upsert: true,
                contentType: 'image/jpeg'
              });

            if (uploadError2) {
              throw uploadError2;
            }

            const { data } = supabase.storage
              .from('avatars')
              .getPublicUrl(fileName);

            return data.publicUrl;
          }
        } catch (fallbackError) {
          console.error('Erreur avec approche alternative:', fallbackError);
        }
      }
      
      return null;
    }
  }

  // Rechercher des utilisateurs par nom ou email
  static async searchUsers(query: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .or(`name.ilike.%${query}%, email.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erreur lors de la recherche d\'utilisateurs:', error);
      return [];
    }
  }
} 