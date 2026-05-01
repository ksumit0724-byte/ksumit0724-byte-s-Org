import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import { Button } from './ui/button';
import { useAetherStore } from '../store/useAetherStore';
import { getSupabase } from '../lib/supabase';

interface QueryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QueryModal: React.FC<QueryModalProps> = ({ isOpen, onClose }) => {
  const { user, isDemoMode } = useAetherStore();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;

    setIsSubmitting(true);
    
    if (!isDemoMode && user?.id) {
      const client = getSupabase();
      if (client) {
        await client.from('user_queries').insert({
          user_id: user.id,
          subject,
          message,
          email,
          status: 'pending'
        });
      }
    }
    
    setIsSubmitting(false);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setSubject('');
      setMessage('');
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-[#0a0a0a] border border-purple-neon/30 p-6 rounded-2xl z-[101] shadow-[0_0_30px_rgba(188,19,254,0.15)]"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black font-heading tracking-widest uppercase text-white">Raise a Query</h2>
              <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mb-4">
                  <Check size={32} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-widest font-heading">Query Submitted</h3>
                <p className="text-white/40 text-xs font-mono">We will get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest ml-1">Subject</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-neon/50 transition-colors font-mono"
                    placeholder="Enter subject..."
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest ml-1">Message</label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-neon/50 transition-colors font-mono resize-none"
                    placeholder="Describe your issue..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-widest ml-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-neon/50 transition-colors font-mono"
                    placeholder="your@email.com"
                  />
                </div>

                <div className="pt-4">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-purple-neon text-black font-bold tracking-widest uppercase hover:bg-purple-400"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Query'}
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
