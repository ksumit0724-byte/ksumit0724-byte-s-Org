import { createClient } from '@supabase/supabase-js';

const supabaseUrlRaw = import.meta.env.VITE_SUPABASE_URL;
const supabaseKeyRaw = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Sanitize keys (remove whitespace and common quoting characters)
const sanitizeKey = (key: any) => {
  if (key && typeof key === 'string') {
    return key.trim().replace(/^["'](.+(?=["']$))["']$/, '$1');
  }
  return '';
};

export const supabaseUrl = sanitizeKey(supabaseUrlRaw);
export const supabaseKey = sanitizeKey(supabaseKeyRaw);

const supabaseServiceRoleKeyRaw = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
export const supabaseServiceRoleKey = sanitizeKey(supabaseServiceRoleKeyRaw);

export const supabaseAdmin = (supabaseUrl && supabaseServiceRoleKey && supabaseUrl !== 'undefined' && supabaseServiceRoleKey !== 'undefined')
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  supabaseUrl !== 'undefined' && 
  supabaseKey !== 'undefined' &&
  supabaseUrl.startsWith('https://')
);

let supabaseInstance: any = null;

export const getSupabase = () => {
  if (!isSupabaseConfigured) {
    console.warn("Supabase configuration is missing or invalid. Authentication and database features will be disabled.");
    console.log("URL:", supabaseUrl);
    console.log("Key:", supabaseKey ? "PRESENT (length: " + supabaseKey.length + ")" : "MISSING");
    return null;
  }
  
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseKey, {
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
