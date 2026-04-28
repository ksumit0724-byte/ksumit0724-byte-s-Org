import { createClient } from '@supabase/supabase-js';

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
let supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Sanitize keys (remove whitespace and common quoting characters)
if (supabaseUrl && typeof supabaseUrl === 'string') {
  supabaseUrl = supabaseUrl.trim().replace(/^["'](.+(?=["']$))["']$/, '$1');
}
if (supabaseAnonKey && typeof supabaseAnonKey === 'string') {
  supabaseAnonKey = supabaseAnonKey.trim().replace(/^["'](.+(?=["']$))["']$/, '$1');
}

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'undefined' && 
  supabaseAnonKey !== 'undefined' &&
  supabaseUrl.startsWith('https://')
);

let supabaseInstance: any = null;

export const getSupabase = () => {
  if (!isSupabaseConfigured) {
    console.warn("Supabase configuration is missing or invalid. Authentication and database features will be disabled.");
    console.log("URL:", supabaseUrl);
    console.log("Key:", supabaseAnonKey ? "PRESENT (length: " + supabaseAnonKey.length + ")" : "MISSING");
    return null;
  }
  
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        }
      });
    } catch (e) {
      console.error("Critical: Failed to initialize Supabase client:", e);
      return null;
    }
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
        data: metadata,
        emailRedirectTo: window.location.origin,
      }
    });
    if (error) throw error;
    return data;
  },

  async verifyOtp(email: string, token: string) {
    const { data, error } = await getClient().auth.verifyOtp({
      email,
      token,
      type: 'signup'
    });
    if (error) throw error;
    return data;
  },

  async resendOtp(email: string) {
    const { data, error } = await getClient().auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: window.location.origin,
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
