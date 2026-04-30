import { useState, useEffect } from "react";
import { authService, isSupabaseConfigured } from "./lib/supabase";
import { useAetherStore } from "./store/useAetherStore";
import AetherDashboard from "./components/AetherDashboard";
import ModeSelection from "./components/ModeSelection";
import { AuthUI } from "./components/AuthUI";
import { Zap, AlertTriangle, ShieldAlert, Lock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./components/ui/button";
import { AdminPortal } from "./components/AdminPortal";

export default function App() {
  const { session, user, setSession, setUser, isDemoMode, setDemoMode, theme, currentScreen } = useAetherStore();
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    if (isDemoMode) {
      setLoading(false);
      return;
    }

    // Initial session check with timeout
    const fetchSessionWithTimeout = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Connection to Gateway timed out. Please check your network/keys.")), 8000)
        );
        const session = await Promise.race([authService.getSession(), timeoutPromise]) as any;
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user && useAetherStore.getState().currentScreen === 'mode-selection' && !useAetherStore.getState().activeMode) {
          const role = session.user.user_metadata?.role || 'individual';
          if (role === 'individual') {
            useAetherStore.getState().setMode('zenith');
          } else if (role === 'pilot') {
            useAetherStore.getState().setMode('titan');
          }
        }
        
        setLoading(false);
      } catch (err: any) {
        console.error("Failed to get session:", err);
        setAuthError(err.message || "Failed to connect to authentication server.");
        setLoading(false);
      }
    };

    fetchSessionWithTimeout();

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (event === 'SIGNED_IN' && session?.user) {
        const role = session.user.user_metadata?.role || 'individual';
        if (role === 'individual') {
          useAetherStore.getState().setMode('zenith');
        } else if (role === 'pilot') {
          useAetherStore.getState().setMode('titan');
        }
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setSession, setUser, isDemoMode]);

  if (!isSupabaseConfigured && !isDemoMode) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-obsidian p-6">
        <div className="glass-panel-heavy p-10 max-w-lg border border-red-500/20 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-4 text-white">Config_Missing</h1>
          <p className="text-white/40 font-mono text-xs mb-8 leading-relaxed">
            CRITICAL: Supabase environment variables are not detected. 
            Authentication services are locked. 
            Please add <span className="text-red-500">VITE_SUPABASE_URL</span> and <span className="text-red-500">VITE_SUPABASE_ANON_KEY</span> to your environment settings.
          </p>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => window.location.reload()}
              className="w-full bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl uppercase text-[10px] font-bold"
            >
              Retry Synchronization
            </Button>
            <Button 
              onClick={() => setDemoMode(true)}
              variant="outline"
              className="w-full border-cyan-neon/30 text-cyan-neon hover:bg-cyan-neon/10 rounded-xl uppercase text-[10px] font-bold"
            >
              Initialize Demo_OS (Local Storage)
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (authError && !isDemoMode) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-obsidian p-6">
        <div className="glass-panel-heavy p-10 max-w-lg border border-red-500/20 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-4 text-white">Gateway_Error</h1>
          <p className="text-white/40 font-mono text-xs mb-8 leading-relaxed">
            {authError}
          </p>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={() => { setAuthError(null); setLoading(true); window.location.reload(); }}
              className="w-full bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl uppercase text-[10px] font-bold"
            >
              Retry Connection
            </Button>
            <Button 
              onClick={() => setDemoMode(true)}
              variant="outline"
              className="w-full border-cyan-neon/30 text-cyan-neon hover:bg-cyan-neon/10 rounded-xl uppercase text-[10px] font-bold"
            >
              Initialize Demo_OS
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div key="loading-screen" className="h-screen w-full flex items-center justify-center bg-obsidian">
        <motion.div
          key="spinner"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 180, 270, 360] }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          className="relative w-24 h-24"
        >
          <Zap className="w-full h-full text-cyan-neon blur-sm" />
          <Zap className="absolute top-0 left-0 w-full h-full text-cyan-neon" />
        </motion.div>
      </div>
    );
  }

  if (!session && !isDemoMode) {
    return <AuthUI />;
  }

  const userMetadata = session?.user?.user_metadata || user?.user_metadata || {};
  const isVerified = userMetadata.is_verified ?? true; // Default to true for backward comp
  
  if (!isVerified) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-obsidian p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="glass-panel-heavy p-10 max-w-lg border border-purple-neon/20 text-center relative z-10">
          <div className="w-20 h-20 bg-purple-neon/10 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(188,19,254,0.15)]">
            <Lock className="w-10 h-10 text-purple-neon animate-pulse" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-4 text-white font-heading">Neural Node Pending</h1>
          <p className="text-white/50 font-mono text-sm mb-8 leading-relaxed">
            Authorization in progress. The Super Admin is verifying your credentials. Full access will be granted shortly.
          </p>
          <Button 
            onClick={() => {
              useAetherStore.getState().resetMode();
              authService.signOut();
            }}
            variant="outline"
            className="w-full border-purple-neon/30 text-purple-neon hover:bg-purple-neon/10 rounded-xl uppercase text-xs font-bold font-mono tracking-widest"
          >
            Disconnect Link
          </Button>
        </div>
      </div>
    );
  }

  // Check if route is /admin-sumit-portal (client-side simple routing mechanism)
  if (window.location.pathname === '/admin-sumit-portal') {
    return <AdminPortal />;
  }

  return (
    <div className="min-h-screen bg-obsidian text-text-main antialiased selection:bg-cyan-neon selection:text-black">
      <AnimatePresence mode="wait">
        {currentScreen === 'mode-selection' ? (
           <motion.div
             key="selection-container"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="h-full w-full"
           >
             <ModeSelection key="selection" />
           </motion.div>
        ) : (
           <motion.div
             key="dashboard-container"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="h-full w-full"
           >
             <AetherDashboard key="dashboard" />
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
