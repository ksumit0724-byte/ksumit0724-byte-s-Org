import React from 'react';
import { motion } from 'motion/react';
import { 
  Home, 
  Laptop, 
  Dumbbell, 
  Plus, 
  MoreHorizontal,
  User,
  Settings,
  LogOut,
  UserPlus,
  LogIn
} from 'lucide-react';
import { useAetherStore } from '../store/useAetherStore';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "./ui/dropdown-menu";
import { authService } from "../lib/supabase";

interface GlobalNavbarProps {
  onAddClick: () => void;
  onHomeClick: () => void;
}

export const GlobalNavbar: React.FC<GlobalNavbarProps> = ({ onAddClick, onHomeClick }) => {
  const { mode, setMode, session, setUser, setSession, setDemoMode } = useAetherStore();

  const handleLogout = async () => {
    try {
      await authService.signOut();
    } catch (e) {
      // Ignore
    }
    setDemoMode(false);
    setUser(null);
    setSession(null);
    window.location.reload();
  };

  const isTitan = mode === 'titan';
  
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] px-4 pb-6 md:px-8 md:pb-8 flex justify-center pointer-events-none">
      <div className="w-full max-w-2xl bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl h-20 md:h-24 flex items-center justify-between px-6 md:px-10 pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
        {/* Animated Background Glow */}
        <div className={`absolute inset-0 bg-gradient-to-r ${isTitan ? 'from-purple-neon/5 to-transparent' : 'from-cyan-neon/5 to-transparent'} transition-all duration-700`} />
        
        {/* Left Side: Home & Modes */}
        <div className="flex items-center gap-4 md:gap-8 z-10">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onHomeClick}
            className="p-3 text-white/40 hover:text-white transition-colors"
          >
            <Home size={24} />
          </motion.button>
          
          <div className="h-8 w-[1px] bg-white/10" />
          
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setMode('zenith')}
              className={`p-3 rounded-2xl transition-all relative ${!isTitan ? 'bg-cyan-neon/10 text-cyan-neon shadow-[0_0_15px_rgba(0,243,255,0.2)] border border-cyan-neon/30' : 'text-white/20'}`}
            >
              <Laptop size={24} />
              {!isTitan && <motion.div layoutId="navbar-glow" className="absolute -inset-1 rounded-2xl bg-cyan-neon/20 blur-md pointer-events-none" />}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setMode('titan')}
              className={`p-3 rounded-2xl transition-all relative ${isTitan ? 'bg-purple-neon/10 text-purple-neon shadow-[0_0_15px_rgba(188,19,254,0.2)] border border-purple-neon/30' : 'text-white/20'}`}
            >
              <Dumbbell size={24} />
              {isTitan && <motion.div layoutId="navbar-glow" className="absolute -inset-1 rounded-2xl bg-purple-neon/20 blur-md pointer-events-none" />}
            </motion.button>
          </div>
        </div>

        {/* Center: FAB */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-6 md:-top-10 flex flex-col items-center">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onAddClick}
              className={`w-16 h-16 md:w-20 md:h-20 ${isTitan ? 'bg-purple-neon' : 'bg-cyan-neon'} text-black rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,243,255,0.3)] transition-all duration-300 relative group/fab`}
            >
              <Plus className="w-8 h-8 md:w-10 md:h-10 transition-transform duration-300" />
              <div className={`absolute -inset-2 rounded-full ${isTitan ? 'bg-purple-neon' : 'bg-cyan-neon'} opacity-20 animate-ping pointer-events-none`} />
            </motion.button>
            <div className={`mt-2 text-[8px] font-black uppercase tracking-[0.3em] font-mono ${isTitan ? 'text-purple-neon' : 'text-cyan-neon'} animate-pulse`}>Init_Node</div>
        </div>

        {/* Right Side: Options Portal */}
        <div className="flex items-center gap-4 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-3 text-white/40 hover:text-white transition-colors rounded-2xl hover:bg-white/5 outline-none flex items-center justify-center"
              >
                <MoreHorizontal size={24} />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-obsidian/95 backdrop-blur-2xl border-white/10 text-white p-2 rounded-2xl mb-4" side="top" align="end">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-white/40 px-3 py-2 flex items-center justify-between">
                <span>System Options</span>
                {session?.user?.email && (
                  <span className="text-[8px] font-mono opacity-50 truncate max-w-[100px]">{session.user.email}</span>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5 mx-2" />
              
              <DropdownMenuItem className="p-3 rounded-xl focus:bg-white/10 cursor-pointer group">
                <User className="mr-2 h-4 w-4 text-white/40 group-hover:text-white transition-colors" />
                <span className="text-xs">Access Profile</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="p-3 rounded-xl focus:bg-white/10 cursor-pointer group">
                <Settings className="mr-2 h-4 w-4 text-white/40 group-hover:text-white transition-colors" />
                <span className="text-xs">OS Configuration</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-white/5 mx-2" />

              {session ? (
                <DropdownMenuItem onClick={handleLogout} className="p-3 rounded-xl focus:bg-red-500/10 cursor-pointer text-red-500 font-bold group">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span className="text-[10px] uppercase tracking-widest">Terminate Session</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="p-3 rounded-xl focus:bg-cyan-neon/10 cursor-pointer text-cyan-neon group">
                  <LogIn className="mr-2 h-4 w-4" />
                  <span className="text-[10px] uppercase tracking-widest">Authorize Access</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
