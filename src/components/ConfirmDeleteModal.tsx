import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, ShieldAlert, X } from 'lucide-react';
import { Button } from './ui/button';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title = "Confirm Termination",
  description = "This data will be permanently purged from the neural grid. This action cannot be reversed."
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-full max-w-sm glass-panel-heavy border-red-500/30 overflow-hidden relative"
          >
            {/* Warning Scanline */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
            
            <div className="p-8 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20">
                <ShieldAlert className="w-8 h-8 text-red-500" />
              </div>
              
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">{title}</h2>
              <p className="text-white/40 text-xs font-mono mb-8 italic">{description}</p>
              
              <div className="flex flex-col w-full gap-3">
                <Button 
                  onClick={onConfirm}
                  variant="destructive"
                  className="bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-widest text-[10px] h-12 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                >
                  Confirm Deletion
                </Button>
                <Button 
                  onClick={onCancel}
                  variant="ghost"
                  className="text-white/40 hover:text-white uppercase tracking-widest text-[10px] font-bold h-12 rounded-xl"
                >
                  Abort
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
