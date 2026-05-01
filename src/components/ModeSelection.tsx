import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAetherStore, AppMode } from "../store/useAetherStore";
import { Dumbbell, Laptop, ArrowRight, Lock } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";

import { getSupabase } from "../lib/supabase";

export default function ModeSelection() {
  const { setMode, updateUser, user, isDemoMode, activeMode, mode } = useAetherStore();
  const userRole = (user?.role || user?.user_metadata?.role || 'individual').toLowerCase();
  
  const isGymOwner = userRole === 'owner' || userRole === 'gym_owner';
  const isPilot = userRole === 'pilot';
  const isSuperAdmin = userRole === 'super_admin';

  const canAccessTitan = isGymOwner || isPilot || isSuperAdmin || isDemoMode;
  const canAccessZenith = true;

  const [glitchTitan, setGlitchTitan] = useState(false);
  const [showErrorTitan, setShowErrorTitan] = useState(false);
  
  const [glitchZenith, setGlitchZenith] = useState(false);
  const [showErrorZenith, setShowErrorZenith] = useState(false);

  const handleSelect = async (mode: AppMode) => {
    if (mode === 'titan' && !canAccessTitan) {
      setGlitchTitan(true);
      setShowErrorTitan(true);
      setTimeout(() => {
        setGlitchTitan(false);
        setShowErrorTitan(false);
      }, 3000);
      return;
    }
    if (mode === 'zenith' && !canAccessZenith) {
      setGlitchZenith(true);
      setShowErrorZenith(true);
      setTimeout(() => {
        setGlitchZenith(false);
        setShowErrorZenith(false);
      }, 3000);
      return;
    }
    setMode(mode);
    
    // Update Supabase metadata via lazy client
    if (!isDemoMode) {
      const client = getSupabase();
      if (client && user?.id) {
        const { error } = await client
          .from('profiles')
          .update({ active_mode: mode })
          .eq('id', user.id);
  
        if (!error) {
          updateUser({ active_mode: mode });
        } else {
          console.error("[AetherOS] Failed to update profile mode in DB:", error);
          updateUser({ active_mode: mode });
        }
      } else {
        updateUser({ active_mode: mode });
      }
    } else {
      console.log("[DemoMode] Updating user mode locally...");
      updateUser({ active_mode: mode });
    }

    console.log("[AetherOS] Mode committed:", mode);
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-6 gap-12 relative overflow-hidden">
      {/* Background HUD elements */}
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <div className="absolute top-0 left-0 w-full h-full border-[20vw] border-white/5 rounded-full scale-150 animate-pulse" />
      </div>

      <div className="z-10 text-center space-y-4 px-4 overflow-visible py-4">
        <div className="flex flex-col items-center gap-2">
          <Badge variant="outline" className="border-cyan-neon/30 text-cyan-neon bg-cyan-neon/5 uppercase tracking-widest text-[9px] px-3 py-1 mb-2 animate-pulse">
            Neural Link Authenticated
          </Badge>
          <h2 className="text-3xl md:text-5xl font-black md:font-light tracking-tighter uppercase font-heading leading-normal">
            Initializing <span className="text-cyan-neon">Aether</span>
          </h2>
        </div>
        <p className="text-white/30 font-mono text-[10px] md:text-xs tracking-widest uppercase">Select System Architecture</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-5xl w-full z-10 px-4 md:px-6">
        {/* Titan Mode */}
        <motion.div
          whileHover={canAccessTitan ? { scale: 1.02 } : {}}
          whileTap={canAccessTitan ? { scale: 0.98 } : {}}
          className={`glass-panel p-8 md:p-12 flex flex-col items-center gap-6 md:gap-8 group relative overflow-visible transition-all cursor-pointer border hover:border-purple-neon/40 bg-white/[0.02] ${!canAccessTitan ? 'border-white/5 opacity-30 grayscale saturate-0 contrast-75 hover:opacity-50' : activeMode === 'titan' ? 'border-purple-neon shadow-[0_0_30px_rgba(188,19,254,0.6)] bg-purple-neon/10' : 'border-white/5'} ${glitchTitan ? 'glitch-effect' : ''}`}
          onClick={() => handleSelect('titan')}
        >
          {activeMode === 'titan' && (
            <div className="absolute top-4 right-4 z-50">
              <Badge className="bg-purple-neon text-black font-black uppercase tracking-widest text-[10px] animate-pulse">ACTIVE</Badge>
            </div>
          )}
          {showErrorTitan && !canAccessTitan && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute -top-12 inset-x-0 mx-auto w-max z-50 pointer-events-none"
            >
              <Badge variant="destructive" className="bg-red-500/20 text-red-500 border border-red-500/50 font-mono tracking-widest text-[9px] uppercase backdrop-blur-md px-3 py-1 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                TITAN_LOCKED: Gym membership required
              </Badge>
            </motion.div>
          )}
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Dumbbell className="w-24 h-24 -mr-8 -mt-8" />
          </div>
          <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center transition-colors border relative ${glitchTitan && !canAccessTitan ? 'bg-red-500/10 border-red-500/30' : 'bg-purple-neon/10 group-hover:bg-purple-neon/20 border-purple-neon/50 shadow-[0_0_30px_rgba(188,19,254,0.6)]'}`}>
            <Dumbbell className={`w-8 h-8 md:w-10 md:h-10 ${glitchTitan && !canAccessTitan ? 'text-red-500' : 'text-purple-neon'}`} />
            {!canAccessTitan && (
              <div className="absolute -bottom-2 -right-2 bg-red-500/20 border border-red-500/50 p-1.5 rounded-full backdrop-blur-md">
                <Lock className="w-3 h-3 text-red-500" />
              </div>
            )}
          </div>
          <div className="text-center relative z-10">
            <h3 className="text-2xl md:text-3xl font-black md:font-bold uppercase tracking-tight mb-2 font-heading">TITAN</h3>
            <p className="text-white/30 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.2em]">Physical Optimization</p>
          </div>
          <div className="flex gap-2 relative z-10">
             <Badge variant="outline" className="text-[8px] md:text-[9px] border-white/10 text-white/40">GYM_LOGS</Badge>
             <Badge variant="outline" className="text-[8px] md:text-[9px] border-white/10 text-white/40">MACRO_GRID</Badge>
          </div>
        </motion.div>

        {/* Zenith Mode */}
        <motion.div
          whileHover={canAccessZenith ? { scale: 1.02 } : {}}
          whileTap={canAccessZenith ? { scale: 0.98 } : {}}
          className={`glass-panel p-8 md:p-12 flex flex-col items-center gap-6 md:gap-8 group relative overflow-visible transition-all cursor-pointer border hover:border-cyan-neon/40 bg-white/[0.02] ${!canAccessZenith ? 'border-white/5 opacity-30 grayscale saturate-0 contrast-75 hover:opacity-50' : activeMode === 'zenith' ? 'border-cyan-neon shadow-[0_0_30px_rgba(0,243,255,0.6)] bg-cyan-neon/10' : 'border-white/5'} ${glitchZenith ? 'glitch-effect' : ''}`}
          onClick={() => handleSelect('zenith')}
        >
          {activeMode === 'zenith' && (
            <div className="absolute top-4 right-4 z-50">
              <Badge className="bg-cyan-neon text-black font-black uppercase tracking-widest text-[10px] animate-pulse">ACTIVE</Badge>
            </div>
          )}
          {showErrorZenith && !canAccessZenith && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute -top-12 inset-x-0 mx-auto w-max z-50 pointer-events-none"
            >
              <Badge variant="destructive" className="bg-red-500/20 text-red-500 border border-red-500/50 font-mono tracking-widest text-[9px] uppercase backdrop-blur-md px-3 py-1 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                ZENITH_LOCKED: AUTHORIZATION_LEVEL_INSUFFICIENT
              </Badge>
            </motion.div>
          )}
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Laptop className="w-24 h-24 -mr-8 -mt-8" />
          </div>
          <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center transition-colors border relative ${glitchZenith && !canAccessZenith ? 'bg-red-500/10 border-red-500/30' : 'bg-cyan-neon/10 group-hover:bg-cyan-neon/20 border-cyan-neon/50 shadow-[0_0_30px_rgba(0,243,255,0.6)]'}`}>
            <Laptop className={`w-8 h-8 md:w-10 md:h-10 ${glitchZenith && !canAccessZenith ? 'text-red-500' : 'text-cyan-neon'}`} />
            {!canAccessZenith && (
              <div className="absolute -bottom-2 -right-2 bg-red-500/20 border border-red-500/50 p-1.5 rounded-full backdrop-blur-md">
                <Lock className="w-3 h-3 text-red-500" />
              </div>
            )}
          </div>
          <div className="text-center relative z-10">
            <h3 className="text-2xl md:text-3xl font-black md:font-bold uppercase tracking-tight mb-2 font-heading">ZENITH</h3>
            <p className="text-white/30 text-[9px] md:text-[10px] font-mono uppercase tracking-[0.2em]">Cognitive Output</p>
          </div>
          <div className="flex gap-2 relative z-10">
             <Badge variant="outline" className="text-[8px] md:text-[9px] border-white/10 text-white/40">DEEP_WORK</Badge>
             <Badge variant="outline" className="text-[8px] md:text-[9px] border-white/10 text-white/40">NEURAL_SYNC</Badge>
          </div>
        </motion.div>
      </div>

      <div className="mt-8 flex flex-col items-center gap-2">
        <p className="text-[8px] font-mono text-white/10 uppercase tracking-widest">Protocol Version: Stable_2.4</p>
      </div>
    </div>
  );
}
