import { Session, User } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState } from 'react';
import { NotificationService } from '../services/notifications';
import { supabase } from '../supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: any) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Récupérer la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Changement d\'état d\'authentification:', event);
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Gérer les notifications selon l'état d'authentification
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('📱 Enregistrement du token de notification pour:', session.user.id);
        await NotificationService.registerNotificationToken(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        console.log('📱 Suppression du token de notification');
        if (user) {
          await NotificationService.unregisterNotificationToken(user.id);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    // Supprimer le token de notification avant la déconnexion
    if (user) {
      await NotificationService.unregisterNotificationToken(user.id);
    }
    
    await supabase.auth.signOut();
  };

  const updateProfile = async (updates: any) => {
    const { error } = await supabase.auth.updateUser(updates);
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 