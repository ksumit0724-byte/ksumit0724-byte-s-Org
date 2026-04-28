import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Dumbbell, Laptop } from 'lucide-react';
import { useAetherStore } from '../store/useAetherStore';

export const ModeTransitionOverlay: React.FC = () => {
  const { mode } = useAetherStore();
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey(prev => prev + 1);
  }, [mode]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden mix-blend-screen"
      >
        {/* Simulate scatter and assemble */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: (Math.random() - 0.5) * window.innerWidth, 
              y: (Math.random() - 0.5) * window.innerHeight,
              scale: 0,
              rotate: Math.random() * 360,
              opacity: 0
            }}
            animate={{ 
              x: 0, 
              y: 0, 
              scale: [0, 2, 1],
              rotate: 0,
              opacity: [0, 0.3, 0]
            }}
            transition={{ 
              duration: 1.2, 
              ease: "backOut",
              times: [0, 0.6, 1],
              delay: Math.random() * 0.2
            }}
            className={`absolute flex items-center justify-center ${mode === 'titan' ? 'text-purple-neon drop-shadow-[0_0_30px_rgba(188,19,254,0.5)]' : 'text-cyan-neon drop-shadow-[0_0_30px_rgba(0,243,255,0.5)]'}`}
          >
            {mode === 'titan' ? <Dumbbell size={250} strokeWidth={0.5} /> : <Laptop size={250} strokeWidth={0.5} />}
          </motion.div>
        ))}
        
        {/* Central Flash */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [0.5, 1.5, 1], opacity: [0, 0.8, 0] }}
          transition={{ duration: 1, ease: "circOut" }}
          className={`absolute w-[400px] h-[400px] rounded-full blur-[100px] ${mode === 'titan' ? 'bg-purple-neon' : 'bg-cyan-neon'}`}
        />
      </motion.div>
    </AnimatePresence>
  );
};
