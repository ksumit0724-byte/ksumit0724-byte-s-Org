import { motion, AnimatePresence } from "motion/react";
import { useAetherStore, AetherTask } from "../store/useAetherStore";
import { 
  Zap, 
  Dumbbell, 
  Laptop, 
  Calendar, 
  BarChart3, 
  Settings,
  Bell,
  Clock,
  Edit2,
  Trash2,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import NeuralAnalytics from "./NeuralAnalytics";
import { useNotificationSync } from "../services/notificationService";
import { InhibitorWidget } from "./InhibitorWidget";
import BodyMap from "./BodyMap";
import { useState } from "react";
import { format } from "date-fns";

import { AmbientVisualizer } from "./AmbientVisualizer";
import { UserMenu } from "./UserMenu";
import { TaskInput } from "./TaskInput";
import { ConfirmDeleteModal } from "./ConfirmDeleteModal";
import { GlobalNavbar } from "./GlobalNavbar";

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
  const { mode, setMode, tasks, deleteTask, updateUser } = useAetherStore();
  const [taskToEdit, setTaskToEdit] = useState<AetherTask | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isTaskInputOpen, setIsTaskInputOpen] = useState(false);
  const [activeNode, setActiveNode] = useState('07_WEEK');
  
  useNotificationSync();

  const accentColor = mode === 'titan' ? 'text-purple-neon' : 'text-cyan-neon';
  const accentBg = mode === 'titan' ? 'bg-purple-neon' : 'bg-cyan-neon';

  const relevantTasks = tasks.filter(t => t.type === (mode === 'titan' ? 'workout' : 'work')).slice(0, 5);

  const getCategoryStyles = (cat?: string) => {
    return CATEGORY_COLORS[cat || ''] || 'text-white/40 border-white/10 bg-white/5';
  };

  const handleGoHome = () => {
    updateUser({ modeSelected: false });
  };

  return (
    <div className="h-screen w-full flex flex-col p-4 md:p-6 pb-24 md:pb-32 relative overflow-hidden font-sans bg-obsidian transition-colors duration-1000">
      <AmbientVisualizer />
      
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

      <GlobalNavbar onAddClick={() => setIsTaskInputOpen(true)} onHomeClick={handleGoHome} />

      {/* Workspace Node Scroller - Now positioned just above bottom navigation */}
      <div className="fixed bottom-24 md:bottom-28 left-0 right-0 z-20 px-4 pointer-events-none">
        <div className="max-w-4xl mx-auto flex items-center gap-3 overflow-x-auto custom-scrollbar pb-3 px-2 scroll-smooth pointer-events-auto no-scrollbar">
          {['01_TODAY', '07_WEEK', '30_MONTH', '365_YEAR', 'NEURAL_GRID', 'RECOVERY_NODE', 'API_STREAM'].map((node) => (
            <button
              key={node}
              onClick={() => setActiveNode(node)}
              className={`px-4 py-2 rounded-xl text-[9px] font-mono whitespace-nowrap transition-all border shrink-0 ${activeNode === node ? `${accentBg} text-black border-transparent shadow-[0_0_15px_rgba(0,243,255,0.3)]` : 'bg-obsidian/80 backdrop-blur-md border-white/5 text-white/30 hover:text-white/60 hover:bg-white/10'}`}
            >
              {node}
            </button>
          ))}
        </div>
      </div>

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
      <header className="flex items-center justify-between h-16 mb-4 md:mb-6 px-4 md:px-8 glass-panel z-20 transition-all duration-500 shrink-0">
        <div className="flex items-center gap-3 md:gap-4 truncate">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-tr from-cyan-neon to-purple-neon rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,0.2)] shrink-0">
            <Zap className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs md:text-lg font-black md:font-bold tracking-tighter uppercase whitespace-nowrap leading-tight font-heading">
              AETHER <span className="text-white/20">OS</span>
            </span>
            <span className="text-[7px] md:text-[9px] text-white/30 font-mono tracking-widest uppercase hidden sm:block">Link_v2.4_Stable</span>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <div className="flex flex-col items-end">
            <div className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-[0.2em] border border-white/10 text-white/20 uppercase`}>
              Global_System
            </div>
          </div>
          <div className="h-6 w-[1px] bg-white/10" />
          <div className="flex flex-col items-center">
            <Bell size={14} className="text-white/40 hover:text-white transition-colors cursor-pointer" />
          </div>
        </div>
      </header>

      {/* Main Workspace Workspace with Smooth Slide Transition */}
      <AnimatePresence mode="wait">
        <motion.main 
          key={mode}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 z-10 min-h-0 overflow-y-auto md:overflow-hidden p-2 md:p-0 custom-scrollbar pb-32"
        >
          
          {/* Left Column: Analytics */}
        <section className="col-span-1 md:col-span-3 flex flex-col gap-6">
          <div className="flex-1 min-h-[350px] glass-panel p-5 overflow-hidden flex flex-col">
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] mb-4 italic flex items-center gap-2">
               <div className={`w-1 h-1 rounded-full ${accentBg}`} /> Neural Progress Balance
            </h3>
            <div className="flex-1 min-h-0">
              <NeuralAnalytics mode={mode} />
            </div>
          </div>
          
          <div className="h-48 glass-panel p-5 hidden md:block">
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
        <section className="col-span-1 md:col-span-6 flex flex-col gap-6">
          <div className="flex-1 glass-panel-heavy p-6 md:p-8 relative overflow-hidden flex flex-col min-h-[500px]">
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex flex-col md:flex-row justify-between items-start mb-8 md:mb-12 gap-4">
                <div>
                  <h2 className="text-3xl md:text-4xl font-light tracking-tighter mb-1 font-heading">
                    {mode === 'titan' ? 'Hyper-Trophy' : 'Cognitive'}{' '}
                    <span className={`font-bold ${accentColor}`}>PHASE 2</span>
                  </h2>
                  <p className="text-white/40 text-xs md:text-sm">
                    {mode === 'titan' ? 'Current Protocol: Muscle Architecture Optimization' : 'Current Protocol: Deep Focus & AI Training'}
                  </p>
                </div>
                <div className={`px-4 py-2 ${accentBg}/10 rounded-xl border ${accentColor}/20 ${accentColor} text-[10px] font-bold tracking-widest uppercase hidden md:block`}>
                  Live Node Active
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
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
                          <p className="text-lg md:text-xl font-bold truncate max-w-[200px] md:max-w-xs">{task.title}</p>
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
                
                <div className="hidden lg:block h-full overflow-hidden">
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
        <section className="col-span-1 md:col-span-3 flex flex-col gap-6">
          <div className="flex-1 glass-panel p-5 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] font-heading">Calendar Stream</h3>
              <div className={`w-2 h-2 rounded-full ${accentBg} animate-pulse`} />
            </div>
            
            <div className="space-y-4 flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {tasks
                .filter(t => t.startTime)
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
                          <p className="text-xs font-bold truncate pr-6">{item.title}</p>
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
              {tasks.filter(t => t.startTime).length === 0 && (
                <div className="text-center py-10 opacity-20">
                  <Calendar size={24} className="mx-auto mb-2" />
                  <p className="text-[10px] uppercase font-mono">No temporal logs</p>
                </div>
              )}
            </div>
          </div>

          <div className="hidden md:block">
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
    </AnimatePresence>
    </div>
  );
}
