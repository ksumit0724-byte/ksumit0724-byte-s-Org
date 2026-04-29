import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, CheckCircle, X, Check } from 'lucide-react';
import { Button } from './ui/button';
import { useAetherStore } from '../store/useAetherStore';
import { createClient } from '@supabase/supabase-js';
import { SUPER_ADMIN_EMAIL } from '../lib/constants';
import { useNavigate } from 'react-router-dom';

const supabaseUrlRaw = import.meta.env.VITE_SUPABASE_URL;
const serviceRoleKeyRaw = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const sanitizeKey = (key: any) => {
  if (key && typeof key === 'string') {
    return key.trim().replace(/^["'](.+(?=["']$))["']$/, '$1');
  }
  return '';
};

const supabaseUrl = sanitizeKey(supabaseUrlRaw);
const serviceRoleKey = sanitizeKey(serviceRoleKeyRaw);

// Create a helper to get the admin client so it doesn't crash on module load if keys are missing
const getSupabaseAdmin = () => {
  if (!supabaseUrl || !serviceRoleKey || supabaseUrl === 'undefined' || serviceRoleKey === 'undefined') return null;
  return createClient(supabaseUrl, serviceRoleKey);
};

export const AdminPortal: React.FC = () => {
  const [owners, setOwners] = useState<any[]>([]);
  const user = useAetherStore((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.email !== SUPER_ADMIN_EMAIL && !useAetherStore.getState().isDemoMode) {
      navigate('/');
      return;
    }
    fetchPendingOwners();
  }, [user, navigate]);

  const fetchPendingOwners = async () => {
    if (useAetherStore.getState().isDemoMode) return;
    const adminClient = getSupabaseAdmin();
    if (!adminClient) return;

    const { data, error } = await adminClient
      .from('profiles')
      .select('*, gyms(gym_name, pilot_code)')
      .eq('role', 'gym_owner')
      .eq('is_verified', false);

    if (!error && data) {
      setOwners(data.map(p => ({
        id: p.id,
        name: p.neural_id,
        gym: p.gyms?.[0]?.gym_name || 'UNKNOWN',
        email: p.email
      })));
    }
  };
  
  const handleAuthorize = async (id: string, name: string) => {
    if (useAetherStore.getState().isDemoMode) {
      setOwners(prev => prev.filter(o => o.id !== id));
      return;
    }
    const adminClient = getSupabaseAdmin();
    if (!adminClient) return;

    const { error } = await adminClient
      .from('profiles')
      .update({ is_verified: true })
      .eq('id', id);

    if (!error) {
      setOwners(prev => prev.filter(o => o.id !== id));
      alert(`Success: Neural Node ${name} Authorized. Welcome sequence initiated.`);
    }
  };

  const handleReject = async (id: string) => {
    if (useAetherStore.getState().isDemoMode) {
      setOwners(prev => prev.filter(o => o.id !== id));
      return;
    }
    const adminClient = getSupabaseAdmin();
    if (!adminClient) return;

    // Delete from auth.users (cascades to profile)
    await adminClient.auth.admin.deleteUser(id);
    setOwners(prev => prev.filter(o => o.id !== id));
  };

  return (
    <div className="min-h-screen bg-obsidian text-white p-6 md:p-12 relative overflow-hidden font-mono">
      <div className="absolute inset-0 bg-[#0b0e14] z-[-1]" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-10 border-b border-white/10 pb-6">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-widest text-red-500">Super Admin Gateway</h1>
            <p className="text-white/40 text-xs font-mono">Node Authorization Control | Sumit's Portal</p>
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-sm uppercase tracking-[0.2em] text-white/50 mb-4 font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Pending Gym Owners ({owners.length})
          </h2>
          
          <AnimatePresence>
            {owners.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-center p-12 border border-white/5 rounded-2xl bg-white/5"
              >
                <CheckCircle className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/40 text-sm tracking-widest uppercase">All Nodes Authorized</p>
              </motion.div>
            ) : (
              owners.map((owner) => (
                <motion.div
                  key={owner.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col md:flex-row items-center gap-6 p-6 border border-white/10 rounded-2xl bg-black/40 backdrop-blur-sm group hover:border-red-500/30 transition-all"
                >
                  <div className="flex-1 flex gap-6 w-full">
                    <div className="hidden md:flex w-12 h-12 rounded-xl bg-white/5 items-center justify-center font-black text-white/80 shrink-0">
                      {(owner.gym).slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-purple-neon/20 border border-purple-neon/50 rounded text-[9px] font-bold uppercase tracking-widest text-purple-neon">
                          Gym Owner
                        </span>
                        <h3 className="text-lg font-bold text-white tracking-widest">@{owner.name}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono text-white/50">
                        <span>Facility: <strong className="text-white">{owner.gym}</strong></span>
                        <span>|</span>
                        <span>{owner.email}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex w-full md:w-auto shrink-0 gap-3">
                    <Button 
                      variant="outline"
                      className="w-full md:w-auto h-12 bg-white/5 border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-xl uppercase text-[10px] font-bold tracking-widest"
                      onClick={() => handleReject(owner.id)}
                    >
                      <X className="w-4 h-4" />
                      <span className="md:hidden ml-2">Reject</span>
                    </Button>
                    <Button 
                      onClick={() => handleAuthorize(owner.id, owner.name)}
                      className="w-full md:w-auto h-12 bg-red-500/10 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-xl uppercase text-[10px] font-black tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.2)] hover:shadow-[0_0_40px_rgba(239,68,68,0.6)] flex items-center gap-2 transition-all"
                    >
                      <span>Authorize Node</span>
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
