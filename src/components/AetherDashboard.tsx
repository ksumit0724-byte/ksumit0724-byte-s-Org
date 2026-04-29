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
import { format } from "date-fns";
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
  const { mode, tasks, addTask, updateTask, deleteTask, updateUser, user, isDemoMode, resetMode } = useAetherStore();
  const [taskToEdit, setTaskToEdit] = useState<AetherTask | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isTaskInputOpen, setIsTaskInputOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [activeNode, setActiveNode] = useState('07_WEEK');
  const [currentView, setCurrentView] = useState<'dashboard' | 'leaderboard' | 'store'>('dashboard');
  
  const [isInsightsModalOpen, setIsInsightsModalOpen] = useState(false);

  useEffect(() => {
    if (isDemoMode) return;
    const client = getSupabase();
    if (!client || !user?.id) return;

    const channel = client
      .channel('tasks-realtime')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          // Add to array
          const newTask = payload.new;
          addTask({
            title: newTask.title,
            category: newTask.category,
            mode: newTask.mode as any,
            type: newTask.mode === 'titan' ? 'workout' : 'work',
            startTime: new Date(newTask.start_time).getTime(),
            intensity: newTask.priority === 3 ? 80 : newTask.priority === 2 ? 50 : 20,
            reminderOffset: newTask.tags?.includes('reminder') ? 15 : undefined,
            reminderSent: false
          });
        } else if (payload.eventType === 'UPDATE') {
          // Find local task. Real sync would require matching DB id, but we map fields here
          // This is a simplified example as requested by prompt
          const updTask = payload.new;
          // In a real scenario we'd track original DB ID in the Zustand state map. 
          // For now, no update sync if ID doesn't match
        } else if (payload.eventType === 'DELETE') {
          // Delete
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

  const accentColor = mode === 'titan' ? 'text-purple-neon' : 'text-cyan-neon';
  const accentBg = mode === 'titan' ? 'bg-purple-neon' : 'bg-cyan-neon';

  const relevantTasks = tasks.filter(t => t.mode === mode).slice(0, 5);

  const getCategoryStyles = (cat?: string) => {
    return CATEGORY_COLORS[cat || ''] || 'text-white/40 border-white/10 bg-white/5';
  };

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

  // Generate Neural ID based on user data
  const neuralId = useMemo(() => {
    const rawName = user?.user_metadata?.username || user?.username || user?.email?.split('@')[0] || 'PILOT';
    const cleanName = rawName.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const gymName = user?.user_metadata?.gym_name ? user.user_metadata.gym_name.toUpperCase().replace(/[^A-Z0-9]/g, '') : 'OXYGEN';
    // Use a consistent random-looking number based on name length or just a fixed string for demo
    const hash = (cleanName.length * 17) % 999;
    const digits = hash.toString().padStart(3, '0');
    return `@${gymName}_${cleanName}${digits}`;
  }, [user]);
  
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
             <span className="text-[10px] md:text-xs font-mono text-[#deff9a] font-bold tracking-wider truncate">{neuralId}</span>
             {isVerified && <ShieldCheck className="w-3 md:w-3.5 h-3 md:h-3.5 text-[#deff9a] shrink-0" />}
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
              <div className="flex flex-col md:flex-row justify-between items-start mb-4 lg:mb-5 gap-3">
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                <div className="space-y-6 max-h-full overflow-y-auto pr-2 custom-scrollbar">
                  {relevantTasks.length > 0 ? relevantTasks.map((task, i) => (
                    <motion.div 
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`p-5 bg-white/[0.03] border-l-2 ${accentColor} rounded-r-2xl hover:bg-white/[0.05] transition-all group flex flex-col gap-3`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className={`px-2 py-0.5 border rounded text-[8px] font-bold uppercase tracking-tighter w-fit ${getCategoryStyles(task.category)}`}>
                            {task.category || 'Legacy Node'}
                          </div>
                          <p className="text-lg md:text-xl font-bold break-words whitespace-normal leading-tight">{task.title}</p>
                          <div className="flex items-center gap-2 text-[10px] text-white/30 font-mono">
                            <Clock size={10} className={accentColor} />
                            {task.startTime ? format(new Date(task.startTime), 'HH:mm | MMM dd') : 'No temporal log'}
                          </div>
                        </div>
                        
                        <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
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

                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                           <div className={`h-full ${accentBg} opacity-60`} style={{ width: `${task.intensity}%` }} />
                        </div>
                        <span className={`text-[10px] font-mono ${accentColor}`}>{task.intensity}%</span>
                      </div>
                    </motion.div>
                  )) : (
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
      </AnimatePresence>
    </div>
  );
}
