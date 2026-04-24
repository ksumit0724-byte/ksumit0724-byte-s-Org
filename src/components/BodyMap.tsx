import React from 'react';
import { motion } from "motion/react";
import { useAetherStore } from "../store/useAetherStore";
import { cn } from "../lib/utils";

const muscles = [
  { id: "chest", name: "Pectoral Nodes", path: "M 40 32 Q 50 30 60 32 C 65 42 55 48 50 50 C 45 48 35 42 40 32" },
  { id: "abs", name: "Core Latice", path: "M 42 52 L 58 52 L 57 70 C 50 75 43 70 42 52" },
  { id: "shoulders", name: "Deltoid Links", path: "M 32 25 Q 38 22 43 28 L 38 35 L 30 32 Z M 67 25 Q 62 22 57 28 L 62 35 L 70 32 Z" },
  { id: "legs", name: "Kinetic Pillars", path: "M 40 75 L 48 74 L 46 95 L 35 95 Z M 52 74 L 60 75 L 65 95 L 54 95 Z" },
  { id: "arms", name: "Bicep Actuators", path: "M 24 35 L 33 37 L 31 55 L 23 52 Z M 76 35 L 67 37 L 69 55 L 77 52 Z" },
];

export default function BodyMap() {
  const { targetedMuscles, toggleMuscle } = useAetherStore();

  return (
    <div className="relative w-full h-[320px] bg-black/20 rounded-3xl border border-white/5 p-4 overflow-hidden group">
      {/* Background Tech Scan Circle */}
      <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
         <div className="w-48 h-48 border border-purple-neon rounded-full animate-ping" />
         <div className="absolute w-64 h-64 border border-purple-neon/20 rounded-full animate-pulse" />
      </div>

      <svg viewBox="0 0 100 100" className="h-full w-auto mx-auto relative z-10 drop-shadow-[0_0_20px_rgba(188,19,254,0.1)]">
        {/* Biomechanical Skeleton / Wireframe */}
        <g stroke="rgba(255,255,255,0.05)" strokeWidth="0.2" fill="none">
           <path d="M 50 10 L 50 85" />
           <path d="M 30 30 L 70 30" />
           <path d="M 35 75 L 65 75" />
           <circle cx="50" cy="15" r="5" />
           {/* Ribcage accents */}
           {[35, 40, 45].map(y => <path key={y} d={`M 42 ${y} Q 50 ${y-2} 58 ${y}`} />)}
        </g>

        {muscles.map((m) => {
          const isActive = targetedMuscles.includes(m.id);
          return (
            <g key={m.id}>
              <motion.path
                d={m.path}
                initial={false}
                animate={{
                  fill: isActive ? "#BC13FE" : "rgba(255,255,255,0.03)",
                  fillOpacity: isActive ? 0.4 : 1,
                  stroke: isActive ? "#BC13FE" : "rgba(255,255,255,0.1)",
                  filter: isActive ? "blur(0.5px)" : "none",
                }}
                whileHover={{ 
                  fill: "rgba(188,19,254,0.2)",
                  stroke: "#BC13FE",
                  cursor: "pointer"
                }}
                onClick={() => toggleMuscle(m.id)}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="transition-all duration-300"
                strokeWidth="0.6"
              />
              {/* Internal Fiber Details (only visible when active) */}
              {isActive && (
                <motion.path
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  d={m.path}
                  fill="none"
                  stroke="white"
                  strokeWidth="0.1"
                  strokeDasharray="1 2"
                />
              )}
            </g>
          );
        })}

        {/* HUD Markers */}
        <g className="opacity-40">
           <circle cx="50" cy="50" r="0.5" fill="#BC13FE" />
           <line x1="50" y1="50" x2="80" y2="20" stroke="rgba(188,19,254,0.3)" strokeWidth="0.1" />
           <text x="82" y="20" fontSize="2" fill="white" className="font-mono uppercase">SYNC_LNK</text>
        </g>
      </svg>

      {/* Target Labels Overlay */}
      <div className="absolute top-4 left-4 space-y-1">
        <p className="text-[7px] font-mono text-purple-neon/60 uppercase tracking-[0.3em] mb-2">Active_Targets</p>
        {targetedMuscles.map(mId => (
          <motion.div 
            key={mId}
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="w-1 h-1 bg-purple-neon" />
            <span className="text-[9px] font-bold text-white/80 uppercase tracking-tighter">
              {muscles.find(m => m.id === mId)?.name}
            </span>
          </motion.div>
        ))}
        {targetedMuscles.length === 0 && <p className="text-[8px] text-white/20 italic">Scanning for engagement...</p>}
      </div>
      
      <div className="absolute bottom-4 right-4 text-right">
        <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest leading-none">Biomechanical_Sync</p>
        <p className="text-[10px] font-black text-purple-neon">NOMINAL</p>
      </div>
    </div>
  );
}
