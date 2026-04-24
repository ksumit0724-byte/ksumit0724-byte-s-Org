import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { authService } from '../lib/supabase';
import { useAetherStore } from '../store/useAetherStore';
import { Button } from './ui/button';
import { Input } from '@/components/ui/input';
import { LogIn, UserPlus, Zap, Loader2, AlertCircle } from 'lucide-react';

export const AuthUI: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isDemoMode, setSession, setUser } = useAetherStore();

  const handleDemoAuth = () => {
    setLoading(true);
    setTimeout(() => {
      const mockUser = {
        id: 'demo-user',
        email: 'demo@aether.neural',
        user_metadata: { modeSelected: false }
      };
      setSession({ user: mockUser });
      setUser(mockUser);
      setLoading(false);
    }, 1500);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        await authService.signIn(email, password);
      } else {
        await authService.signUp(email, password, { username });
        setError('Neural link established. Verification email sent to your sector.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed: Neural interference detected.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-obsidian p-4 md:p-8 relative overflow-hidden group">
      {/* Background Grid & Glows */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full">
           <div className="absolute top-1/2 left-1/4 w-[40vw] h-[40vw] bg-cyan-neon/5 blur-[120px] rounded-full animate-pulse" />
           <div className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] bg-purple-neon/5 blur-[100px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md glass-panel-heavy p-8 md:p-12 relative z-10 border border-white/10 overflow-hidden"
      >
        {/* Subtle Scanline Effect on Modal */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/[0.02] via-transparent to-white/[0.02]" />
        
        <div className="flex flex-col items-center mb-10 relative">
          <motion.div 
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-20 h-20 bg-gradient-to-br from-cyan-neon via-purple-neon to-black rounded-3xl flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(0,243,255,0.2)] border border-white/20"
          >
            <Zap className="w-10 h-10 text-white fill-white" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-1 font-heading">
            AETHER <span className="text-white/20 font-light">OS</span>
          </h1>
          <div className="flex items-center gap-2">
            <div className="h-1px w-4 bg-cyan-neon/30" />
            <p className="text-white/40 text-[10px] tracking-[0.4em] uppercase font-mono italic">Sector_Gateway_Login</p>
            <div className="h-1px w-4 bg-cyan-neon/30" />
          </div>
        </div>

        <form onSubmit={handleAuth} className="space-y-5 relative">
          {!isLogin && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold ml-1 font-mono">Pilot Designation</label>
              <Input
                type="text"
                placeholder="e.g. ZERO_ONE"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white/5 border-white/10 focus:border-cyan-neon/50 h-14 rounded-2xl text-white placeholder:text-white/10 transition-all font-mono"
              />
            </motion.div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold ml-1 font-mono">Neural Bridge ID (Email)</label>
            <Input
              type="email"
              placeholder="pilot@aether.neural"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/5 border-white/10 focus:border-cyan-neon/50 h-14 rounded-2xl text-white placeholder:text-white/10 transition-all font-mono text-lg"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-white/30 font-bold ml-1 font-mono">Secure Encryption (Password)</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/5 border-white/10 focus:border-cyan-neon/50 h-14 rounded-2xl text-white placeholder:text-white/10 transition-all font-mono text-lg"
              required
            />
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-4 rounded-xl text-xs flex items-start gap-3 font-mono leading-relaxed ${error.includes('sent') ? 'bg-cyan-neon/10 text-cyan-neon border border-cyan-neon/30' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            type="submit"
            disabled={loading}
            className={`w-full h-16 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all relative overflow-hidden group/btn ${isLogin ? 'bg-cyan-neon text-black shadow-[0_0_40px_rgba(0,243,255,0.2)]' : 'bg-purple-neon text-white shadow-[0_0_40px_rgba(188,19,254,0.2)]'}`}
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <span className="flex items-center justify-center gap-2">
                {isLogin ? <LogIn className="w-4 h-4 translate-y-[-1px]" /> : <UserPlus className="w-4 h-4 translate-y-[-1px]" />}
                {isLogin ? 'Initiate System Access' : 'Register New Node'}
              </span>
            )}
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500 skew-x-12" />
          </Button>

          {isDemoMode && (
            <Button
              type="button"
              onClick={handleDemoAuth}
              disabled={loading}
              variant="outline"
              className="w-full h-14 rounded-2xl text-[9px] font-bold uppercase tracking-[0.2em] border-white/10 text-white/40 hover:text-white hover:bg-white/5 transition-all"
            >
              Skip Authentication (Local_Demo)
            </Button>
          )}
        </form>

        <div className="mt-10 flex flex-col items-center gap-4 relative">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-[9px] text-white/30 hover:text-white transition-colors font-mono uppercase tracking-[0.1em] underline underline-offset-4"
          >
            {isLogin ? "Neural records missing? Register Identity" : "Identity confirmed? Access Gateway"}
          </button>
          
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          
          <p className="text-white/10 text-[8px] font-mono tracking-widest uppercase text-center">
            Encryption: 1024-bit Quantum <br />
            Node: AF-09 | Sync: Optimal
          </p>
        </div>
      </motion.div>
    </div>
  );
};
