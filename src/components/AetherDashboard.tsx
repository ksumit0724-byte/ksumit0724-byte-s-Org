import { motion, AnimatePresence } from "motion/react";
import { useAetherStore, AetherTask } from "../store/useAetherStore";
import { 
  Zap, 
  Dumbbell, 
  Laptop, 
  Calendar, 
  Settings,
  Bell,
  Clock,
  Edit2,
  Trash2,
  ShieldCheck,
  User
} from "lucide-react";
import { Button } from "./ui/button";
import NeuralAnalytics from "./NeuralAnalytics";
import { useNotificationSync } from "../services/notificationService";
import { InhibitorWidget } from "./InhibitorWidget";
import BodyMap from "./BodyMap";
import { useState, useMemo, useEffect } from "react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { getSupabase } from "../lib/supabase";

import { AmbientVisualizer } from "./AmbientVisualizer";
import { ModeTransitionOverlay } from "./ModeTransitionOverlay";
import { UserSettingsModal } from "./UserMenu";
import { TaskInput } from "./TaskInput";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { GlobalNavbar } from "./GlobalNavbar";
import { AiInsightsModal } from "./AiInsightsModal";
import { useTaskReminders } from "../hooks/useTaskReminders";
import { ToastNotifications } from "./ToastNotifications";
import { TitanLeaderboard } from "./TitanLeaderboard";
import { AetherStore } from "./AetherStore";
import { FocusProtocol } from "./zenith/FocusProtocol";
import { WeeklyAnalytics } from "./zenith/WeeklyAnalytics";
import { SkillProgress } from "./zenith/SkillProgress";
import { HelpView } from "./HelpView";
import { QueryModal } from "./QueryModal";
import { HelpCircle } from "lucide-react";

const CATEGORY_COLORS: Record<string, string> = {
  'Office Work': 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  'Personal Work': 'text-cyan-400 border-cyan-400/30 bg-cyan-400/5',
  'Skills': 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  'Good Habits': 'text-amber-400 border-amber-400/30 bg-amber-400/5',
  'Bad Habits': 'text-red-400 border-red-400/30 bg-red-400/5',
  'Other': 'text-slate-400 border-slate-400/30 bg-slate-400/5',
  'Workout': 'text-purple-400 border-purple-400/30 bg-purple-400/5',
  'Nutrition': 'text-orange-400 border-orange-400/30 bg-orange-400/5',
  'Recovery': 'text-teal-400 border-teal-400/30 bg-teal-400/5',
  'Supplementation': 'text-pink-400 border-pink-400/30 bg-pink-400/5',
};

