import React from 'react';
import { motion } from 'motion/react';
import { HelpCircle, Mail, Phone, FileText, Info } from 'lucide-react';

export const HelpView: React.FC = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex-1 flex flex-col p-4 md:p-6 lg:p-8 max-w-4xl mx-auto w-full z-10 overflow-y-auto custom-scrollbar pb-32"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-purple-neon/10 border border-purple-neon/30 flex items-center justify-center">
          <HelpCircle className="w-6 h-6 text-purple-neon" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black font-heading tracking-widest uppercase">Support Center</h1>
          <p className="text-white/40 text-xs font-mono uppercase tracking-widest">Aether OS Communications</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 flex flex-col gap-6">
           <h2 className="text-sm font-bold uppercase tracking-widest text-[#deff9a] flex items-center gap-2">
             <Phone className="w-4 h-4" /> Direct Contact
           </h2>
           <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:border-white/20 transition-colors">
                <Mail className="w-5 h-5 text-purple-neon" />
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Email Support</p>
                  <p className="text-sm font-bold tracking-wider">ksumit0724@gmail.com</p>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:border-white/20 transition-colors">
                <Phone className="w-5 h-5 text-cyan-neon" />
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono">Phone Support</p>
                  <p className="text-sm font-bold tracking-wider">+91 0000000000</p>
                </div>
              </div>
           </div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-4">
           <h2 className="text-sm font-bold uppercase tracking-widest text-[#deff9a] flex items-center gap-2">
             <Info className="w-4 h-4" /> FAQ
           </h2>
           <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-center h-full min-h-[120px]">
              <p className="text-white/30 text-xs font-mono uppercase tracking-widest text-center">Placeholder for now.<br/>More help coming soon.</p>
           </div>
        </div>

        <div className="glass-panel p-6 md:col-span-2 flex flex-col gap-4">
           <h2 className="text-sm font-bold uppercase tracking-widest text-[#deff9a] flex items-center gap-2">
             <FileText className="w-4 h-4" /> Terms & Conditions
           </h2>
           <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-sm text-white/60 font-mono leading-relaxed h-[200px] overflow-y-auto custom-scrollbar">
             <p className="mb-4 text-white">1. APPLICABILITY</p>
             <p className="mb-4">These protocols govern the use of Aether OS. By initializing a Neural Node, you agree to optimize your cognitive and physical faculties.</p>
             <p className="mb-4 text-white">2. DATA PROTOCOLS</p>
             <p>All neural sync data is end-to-end encrypted. (Placeholder for now. More terms coming soon).</p>
           </div>
        </div>
      </div>
    </motion.div>
  );
};
