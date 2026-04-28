import { authService, getSupabase } from '../lib/supabase';
import { useAetherStore } from '../store/useAetherStore';

const demoProfile = {
  neural_id: '@DEMO_USER00000000',
  role: 'gym_owner',
  is_verified: true,
  access_level: 'pro_os'
};

export const useAuth = () => {
  const isDemoMode = useAetherStore((state) => state.isDemoMode);
  const setUser = useAetherStore((state) => state.setUser);
  const setSession = useAetherStore((state) => state.setSession);

  const signUpAsGymOwner = async (email: string, password: string, gymName: string) => {
    if (isDemoMode) return demoProfile;
    const client = getSupabase();
    if (!client) throw new Error('SYSTEM_ERROR: Supabase offline.');

    const result = await authService.signUp(email, password, { role: 'gym_owner' });
    if (!result.user) throw new Error('SYSTEM_ERROR: AUTH_CREATION_FAILED');
    
    // Auth trigger will create profile, but we must create gym and update profile
    const { data: gymData, error: gymError } = await client
      .from('gyms')
      .insert({ owner_id: result.user.id, gym_name: gymName, pilot_code: generateMockPilotCode() })
      .select('id')
      .single();

    if (gymError) throw gymError;

    const { error: profileError } = await client
      .from('profiles')
      .update({ role: 'gym_owner', gym_id: gymData.id })
      .eq('id', result.user.id);
      
    if (profileError) throw profileError;

    return result;
  };

  const generateMockPilotCode = () => {
    const prefixes = ['OXY','NEO','ARC','TRX','ZEN','NVX','HEX'];
    return prefixes[Math.floor(Math.random() * prefixes.length)] + '-' + String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  };

  const signUpAsPilot = async (email: string, password: string, pilotCode: string) => {
    if (isDemoMode) return demoProfile;
    const client = getSupabase();
    if (!client) throw new Error('SYSTEM_ERROR: Supabase offline.');

    const { data: gym, error: gymError } = await client
      .from('gyms')
      .select('id')
      .eq('pilot_code', pilotCode)
      .single();

    if (gymError || !gym) throw new Error('SYSTEM_ERROR: INVALID_PILOT_CODE');

    const result = await authService.signUp(email, password, { role: 'pilot' });
    if (!result.user) throw new Error('SYSTEM_ERROR: AUTH_CREATION_FAILED');

    const { error: profileError } = await client
      .from('profiles')
      .update({ role: 'pilot', gym_id: gym.id, is_verified: true })
      .eq('id', result.user.id);

    if (profileError) throw profileError;

    return result;
  };

  const signIn = async (email: string, password: string) => {
    if (isDemoMode) {
      setUser(demoProfile);
      return { profile: demoProfile };
    }
    const client = getSupabase();
    if (!client) throw new Error('SYSTEM_ERROR: Supabase offline.');

    const result = await authService.signIn(email, password);
    const { data: profile, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', result.user.id)
      .single();
    
    if (error) throw error;
    setUser(profile);
    setSession(result.session);
    return { session: result.session, profile };
  };

  const signOut = async () => {
    if (!isDemoMode) {
      await authService.signOut();
    }
    setUser(null);
    setSession(null);
  };

  const getProfile = async () => {
    if (isDemoMode) return demoProfile;
    const client = getSupabase();
    if (!client) throw new Error('SYSTEM_ERROR: Supabase offline.');

    const { data: session } = await client.auth.getSession();
    if (!session?.session?.user) return null;

    const { data: profile, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', session.session.user.id)
      .single();
      
    if (error) throw error;
    return profile;
  };

  const updateNeuralId = async (newId: string) => {
    if (isDemoMode) return;
    const client = getSupabase();
    if (!client) throw new Error('SYSTEM_ERROR: Supabase offline.');

    const { data: session } = await client.auth.getSession();
    if (!session?.session?.user) throw new Error('SYSTEM_ERROR: UNAUTHORIZED');

    const { error } = await client
      .from('profiles')
      .update({ neural_id: newId })
      .eq('id', session.session.user.id);
      
    if (error) throw error;
  };

  return {
    signUpAsGymOwner,
    signUpAsPilot,
    signIn,
    signOut,
    getProfile,
    updateNeuralId,
    isDemoMode,
    demoProfile
  };
};
