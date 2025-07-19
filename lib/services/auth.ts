import { User } from '@supabase/supabase-js';
import { supabase } from '../supabase';

export class AuthService {
  // Inscription avec email/mot de passe
  static async signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        }
      }
    });
    
    if (error) throw error;
    return data;
  }

  // Connexion avec email/mot de passe
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  }

  // Connexion avec Google
  static async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'teamup://auth/callback',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur lors de l\'authentification Google:', error);
      throw error;
    }
  }

  // Déconnexion
  static async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  // Récupérer l'utilisateur actuel
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.warn('Erreur lors de la récupération de l\'utilisateur:', error);
        return null;
      }
      return user;
    } catch (error) {
      console.warn('Exception lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  }

  // Récupérer la session actuelle
  static async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.warn('Erreur lors de la récupération de la session:', error);
        return null;
      }
      return session;
    } catch (error) {
      console.warn('Exception lors de la récupération de la session:', error);
      return null;
    }
  }

  // Écouter les changements d'authentification
  static onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      callback(session?.user || null);
    });
  }
} 