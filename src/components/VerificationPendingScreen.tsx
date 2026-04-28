import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase } from '../lib/supabase';
import { useAetherStore } from '../store/useAetherStore';

export const VerificationPendingScreen: React.FC = () => {
  const navigate = useNavigate();
  const user = useAetherStore((state) => state.user);
  const isDemoMode = useAetherStore((state) => state.isDemoMode);

  useEffect(() => {
    if (isDemoMode) {
      if (user?.is_verified) {
        navigate('/dashboard');
      }
      return;
    }

    const client = getSupabase();
    if (!client || !user?.id) return;

    const channel = client
      .channel('verification-watch')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`
      }, (payload) => {
        if (payload.new.is_verified === true) {
          navigate('/dashboard');
        }
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [user, navigate, isDemoMode]);

  return (
    <div className="min-h-screen bg-obsidian text-white flex items-center justify-center p-6 relative overflow-hidden font-mono">
      <div className="absolute inset-0 bg-[#0b0e14] z-[-1]" />
      <div className="max-w-md w-full bg-black/40 backdrop-blur-sm border border-white/10 p-8 rounded-2xl text-center space-y-6 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        <div className="w-16 h-16 bg-white/5 border border-white/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <span className="text-2xl">⏳</span>
        </div>
        <div>
          <h2 className="text-xl font-bold uppercase tracking-widest text-white/90">Awaiting Approval</h2>
          <p className="text-white/40 text-xs mt-2">Neural Node: {user?.neural_id}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
          <p className="text-red-400 text-xs tracking-widest uppercase">
            Awaiting Super Admin Authorization. Your access is restricted until genome verification completes.
          </p>
        </div>
      </div>
    </div>
  );
};
