import { useState, useEffect } from "react";
import { authService, isSupabaseConfigured } from "./lib/supabase";
import { useAetherStore } from "./store/useAetherStore";
import AetherDashboard from "./components/AetherDashboard";
import ModeSelection from "./components/ModeSelection";
import { AuthUI } from "./components/AuthUI";
import { Zap, AlertTriangle, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./components/ui/button";

export default function App() {
  const { session, user, setSession, setUser, isDemoMode, setDemoMode } = useAetherStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    if (isDemoMode) {
      setLoading(false);
      return;
    }

    // Initial session check
    authService.getSession().then((session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = authService.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setSession, setUser]);

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
              onClick={() => {
                setDemoMode(true);
              }}
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

  if (!session) {
    return <AuthUI />;
  }

  const userMetadata = session?.user?.user_metadata || user?.user_metadata || {};
  const hasSelectedMode = userMetadata.modeSelected === true || session?.user?.modeSelected === true || user?.modeSelected === true;

  return (
    <div className="min-h-screen bg-obsidian text-text-main antialiased selection:bg-cyan-neon selection:text-black">
      <AnimatePresence mode="wait">
        {!hasSelectedMode ? (
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
