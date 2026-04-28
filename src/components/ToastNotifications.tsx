import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Info } from 'lucide-react';
import { useAetherStore } from '../store/useAetherStore';

export const ToastNotifications: React.FC = () => {
  const { notifications, removeNotification, mode } = useAetherStore();

  const accentColor = mode === 'titan' ? 'text-purple-neon' : 'text-cyan-neon';
  const accentBorder = mode === 'titan' ? 'border-purple-neon/50' : 'border-cyan-neon/50';

  useEffect(() => {
    if (notifications.length > 0) {
      const timers = notifications.map(notif => {
        return setTimeout(() => {
          removeNotification(notif.id);
        }, 10000); // 10 seconds auto-dismiss
      });
      return () => timers.forEach(clearTimeout);
    }
  }, [notifications, removeNotification]);

  return (
    <div className="fixed top-20 right-4 md:right-8 z-[70] flex flex-col gap-3 pointer-events-none w-[90vw] md:w-80 max-w-sm">
      <AnimatePresence>
        {notifications.map((notif) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, x: 20 }}
            className={`pointer-events-auto bg-obsidian/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-4 overflow-hidden relative group`}
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${notif.type === 'reminder' ? 'bg-amber-400/80 shadow-[0_0_10px_rgba(251,191,36,0.8)]' : (mode === 'titan' ? 'bg-purple-neon' : 'bg-cyan-neon')}`} />
            
            <div className="flex gap-3 items-start">
              <div className={`pt-0.5 ${notif.type === 'reminder' ? 'text-amber-400' : accentColor}`}>
                {notif.type === 'reminder' ? <Bell size={18} /> : <Info size={18} />}
              </div>
              
              <div className="flex-1">
                <h4 className="text-white font-heading text-sm font-bold tracking-widest uppercase mb-1 flex justify-between items-center">
                  <span>{notif.title}</span>
                  <span className="opacity-30 text-[8px] font-mono tracking-widest">{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}</span>
                </h4>
                <p className="text-white/60 text-xs font-sans leading-relaxed">
                  {notif.message}
                </p>
              </div>

              <button 
                onClick={() => removeNotification(notif.id)}
                className="text-white/40 hover:text-white transition-colors"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
