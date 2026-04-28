import React from 'react';
import { motion } from "motion/react";
import { useAetherStore } from "../store/useAetherStore";
import Model from 'react-body-highlighter';

export default function BodyMap() {
  const { targetedMuscles, toggleMuscle } = useAetherStore();

  const data = [
    {
      name: 'Active Targets',
      muscles: targetedMuscles as any, // Cast to any to align with Body Highlighter's internal Muscle typing
    }
  ];

  const handleClick = (muscleStats: any) => {
    if (muscleStats && muscleStats.muscle) {
       toggleMuscle(muscleStats.muscle);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[350px] lg:min-h-[400px] flex flex-col justify-center items-center bg-transparent group overflow-hidden">
      
      {/* HUD Elements */}
      <div className="absolute top-0 left-4 space-y-1 z-20">
        <p className="text-[7px] font-mono text-purple-neon/60 uppercase tracking-[0.3em] mb-2 drop-shadow-md">Active_Targets</p>
        <div className="max-h-24 overflow-y-auto custom-scrollbar pr-2 space-y-1">
          {targetedMuscles.map(mId => (
            <motion.div 
              key={mId}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex items-center gap-2"
            >
              <div className="w-1 h-1 bg-purple-neon shadow-[0_0_5px_rgba(188,19,254,0.5)]" />
              <span className="text-[9px] font-bold text-white/80 uppercase tracking-tighter shadow-black drop-shadow-md">
                {mId.replace('-', ' ')}
              </span>
            </motion.div>
          ))}
          {targetedMuscles.length === 0 && <p className="text-[8px] text-white/20 italic">Scanning anatomy...</p>}
        </div>
      </div>
      
      <div className="absolute bottom-4 right-4 text-right z-20 pointer-events-none">
        <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest leading-none drop-shadow-md">Synaptic_Link</p>
        <p className="text-[10px] font-black text-purple-neon drop-shadow-[0_0_5px_rgba(188,19,254,0.5)]">ENGAGED</p>
      </div>

      {/* Main Body Highlighters */}
      <div className="absolute inset-0 flex items-center justify-center pt-8 md:pt-4 px-2 opacity-80 z-10 w-[120%] -left-[10%]">
        <div className="w-1/2 max-w-[200px] h-full flex justify-center items-center scale-110 lg:scale-100 hover:scale-[1.15] lg:hover:scale-105 transition-transform duration-500 cursor-crosshair">
          <Model
            data={data}
            style={{ width: '100%', height: '80%' }}
            onClick={handleClick}
            bodyColor="rgba(255, 255, 255, 0.05)"
            highlightedColors={['#bc13fe', '#8a0bc2']}
            type="anterior"
          />
        </div>
        
        <div className="w-1/2 max-w-[200px] h-full flex justify-center items-center scale-110 lg:scale-100 hover:scale-[1.15] lg:hover:scale-105 transition-transform duration-500 cursor-crosshair">
          <Model
            data={data}
            style={{ width: '100%', height: '80%' }}
            onClick={handleClick}
            bodyColor="rgba(255, 255, 255, 0.05)"
            highlightedColors={['#bc13fe', '#8a0bc2']}
            type="posterior"
          />
        </div>
      </div>
      
      {/* Decorative Glow Elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-neon/5 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 w-full h-1/4 bg-gradient-to-t from-obsidian to-transparent pointer-events-none z-10" />
    </div>
  );
}
