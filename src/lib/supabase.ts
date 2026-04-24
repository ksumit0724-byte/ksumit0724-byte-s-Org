import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let supabaseInstance: any = null;

export const getSupabase = () => {
  if (!isSupabaseConfigured) {
    console.warn("Supabase configuration is missing. Authentication and database features will be disabled.");
    return null;
  }
  
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!);
  }
  return supabaseInstance;
};

// Internal helper for service methods
const getClient = () => {
  const client = getSupabase();
  if (!client) throw new Error("Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.");
  return client;
};

export const authService = {
  async signUp(email: string, password: string, metadata: any = {}) {
    const { data, error } = await getClient().auth.signUp({ 
      email, 
      password,
      options: {
        data: metadata
      }
    });
    if (error) throw error;
    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await getClient().auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await getClient().auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    const client = getSupabase();
    if (!client) return null;
    const { data: { session } } = await client.auth.getSession();
    return session;
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    const client = getSupabase();
    if (!client) return { data: { subscription: { unsubscribe: () => {} } } };
    return client.auth.onAuthStateChange(callback);
  }
};
