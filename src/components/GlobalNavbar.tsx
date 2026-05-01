import React from 'react';
import { motion } from 'motion/react';
import { 
  Home, 
  Plus, 
  Settings,
  Trophy,
  ShoppingBag,
  HelpCircle
} from 'lucide-react';
import { useAetherStore } from '../store/useAetherStore';

interface GlobalNavbarProps {
  onAddClick: () => void;
  onHomeClick: () => void;
  onSettingsClick: () => void;
  currentView: 'dashboard' | 'leaderboard' | 'store' | 'help';
  setCurrentView: (view: 'dashboard' | 'leaderboard' | 'store' | 'help') => void;
}

export const GlobalNavbar: React.FC<GlobalNavbarProps> = ({ 
  onAddClick, 
  onHomeClick, 
  onSettingsClick,
  currentView,
  setCurrentView
}) => {
  const { mode } = useAetherStore();
  const isTitan = mode === 'titan';
  
  return (
    <div className="fixed bottom-4 md:bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[600px] z-[40]">
      <div className="flex items-center gap-3">
        {/* Left Floating Init_Node Button */}
        <div className={`filter shrink-0 self-end mb-1 ${isTitan ? 'drop-shadow-[0_4px_10px_rgba(188,19,254,0.5)]' : 'drop-shadow-[0_4px_10px_rgba(0,243,255,0.5)]'}`}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onAddClick}
            className={`w-14 h-14 md:w-16 md:h-16 ${isTitan ? 'bg-gradient-to-tr from-purple-neon to-purple-500' : 'bg-gradient-to-tr from-cyan-neon to-blue-500'} text-white flex items-center justify-center cursor-pointer relative`}
            style={{
              clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            }}
          >
            <Plus className="w-7 h-7 md:w-8 md:h-8 font-light" strokeWidth={1.5} />
          </motion.button>
        </div>

        {/* Minimalist Navigation Pill */}
        <div className="flex-1 bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/10 rounded-full h-16 shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative flex items-center justify-around px-4">
          <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${isTitan ? 'from-purple-neon/5 via-transparent to-purple-neon/5' : 'from-cyan-neon/5 via-transparent to-cyan-neon/5'} transition-all duration-700 pointer-events-none`} />
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              onHomeClick();
              setCurrentView('dashboard');
            }}
            className={`p-2 transition-colors cursor-pointer rounded-full flex items-center justify-center relative z-10 ${currentView === 'dashboard' ? 'text-white bg-white/10' : 'text-white/40 hover:text-white'}`}
            title="Dashboard"
          >
            <Home className="w-5 h-5 md:w-6 md:h-6" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setCurrentView('leaderboard')}
            className={`p-2 transition-colors cursor-pointer rounded-full flex items-center justify-center relative z-10 ${currentView === 'leaderboard' ? 'text-[#deff9a] bg-[#deff9a]/10' : 'text-white/40 hover:text-[#deff9a]'}`}
            title="Leaderboard"
          >
            <Trophy className="w-5 h-5 md:w-6 md:h-6" />
          </motion.button>

          <motion.button
            onClick={() => setCurrentView('store')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`p-2 transition-colors rounded-full flex items-center justify-center cursor-pointer relative z-10 ${currentView === 'store' ? 'text-[#deff9a] bg-[#deff9a]/10' : 'text-white/40 hover:text-white'}`}
            title="Store"
          >
            <ShoppingBag className="w-5 h-5 md:w-6 md:h-6" />
          </motion.button>

          <motion.button
            onClick={onSettingsClick}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-white/40 hover:text-white transition-colors rounded-full flex items-center justify-center cursor-pointer relative z-10"
            title="Settings"
          >
            <Settings className="w-5 h-5 md:w-6 md:h-6" />
          </motion.button>
          
          <motion.button
            onClick={() => setCurrentView('help')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={`p-2 transition-colors rounded-full flex items-center justify-center cursor-pointer relative z-10 ${currentView === 'help' ? 'text-[#deff9a] bg-[#deff9a]/10' : 'text-white/40 hover:text-white'}`}
            title="Help"
          >
            <HelpCircle className="w-5 h-5 md:w-6 md:h-6" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};
