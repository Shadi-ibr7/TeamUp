import { createClient } from '@supabase/supabase-js';

// Remplacez ces valeurs par vos propres clés Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour vos données
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at: string;
  preferences?: any;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  date: string;
  time: string;
  sport_type: string;
  max_participants: number;
  current_participants: number;
  organizer_id: string;
  created_at: string;
  is_active: boolean;
  image_url?: string;
}

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'declined';
  joined_at: string;
}

export interface Message {
  id: string;
  event_id: string;
  user_id: string;
  content: string;
  created_at: string;
} 