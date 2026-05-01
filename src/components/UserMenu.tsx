import React, { useState, useEffect } from 'react';
import { useAetherStore } from "../store/useAetherStore";
import { getSupabase } from "../lib/supabase";
import { useAuth } from '../hooks/useAuth';
import { LogOut, User, Mail, Camera, Save, X, Settings, Shield, Headset, Moon, Sun, Key } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "./ui/dialog";

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, isDemoMode, theme, setTheme } = useAetherStore();
  const { signOut, updateNeuralId } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [neuralId, setNeuralId] = useState(user?.neural_id || '@AETHER_PILOT_000');
  const [pilotCode, setPilotCode] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNeuralId(user?.neural_id || '@AETHER_PILOT_000');
      
      // Fetch pilot code if gym_owner
      if (!isDemoMode && user?.role === 'gym_owner' && user?.id) {
         const fetchPilotCode = async () => {
            const client = getSupabase();
            if(!client) return;
            const { data } = await client.from('gyms').select('pilot_code').eq('owner_id', user.id).single();
            if (data) {
               setPilotCode(data.pilot_code);
            }
         };
         fetchPilotCode();
      } else if (isDemoMode && user?.role === 'gym_owner') {
         setPilotCode("DEMO-123");
      }
    }
  }, [isOpen, user, isDemoMode]);

  const handleLogout = async () => {
    await signOut();
    window.location.reload(); 
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await updateNeuralId(neuralId);
      setIsEditing(false);
    } catch (error: any) {
      alert(`[ERROR] ${error?.message || 'Failed to update profile'}`);
    } finally {
      setLoading(false);
    }
  };

  const userRole = user?.role || 'pilot';
  const userEmail = user?.email || 'not_linked@aether.os';
  const displayAvatar = user?.avatar_url || null;
  const accessLevel = user?.access_level || 'FREE';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-obsidian/95 backdrop-blur-2xl border-white/10 text-white max-w-md w-[92vw] overflow-y-auto max-h-[90vh] custom-scrollbar rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black tracking-tighter uppercase mb-2">Global Settings & Auth</DialogTitle>
          <DialogDescription className="text-white/40 font-mono text-[10px] uppercase">
            Managing secure identity and resource allocation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-4">
            {!isEditing ? (
              <>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-cyan-neon/20 border border-cyan-neon/50 flex items-center justify-center overflow-hidden shrink-0">
                    {displayAvatar ? (
                      <img src={displayAvatar} alt="Pilot Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-cyan-neon" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-cyan-neon font-bold text-sm truncate">{neuralId}</div>
                    <div className="text-[10px] font-mono text-white/40 truncate">{userEmail}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="bg-white/5 border-white/10 text-xs py-1 h-8">
                    Edit
                  </Button>
                </div>
                <div className="h-[1px] bg-white/5" />
                <div className="flex justify-between items-center text-[10px] font-mono text-white/40 uppercase">
                  <span>Access Level</span>
                  <span className="text-cyan-neon font-bold">{accessLevel}</span>
                </div>
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-cyan-neon animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-tight">Active Subscription</span>
                   </div>
                   <Badge className="bg-cyan-neon text-black text-[8px]">{accessLevel}</Badge>
                </div>
              </>
            ) : (
              <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#deff9a]">Edit Identity</h4>
                  <button onClick={() => setIsEditing(false)} className="text-white/40 hover:text-white"><X size={16}/></button>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-3 p-4 bg-black/20 rounded-lg border border-white/5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-white/50 uppercase font-mono">Neural ID</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-neon/50" />
                        <Input
                          value={neuralId}
                          onChange={(e) => setNeuralId(e.target.value)}
                          placeholder="ENTER NEURAL ID"
                          className="pl-9 h-10 bg-black/40 border-white/10 text-xs font-mono focus:border-cyan-neon/50 transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleSaveProfile} 
                  disabled={loading}
                  className="w-full bg-[#deff9a] text-black hover:bg-[#deff9a]/80 font-bold uppercase mt-2 h-10"
                >
                  {loading ? 'Transmitting...' : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Sync Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-[10px] uppercase font-bold text-white/40 ml-1">System Preferences</h4>
            <div className="space-y-1">
              <Button 
                variant="ghost" 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="w-full justify-between pr-4 text-xs font-bold text-white/70 hover:text-white hover:bg-white/5 border border-transparent hover:border-white/10 rounded-xl h-10 transition-all"
              >
                <span className="flex items-center">
                  {theme === 'dark' ? <Moon className="w-4 h-4 mr-3 text-purple-neon" /> : <Sun className="w-4 h-4 mr-3 text-cyan-neon" />}
                  Theme Mode
                </span>
                <span className="text-[10px] font-mono uppercase text-white/40">{theme}</span>
              </Button>
            </div>
          </div>

          {(userRole === 'gym_owner' || userRole === 'owner') && (
            <div className="space-y-3 p-4 bg-purple-neon/5 rounded-xl border border-purple-neon/20">
              <h4 className="text-[10px] md:text-xs uppercase font-bold text-purple-neon tracking-widest text-center flex items-center justify-center gap-2">
                 <Shield className="w-3 h-3 md:w-4 md:h-4" /> FACILITY COMMAND CENTER
              </h4>
              <div className="bg-black/40 border border-white/10 rounded-lg p-3 text-center space-y-2 mb-3">
                 <p className="text-[10px] text-white/40 uppercase font-mono">YOUR PILOT CODE</p>
                 <div className="flex justify-center items-center gap-2">
                   <Key className="text-purple-neon w-4 h-4" />
                   <span className="text-xl font-bold tracking-[0.2em]">{pilotCode || '...'}</span>
                 </div>
                 <p className="text-[9px] text-white/30 italic">Members use this code to register under this gym.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                 <Button className="bg-white/5 border border-white/10 text-white hover:bg-white/10 h-10 text-[9px] font-bold uppercase tracking-widest px-2">Member Dir</Button>
                 <Button className="bg-white/5 border border-white/10 text-white hover:bg-white/10 h-10 text-[9px] font-bold uppercase tracking-widest px-2">Requests</Button>
                 <Button className="bg-white/5 border border-white/10 text-white hover:bg-white/10 h-10 text-[9px] font-bold uppercase tracking-widest px-2">Gym Settings</Button>
                 <Button className="bg-[#deff9a]/10 border border-[#deff9a]/30 text-[#deff9a] hover:bg-[#deff9a]/20 h-10 text-[9px] font-bold uppercase tracking-widest px-2" onClick={() => {
                   onClose();
                   // Wait for dashboard to close setting and trigger store.
                   // we don't have access to setCurrentView here easily unless passed down or via store.
                   // Actually we can add currentView to AetherStore if needed.
                 }}>Store Listings</Button>
              </div>
            </div>
          )}

          <div className="flex gap-2">
             <Button onClick={onClose} className="flex-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl uppercase text-[10px] font-bold">
               Return
             </Button>
             <Button onClick={handleLogout} className="flex-1 bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 hover:text-red-400 rounded-xl uppercase text-[10px] font-bold gap-2">
               <LogOut size={14} />
               Logout
             </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