export default function AetherDashboard() {
  const { mode, tasks, addTask, updateTask, deleteTask, setTasks, updateUser, user, isDemoMode, resetMode } = useAetherStore();
  const [taskToEdit, setTaskToEdit] = useState<AetherTask | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isTaskInputOpen, setIsTaskInputOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeNode, setActiveNode] = useState('07_WEEK');
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'COMPLETE'>('ALL');
  const [currentView, setCurrentView] = useState<'dashboard' | 'leaderboard' | 'store' | 'help'>('dashboard');
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
  const [zenithTab, setZenithTab] = useState<'WORKSPACE' | 'PROTOCOL' | 'ANALYTICS'>('WORKSPACE');
  const [zenithState, setZenithState] = useState<'FLOW' | 'SCATTERED' | 'LOW_ENERGY' | 'FOCUSED'>('FLOW');
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);
  
  const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);

  const showSystemToast = (msg: string) => {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-mono text-xs px-4 py-3 rounded-lg z-[100] animate-in slide-in-from-bottom-5';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-5');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const updateTaskStatus = async (taskId: string, newStatus: 'active' | 'complete') => {
    updateTask(taskId, { status: newStatus });
    
    if (newStatus === 'complete') {
      showSystemToast('PROTOCOL_COMPLETE ✓');
      await addXP(taskId);
    }
    
    if (!isDemoMode && user?.id) {
      const { getSupabase } = await import('../lib/supabase');
      const client = getSupabase();
      if (client) {
        await client.from('tasks').update({ status: newStatus }).eq('id', taskId).eq('user_id', user.id);
      }
    }
  };

  const addXP = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const xpAmount = task.mode === 'titan' ? 50 : 75;
    const category = task.category;
    
    if (!isDemoMode && user?.id) {
      const { getSupabase } = await import('../lib/supabase');
      const client = getSupabase();
      if (client) {
        await client.from('user_xp').upsert({
          user_id: user.id,
          category: category,
          mode: task.mode,
          xp_points: xpAmount,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'user_id,category,mode',
          ignoreDuplicates: false
        });
      }
    }
  };

  useEffect(() => {
    if (isDemoMode) return;
    const client = getSupabase();
    if (!client || !user?.id) return;

    const fetchTasks = async () => {
      const { data, error } = await client.from('tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (!error && data) {
         console.log("Fetched Tasks from Supabase:", data);
         const mappedTasks = data.map(dbT => ({
           id: dbT.id,
           title: dbT.title,
           category: dbT.category,
           mode: dbT.mode as any,
           type: dbT.mode === 'titan' ? 'workout' : 'work' as any,
           startTime: new Date(dbT.start_time).getTime(),
           intensity: dbT.priority === 3 ? 80 : dbT.priority === 2 ? 50 : 20,
           reminderOffset: dbT.tags?.includes('reminder') ? 15 : undefined,
           reminderSent: false,
           status: dbT.status || 'pending',
           createdAt: new Date(dbT.created_at).getTime()
         }));
         setTasks(mappedTasks);
      }
    };
    fetchTasks();

    const channel = client
      .channel('tasks-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newTask = payload.new;
          addTask({
            id: newTask.id,
            title: newTask.title,
            category: newTask.category,
            mode: newTask.mode as any,
            type: newTask.mode === 'titan' ? 'workout' : 'work',
            startTime: new Date(newTask.start_time).getTime(),
            intensity: newTask.priority === 3 ? 80 : newTask.priority === 2 ? 50 : 20,
            reminderOffset: newTask.tags?.includes('reminder') ? 15 : undefined,
            reminderSent: false,
            status: newTask.status || 'pending',
            createdAt: new Date(newTask.created_at).getTime()
          });
        } else if (payload.eventType === 'UPDATE') {
          const updTask = payload.new;
          updateTask(updTask.id, {
            title: updTask.title,
            category: updTask.category,
            startTime: new Date(updTask.start_time).getTime(),
            intensity: updTask.priority === 3 ? 80 : updTask.priority === 2 ? 50 : 20,
            status: updTask.status,
          });
        } else if (payload.eventType === 'DELETE') {
          deleteTask(payload.old.id);
        }
      })
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [user, isDemoMode, addTask, updateTask, deleteTask]);

  const handleGenerateInsights = () => {
    setIsInsightsModalOpen(true);
  };

  useNotificationSync();
  useTaskReminders();

  let accentColor = mode === 'titan' ? 'text-purple-neon' : 'text-cyan-neon';
  let accentBg = mode === 'titan' ? 'bg-purple-neon' : 'bg-cyan-neon';
  
  if (mode === 'zenith') {
    switch (zenithState) {
      case 'FLOW': accentColor = 'text-cyan-400'; accentBg = 'bg-cyan-400'; break;
      case 'SCATTERED': accentColor = 'text-amber-400'; accentBg = 'bg-amber-400'; break;
      case 'LOW_ENERGY': accentColor = 'text-purple-400'; accentBg = 'bg-purple-400'; break;
      case 'FOCUSED': accentColor = 'text-emerald-400'; accentBg = 'bg-emerald-400'; break;
    }
  }

  const getCategoryStyles = (cat?: string) => {
    return CATEGORY_COLORS[cat || ''] || 'text-white/40 border-white/10 bg-white/5';
  };

  const filteredTasks = tasks.filter(t => {
    if (t.mode !== mode) return false;
    
    const taskStatus = t.status || 'pending';
    let effectiveStatus = taskStatus;
    if (taskStatus === 'pending' && t.startTime && isPast(new Date(t.startTime))) {
      effectiveStatus = 'overdue';
    }

    if (taskFilter === 'ALL') return true;
    if (taskFilter === 'PENDING') return effectiveStatus === 'pending' || effectiveStatus === 'overdue';
    if (taskFilter === 'ACTIVE') return effectiveStatus === 'active';
    if (taskFilter === 'COMPLETE') return effectiveStatus === 'complete';
    
    return true;
  });

  const relevantTasks = filteredTasks.slice(0, 15);

  const handleGoHome = async () => {
    // Reset Zustand store state to show mode selection
    resetMode();
    
    // Clear locally in user metadata if needed
    updateUser({ modeSelected: false });
    
    // Clear in Supabase if linked
    const { getSupabase } = await import('../lib/supabase');
    const client = getSupabase();
    if (client) {
      client.auth.updateUser({
        data: { modeSelected: false }
      });
    }
  };

  const handleSetZenithState = async (newState: 'FLOW' | 'SCATTERED' | 'LOW_ENERGY' | 'FOCUSED') => {
    setZenithState(newState);
    if (!isDemoMode && user?.id) {
      const { getSupabase } = await import('../lib/supabase');
      const client = getSupabase();
      if (client) {
        await client.from('zenith_sessions').insert({
          user_id: user.id,
          session_name: `State: ${newState}`,
          skill_category: 'Mental State',
          completed_at: new Date().toISOString(),
          duration_minutes: 0
        });
      }
    }
  };

  const [neuralIdStr, setNeuralIdStr] = useState<string>('AETHER_GUEST');
  const [totalXp, setTotalXp] = useState<number>(0);

  useEffect(() => {
    const fetchUserData = async () => {
      if (isDemoMode || !user?.id) return;
      try {
        const { getSupabase } = await import('../lib/supabase');
        const client = getSupabase();
        if (!client) return;
        
        // Fetch neural ID
        const { data: profile } = await client
          .from('profiles')
          .select('neural_id, username')
          .eq('id', user.id)
          .single();
          
        if (profile) {
          setNeuralIdStr(profile.neural_id || profile.username || 'AETHER_GUEST');
        }

        // Fetch XP
        const { data: xpData } = await client
          .from('user_xp')
          .select('xp_points')
          .eq('user_id', user.id);
          
        if (xpData) {
          const sum = xpData.reduce((acc, curr) => acc + (curr.xp_points || 0), 0);
          setTotalXp(sum);
        }
      } catch (err) {
        console.error("Error fetching user stats:", err);
      }
    };
    fetchUserData();
  }, [user, isDemoMode]);

  // Remove the old calculate neuralId logic since we fetch it now.
  
  const isVerified = user?.user_metadata?.is_verified === true || true; // Mock true for demo

  return (
    <div className="h-screen w-full flex flex-col pt-3 md:pt-4 px-4 md:px-6 relative overflow-hidden font-sans bg-obsidian transition-colors duration-1000">
      <AmbientVisualizer />
      <ModeTransitionOverlay />
      <ToastNotifications />
      
      {/* Task Creation FAB / Edit Modal */}
      <TaskInput 
        taskToEdit={taskToEdit} 
        isOpen={isTaskInputOpen || !!taskToEdit}
        onOpenChange={(val) => {
          setIsTaskInputOpen(val);
          if (!val) setTaskToEdit(null);
        }}
        onClose={() => {
          setTaskToEdit(null);
          setIsTaskInputOpen(false);
        }} 
      />

      <AiInsightsModal 
        isOpen={isInsightsModalOpen}
        onClose={() => setIsInsightsModalOpen(false)}
        mode={mode}
        tasks={tasks}
      />
      
      <UserSettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <GlobalNavbar 
        onAddClick={() => setIsTaskInputOpen(true)} 
        onHomeClick={handleGoHome} 
        onSettingsClick={() => setIsSettingsModalOpen(true)}
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

      {/* Confirmation Modal */}
      <ConfirmDeleteModal 
        isOpen={!!taskToDelete}
        onConfirm={() => {
          if (taskToDelete) deleteTask(taskToDelete);
          setTaskToDelete(null);
        }}
        onCancel={() => setTaskToDelete(null)}
      />

      {/* Subtle Scanlines and overlays */}
      <div className="scanlines opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

      {/* Top Navbar: Now Clean & Minimal */}
      <header className="flex items-center justify-between h-14 md:h-12 mb-3 md:mb-4 glass-panel z-20 transition-all duration-500 shrink-0 px-4 md:px-6">
        <div className="flex items-center gap-2 md:gap-4 truncate cursor-pointer hover:opacity-80 transition-opacity" onClick={handleGoHome}>
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-tr from-cyan-neon to-purple-neon rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,0.2)] shrink-0">
            <Zap className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div className="flex flex-col truncate">
            <span className="text-sm md:text-lg font-black md:font-bold tracking-tighter uppercase whitespace-nowrap leading-tight font-heading truncate">
              AETHER <span className="text-white/20 hidden md:inline">OS</span>
            </span>
            <span className="text-[7px] md:text-[9px] text-white/30 font-mono tracking-widest uppercase hidden sm:block">Link_v2.4_Stable</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-6 w-auto shrink-1 max-w-[60%] md:max-w-[70%] justify-end">
          {/* Mode Toggle in Header */}
          <button
            onClick={() => updateUser({ mode: mode === 'titan' ? 'zenith' : 'titan'})}
            className={`flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-lg border transition-all ${mode === 'titan' ? 'bg-purple-neon/20 border-purple-neon/50 text-purple-neon shadow-[0_0_10px_rgba(188,19,254,0.3)]' : 'bg-cyan-neon/20 border-cyan-neon/50 text-cyan-neon shadow-[0_0_10px_rgba(0,243,255,0.3)]'} shrink-0`}
            title={`Switch to ${mode === 'titan' ? 'Zenith' : 'Titan'} Mode`}
          >
            {mode === 'titan' ? <Dumbbell className="w-3.5 h-3.5 md:w-4 md:h-4" /> : <Laptop className="w-3.5 h-3.5 md:w-4 md:h-4" />}
          </button>

          <div className="flex items-center flex-1 justify-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm min-w-0">
             {(user?.user_metadata?.avatar_url || user?.avatar_url) ? (
               <img src={user?.user_metadata?.avatar_url || user?.avatar_url} alt="Avatar" className="w-4 h-4 md:w-5 md:h-5 rounded-full object-cover shrink-0 border border-white/20" />
             ) : (
               <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-cyan-neon/20 border border-cyan-neon/30 flex items-center justify-center shrink-0">
                 <User className="w-2 h-2 text-cyan-neon" />
               </div>
             )}
             <span className="text-[10px] md:text-xs font-mono text-[#deff9a] font-bold tracking-wider truncate">{neuralIdStr}</span>
             {isVerified && <ShieldCheck className="w-3 md:w-3.5 h-3 md:h-3.5 text-[#deff9a] shrink-0" />}
          </div>
          
          <div className="flex items-center justify-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 rounded-xl border border-[#deff9a]/30 bg-[#deff9a]/10 backdrop-blur-sm shrink-0">
             <Zap className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#deff9a]" />
             <span className="text-[10px] md:text-xs font-mono text-[#deff9a] font-bold tracking-wider">{totalXp.toLocaleString()} XP</span>
          </div>
          
          <div className="h-6 w-[1px] bg-white/10 hidden md:block shrink-0" />
          <div className="flex flex-col items-center shrink-0">
            <Bell size={18} className="text-white/40 hover:text-white transition-colors cursor-pointer w-4 h-4 md:w-5 md:h-5" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {currentView === 'dashboard' && (
        <motion.main 
          key={`dashboard-${mode}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 z-10 min-h-0 overflow-y-auto p-2 lg:p-0 custom-scrollbar pb-32"
        >
          
          {/* Left Column: Analytics */}
        <section className="col-span-1 lg:col-span-3 flex flex-col gap-4">
          <div className="flex-1 min-h-[250px] lg:min-h-0 glass-panel p-4 overflow-hidden flex flex-col">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-4 italic flex items-center justify-between">
               <span className="flex items-center gap-2"><div className={`w-1 h-1 rounded-full ${accentBg}`} /> Neural Progress Balance</span>
               <Button 
                variant="ghost" 
                size="sm" 
                className={`h-6 text-[9px] ${accentColor} border border-${accentColor}/20 hover:bg-${accentColor}/10 px-2 uppercase tracking-widest`}
                onClick={handleGenerateInsights}
               >
                 Run AI Opt
               </Button>
            </h3>
            <div className="flex-1 min-h-0">
              <NeuralAnalytics mode={mode} />
            </div>
          </div>
          
          <div className="h-40 glass-panel p-4 flex flex-col">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-4">Habit Frequency</h3>
            <div className="flex items-end justify-between h-20 gap-1">
              {[40, 65, 85, 30, 95, 70, 55].map((h, i) => (
                <div 
                  key={i} 
                  className={`w-full ${accentBg}/40 border-t ${accentColor}/60 rounded-t-sm transition-all duration-700`} 
                  style={{ height: `${h}%` }} 
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[8px] text-white/20 uppercase tracking-tighter font-mono">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </div>
        </section>

        {/* Center Column: Workspace */}
        <section className="col-span-1 lg:col-span-6 flex flex-col gap-4">
          <div className="flex-1 glass-panel-heavy p-4 lg:p-5 relative overflow-hidden flex flex-col min-h-[350px] lg:min-h-0">
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex flex-col md:flex-row justify-between items-start lg:items-center mb-3 lg:mb-4 gap-3">
                <div>
                  <h2 className="text-xl lg:text-2xl font-light tracking-tighter mb-1 font-heading">
                    {mode === 'titan' ? 'Hyper-Trophy' : 'Cognitive'}{' '}
                    <span className={`font-bold ${accentColor}`}>PHASE 2</span>
                  </h2>
                  <p className="text-white/40 text-[10px] md:text-xs">
                    {mode === 'titan' ? 'Current Protocol: Muscle Architecture Optimization' : 'Current Protocol: Deep Focus & AI Training'}
                  </p>
                </div>
                <div className={`px-4 py-2 ${accentBg}/10 rounded-xl border ${accentColor}/20 ${accentColor} text-[10px] font-bold tracking-widest uppercase hidden md:block`}>
                  Live Node Active
                </div>
              </div>

              {/* Zenith Tabs or Task Filters */}
              {mode === 'zenith' ? (
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2 mb-2 overflow-x-auto custom-scrollbar pb-1">
                    {(['WORKSPACE', 'PROTOCOL', 'ANALYTICS'] as const).map(tab => (
                      <Button
                        key={tab}
                        variant="ghost"
                        onClick={() => setZenithTab(tab)}
                        className={`h-8 px-4 text-[10px] font-mono tracking-widest uppercase rounded-lg border ${
                          zenithTab === tab 
                            ? `${accentBg}/20 border-${accentColor}/50 ${accentColor}` 
                            : 'border-white/10 text-white/40 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {tab}
                      </Button>
                    ))}
                  </div>
                  {zenithTab === 'WORKSPACE' && (
                    <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 mb-2">
                       {['FLOW', 'SCATTERED', 'LOW_ENERGY', 'FOCUSED'].map(state => (
                         <Button
                           key={state}
                           variant="ghost"
                           onClick={() => handleSetZenithState(state as any)}
                           className={`h-6 px-3 text-[9px] font-mono tracking-widest uppercase rounded border ${
                             zenithState === state 
                               ? `${accentBg}/20 border-${accentColor}/50 ${accentColor}` 
                               : 'border-white/10 text-white/40 hover:text-white hover:bg-white/5'
                           }`}
                         >
                           {state.replace('_', ' ')}
                         </Button>
                       ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex gap-2 mb-4 overflow-x-auto custom-scrollbar pb-1">
                  {['ALL', 'PENDING', 'ACTIVE', 'COMPLETE'].map(tab => (
                    <Button
                      key={tab}
                      variant="ghost"
                      onClick={() => setTaskFilter(tab as any)}
                      className={`h-8 px-4 text-[10px] font-mono tracking-widest uppercase rounded-lg border ${
                        taskFilter === tab 
                          ? `${accentBg}/20 border-${accentColor}/50 ${accentColor}` 
                          : 'border-white/10 text-white/40 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {tab}
                    </Button>
                  ))}
                </div>
              )}

              <div className="flex-1 min-h-0 relative">
                {mode === 'zenith' && zenithTab === 'PROTOCOL' && (
                   <div className="absolute inset-0 bg-obsidian z-20 rounded-2xl border border-white/5 overflow-hidden">
                      <FocusProtocol />
                   </div>
                )}
                {mode === 'zenith' && zenithTab === 'ANALYTICS' && (
                   <div className="absolute inset-0 bg-obsidian z-20 rounded-2xl grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <WeeklyAnalytics />
                      <SkillProgress />
                   </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                <div className="space-y-6 max-h-full overflow-y-auto pr-2 custom-scrollbar">
                  {relevantTasks.length > 0 ? relevantTasks.map((task, i) => {
                    const st = task.status || 'pending';
                    let effectiveStatus = st;
                    if (st === 'pending' && task.startTime && isPast(new Date(task.startTime))) {
                      effectiveStatus = 'overdue';
                    }

                    const isComplete = effectiveStatus === 'complete';
                    const isActive = effectiveStatus === 'active';
                    const isOverdue = effectiveStatus === 'overdue';
                    const isPending = effectiveStatus === 'pending';
                    
                    let borderColor = accentColor;
                    let badgeColor = 'text-amber-400 border-amber-400/30 bg-amber-400/10';
                    let badgeText = 'PENDING';
                    
                    if (isComplete) {
                      borderColor = 'border-green-500';
                      badgeColor = 'text-green-400 border-green-400/30 bg-green-400/10';
                      badgeText = 'COMPLETE';
                    } else if (isActive) {
                      borderColor = 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)]';
                      badgeColor = 'text-cyan-400 border-cyan-400/30 bg-cyan-400/10 animate-pulse';
                      badgeText = 'ACTIVE';
                    } else if (isOverdue) {
                      borderColor = 'border-red-500';
                      badgeColor = 'text-red-400 border-red-400/30 bg-red-400/10';
                      badgeText = 'OVERDUE';
                    } else {
                      borderColor = 'border-amber-400';
                    }

                    let timeDisplay = 'No temporal log';
                    if (task.startTime) {
                      const dateObj = new Date(task.startTime);
                      if (isComplete) {
                        timeDisplay = `Completed at ${format(dateObj, 'h:mm a')}`;
                      } else if (isActive) {
                        timeDisplay = `Running for ${formatDistanceToNow(dateObj)}`;
                      } else if (isOverdue) {
                        timeDisplay = `Started ${formatDistanceToNow(dateObj)} ago`;
                      } else {
                        timeDisplay = `Starts in ${formatDistanceToNow(dateObj)}`;
                      }
                    }

                    return (
                      <motion.div 
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`p-5 bg-white/[0.03] border-l-2 ${borderColor} rounded-r-2xl transition-all group flex flex-col gap-3 ${isComplete ? 'opacity-50' : 'hover:bg-white/[0.05]'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1.5 w-full">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <div className={`px-2 py-0.5 border rounded text-[8px] font-bold uppercase tracking-tighter w-fit ${getCategoryStyles(task.category)}`}>
                                {task.category || 'Legacy Node'}
                              </div>
                              <div className={`px-2 py-0.5 border rounded text-[8px] font-mono font-bold tracking-widest uppercase w-fit ${badgeColor}`}>
                                {badgeText}
                              </div>
                              {task.mode === 'zenith' && task.outputType && (
                                <div className={`px-2 py-0.5 border rounded text-[8px] font-mono font-bold tracking-widest uppercase w-fit text-cyan-400 border-cyan-400/30 bg-cyan-400/10`}>
                                  {task.outputType}
                                </div>
                              )}
                              {task.mode === 'zenith' && task.energyLevel && (
                                <div className={`px-2 py-0.5 border rounded text-[8px] font-mono font-bold tracking-widest uppercase w-fit text-white/60 border-white/20 bg-white/5 flex gap-0.5`}>
                                  {[...Array(5)].map((_, idx) => (
                                    <span key={idx} className={idx < (task.energyLevel || 0) ? 'text-cyan-400' : 'text-white/20'}>★</span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <p className={`text-lg md:text-xl font-bold break-words whitespace-normal leading-tight ${isComplete ? 'line-through text-white/50' : ''}`}>{task.title}</p>
                            <div className="flex items-center justify-between w-full">
                              <div className="flex items-center gap-2 text-[10px] text-white/40 font-mono">
                                <Clock size={10} className={isComplete ? 'text-white/40' : accentColor} />
                                {timeDisplay}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 hover:bg-white/10 text-white/40 hover:text-white"
                              onClick={() => setTaskToEdit(task)}
                            >
                              <Edit2 size={12} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 hover:bg-red-500/20 text-white/40 hover:text-red-500"
                              onClick={() => setTaskToDelete(task.id)}
                            >
                              <Trash2 size={12} />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                             <div className={`h-full ${isComplete ? 'bg-green-500' : isActive ? 'bg-cyan-400' : accentBg} opacity-60`} style={{ width: `${task.intensity}%` }} />
                          </div>
                          <span className={`text-[10px] font-mono ${isComplete ? 'text-white/40' : accentColor}`}>{task.intensity}%</span>
                        </div>

                        {/* Action Buttons */}
                        {!isComplete && (
                          <div className="pt-2 mt-1 border-t border-white/5 flex gap-2">
                            {isPending || isOverdue ? (
                              <Button
                                onClick={() => updateTaskStatus(task.id, 'active')}
                                className="flex-1 h-8 bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 border border-amber-400/20 text-[10px] font-mono tracking-widest"
                              >
                                ▶ START
                              </Button>
                            ) : null}
                            
                            {isActive || isOverdue ? (
                              <Button
                                onClick={() => updateTaskStatus(task.id, 'complete')}
                                className={`flex-1 h-8 bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20 border border-cyan-400/20 text-[10px] font-mono tracking-widest ${isActive ? 'animate-pulse' : ''}`}
                              >
                                ✓ COMPLETE
                              </Button>
                            ) : null}
                          </div>
                        )}
                      </motion.div>
                    );
                  }) : (
                    <div className="p-8 border border-white/5 border-dashed rounded-3xl flex flex-col items-center justify-center text-center opacity-40">
                       <Zap className="w-8 h-8 mb-3 text-white/20" />
                       <p className="text-[10px] uppercase font-bold tracking-widest">No active protocols</p>
                       <p className="text-[10px] lowercase italic">Initialize a new node via FAB</p>
                    </div>
                  )}
                </div>
                
                <div className="h-64 lg:h-full overflow-hidden mt-4 lg:mt-0">
                  {mode === 'titan' ? <BodyMap /> : <InhibitorWidget mode={mode} />}
                </div>
              </div>
              </div>
            </div>

            {/* Decorative Circuit SVG Pattern */}
            <svg className="absolute bottom-0 right-0 opacity-10 pointer-events-none hidden md:block" width="300" height="300" viewBox="0 0 100 100">
               <path d="M0,100 L20,80 L40,80 L60,60 L100,60" fill="none" stroke="white" strokeWidth="0.5" />
               <path d="M20,100 L40,80 L40,60 L60,40" fill="none" stroke="white" strokeWidth="0.5" />
               <circle cx="60" cy="40" r="1" fill="white" />
               <circle cx="100" cy="60" r="1" fill="white" />
            </svg>
          </div>
        </section>

        {/* Right Column: Calendar Stream */}
        <section className="col-span-1 lg:col-span-3 flex flex-col gap-4">
          <div className="flex-1 glass-panel p-4 flex flex-col min-h-[250px] lg:min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] font-heading">Calendar Stream</h3>
              <div className={`w-2 h-2 rounded-full ${accentBg} animate-pulse`} />
            </div>
            
            <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {tasks
                .filter(t => t.startTime && t.mode === mode)
                .sort((a, b) => a.startTime - b.startTime)
                .map((item, i) => {
                  const isActive = Math.abs(Date.now() - item.startTime) < 3600000; // Within 1 hour
                  return (
                    <div key={item.id} className="flex gap-4 group">
                      <div className="flex flex-col items-center py-1">
                        <span className={`text-[10px] font-mono ${isActive ? accentColor : 'text-white/30'}`}>
                          {format(new Date(item.startTime), 'HH:mm')}
                        </span>
                        <div className="w-[1px] h-full bg-white/10 mt-1" />
                      </div>
                      <div className={`flex-1 p-3 rounded-xl border relative ${isActive ? `${accentBg}/10 ${accentColor}/30 shadow-[0_0_15px_rgba(0,243,255,0.05)]` : 'bg-white/5 border-white/5'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-xs font-bold break-words whitespace-normal w-full pr-6">{item.title}</p>
                          <div className="absolute top-2 right-2 flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setTaskToEdit(item)} className="text-white/20 hover:text-white transition-colors">
                              <Edit2 size={10} />
                            </button>
                            <button onClick={() => setTaskToDelete(item.id)} className="text-white/20 hover:text-red-500 transition-colors">
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>
                        <div className={`text-[8px] font-bold uppercase tracking-widest ${getCategoryStyles(item.category)} border rounded px-1.5 py-0.5 w-fit`}>
                          {item.category}
                        </div>
                      </div>
                    </div>
                  );
                })}
              {tasks.filter(t => t.startTime && t.mode === mode).length === 0 && (
                <div className="text-center py-10 opacity-20">
                  <Calendar size={24} className="mx-auto mb-2" />
                  <p className="text-[10px] uppercase font-mono">No temporal logs</p>
                </div>
              )}
            </div>
          </div>

          <div className="block pb-24 md:pb-0">
            {mode === 'titan' ? (
              <InhibitorWidget mode={mode} />
            ) : (
              <div className="h-40 bg-purple-neon/5 border border-purple-neon/20 rounded-2xl p-5 flex flex-col justify-center items-center text-center">
                <Zap className="text-purple-neon mb-2 w-6 h-6" />
                <p className="text-[10px] text-purple-neon uppercase tracking-widest font-heading">Sync Engine</p>
                <p className="text-[10px] text-white/60 font-mono">Worker.js monitoring system events... all signals nominal.</p>
              </div>
            )}
          </div>
        </section>
        </motion.main>
        )}
        
        {currentView === 'leaderboard' && (
          <TitanLeaderboard key="leaderboard" />
        )}
        
        {currentView === 'store' && (
          <AetherStore key="store" />
        )}
        
        {currentView === 'help' && (
          <HelpView key="help" />
        )}
      </AnimatePresence>

      {/* Floating Query Button */}
      <button 
        onClick={() => setIsQueryModalOpen(true)}
        className="fixed bottom-24 right-6 md:right-8 w-12 h-12 rounded-full bg-purple-neon text-black flex items-center justify-center shadow-[0_0_20px_rgba(188,19,254,0.6)] hover:scale-110 transition-transform z-50 animate-pulse"
      >
        <span className="font-bold text-xl">?</span>
      </button>

      <QueryModal 
        isOpen={isQueryModalOpen}
        onClose={() => setIsQueryModalOpen(false)}
      />
    </div>
  );
}
