import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Laptop, Dumbbell, Zap, Save, Calendar, Clock, Tag } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAetherStore, AetherTask } from '../store/useAetherStore';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "./ui/dialog";
import { Slider } from "./ui/slider";
import { format } from "date-fns";
import { getSupabase } from '../lib/supabase';
import { TITAN_CATEGORIES, ZENITH_CATEGORIES } from '../lib/constants';

interface TaskInputProps {
  taskToEdit?: AetherTask | null;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
}

export const TaskInput: React.FC<TaskInputProps> = ({ taskToEdit, isOpen, onOpenChange, onClose }) => {
  const { mode, addTask, updateTask, isDemoMode, user } = useAetherStore();
  const [internalOpen, setInternalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [intensity, setIntensity] = useState([50]);
  const [category, setCategory] = useState('');
  const [startTime, setStartTime] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [reminderOffset, setReminderOffset] = useState<number>(0);

  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setIntensity([taskToEdit.intensity || 50]);
      setCategory(taskToEdit.category);
      setStartTime(format(new Date(taskToEdit.startTime), "yyyy-MM-dd'T'HH:mm"));
      setReminderOffset(taskToEdit.reminderOffset || 0);
      setOpen(true);
    }
  }, [taskToEdit, setOpen]);


  const categories = mode === 'titan' ? TITAN_CATEGORIES : ZENITH_CATEGORIES;

  useEffect(() => {
    if (!category && categories.length > 0) {
      setCategory(categories[0]);
    }
  }, [mode, categories, category]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    
    // Using Zustand Task Object format
    const taskDataLoc: Omit<AetherTask, 'id' | 'createdAt'> = {
      type: mode === 'titan' ? 'workout' : 'work',
      mode: mode,
      title,
      category,
      startTime: new Date(startTime).getTime(),
      intensity: intensity[0],
      reminderOffset: reminderOffset > 0 ? reminderOffset : undefined,
      reminderSent: false,
    };

    if (isDemoMode) {
      if (taskToEdit) {
        updateTask(taskToEdit.id, taskDataLoc);
      } else {
        addTask(taskDataLoc);
      }
      showToast("TASK_INITIALIZED");
      resetForm();
      return;
    }

    const client = getSupabase();
    if (!client || !user?.id) {
       console.error("Supabase client or user not found");
       return;
    }

    const taskDataDB = {
      user_id: user.id,
      title,
      category,
      mode: mode,
      start_time: new Date(startTime).toISOString(),
      tags: reminderOffset > 0 ? ['reminder'] : [],
      priority: intensity[0] > 70 ? 3 : intensity[0] > 40 ? 2 : 1
    };

    if (taskToEdit) {
      // In a real app we'd need to match local IDs with DB UUIDs if updating
      // For now, assume id maps correctly or we handle it via real-time sync
      // await client.from('tasks').update(taskDataDB).eq('id', taskToEdit.id);
      // Fallback local update to keep UI fast
      updateTask(taskToEdit.id, taskDataLoc);
    } else {
      const { error } = await client.from('tasks').insert(taskDataDB);
      if (error) {
         console.error("Task insert error:", error);
         alert(`SYSTEM_ERROR: ${error.message}`);
         return;
      }
    }

    showToast("TASK_INITIALIZED");
    resetForm();
  };

  const showToast = (message: string) => {
    // Basic implementation since there's no pre-defined toast fn in the request context
    // You could replace this if there's a specific toast utility provided
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-mono text-xs px-4 py-3 rounded-lg z-50 animate-in slide-in-from-bottom-5';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-5');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  const resetForm = () => {
    setTitle('');
    setIntensity([50]);
    setCategory(categories[0]);
    setStartTime(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    setReminderOffset(0);
    setOpen(false);
    if (onClose) onClose();
  };

  const accentColor = mode === 'titan' ? 'text-purple-neon' : 'text-cyan-neon';
  const accentBg = mode === 'titan' ? 'bg-purple-neon' : 'bg-cyan-neon';
  const accentShadow = mode === 'titan' ? 'shadow-[0_0_30px_rgba(188,19,254,0.4)]' : 'shadow-[0_0_30px_rgba(0,243,255,0.4)]';

  return (
    <>
      <Dialog open={open} onOpenChange={(val) => {
        setOpen(val);
        if (!val && onClose) onClose();
      }}>
        <DialogContent className="bg-obsidian/95 backdrop-blur-2xl border-white/10 text-white w-[92vw] max-w-[92vw] sm:max-w-lg p-0 h-auto max-h-[85vh] overflow-y-auto rounded-3xl custom-scrollbar top-[50%] translate-y-[-50%]">
          <div className="relative p-4 md:p-8">
             <div className={`absolute top-0 right-0 p-8 ${accentColor} opacity-5 hidden md:block`}>
               {mode === 'titan' ? <Dumbbell className="w-48 h-48 -mr-12 -mt-12" /> : <Laptop className="w-48 h-48 -mr-12 -mt-12" />}
             </div>

             <DialogHeader className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                   <div className={`p-2 rounded-lg ${accentBg}/20 ${accentColor}`}>
                      {mode === 'titan' ? <Dumbbell size={18} /> : <Laptop size={18} />}
                   </div>
                   <span className={`text-[10px] font-mono font-bold tracking-[0.3em] uppercase ${accentColor}`}>
                      {mode === 'titan' ? 'Physical Protocol' : 'Cognitive Stream'}
                   </span>
                </div>
                <DialogTitle className="text-2xl md:text-4xl font-black uppercase tracking-tighter mb-1">
                   {taskToEdit ? 'Adjust Node' : (mode === 'titan' ? 'Log Training' : 'Initialize Task')}
                </DialogTitle>
                <DialogDescription className="text-white/40 text-xs font-mono lowercase italic">
                   Updating local synchronization grid... Node: {taskToEdit ? 'Modification' : 'Active'}.
                </DialogDescription>
             </DialogHeader>

             <div className="space-y-6 mt-10 relative z-10">
                <div className="space-y-2">
                   <label className="text-[10px] uppercase font-bold text-white/40 ml-1 tracking-widest flex items-center gap-2">
                     <Zap size={10} /> Protocol Identifier
                   </label>
                   <Input 
                      placeholder={mode === 'titan' ? "e.g. Squat Intensity" : "e.g. Neural Architecture Setup"} 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="bg-white/5 border-white/10 focus:border-cyan-neon/30 h-14 rounded-2xl text-lg font-bold placeholder:font-normal placeholder:text-white/10"
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] uppercase font-bold text-white/40 ml-1 tracking-widest flex items-center gap-2">
                       <Calendar size={10} /> Temporal Lock
                     </label>
                     <Input 
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="bg-white/5 border-white/10 focus:border-cyan-neon/30 h-12 rounded-xl text-xs font-mono appearance-none"
                        style={{ colorScheme: 'dark' }}
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] uppercase font-bold text-white/40 ml-1 tracking-widest flex items-center gap-2">
                       <Tag size={10} /> Category Logic
                     </label>
                     <select 
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 focus:border-cyan-neon/30 h-12 rounded-xl text-xs font-mono px-4 outline-none appearance-none"
                     >
                       {categories.map(cat => (
                         <option key={cat} value={cat} className="bg-obsidian text-white">{cat}</option>
                       ))}
                     </select>
                  </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] uppercase font-bold text-white/40 ml-1 tracking-widest flex items-center gap-2">
                     <Clock size={10} /> Alert Directive
                   </label>
                   <select 
                      value={reminderOffset}
                      onChange={(e) => setReminderOffset(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 focus:border-cyan-neon/30 h-10 rounded-xl text-xs font-mono px-4 outline-none appearance-none"
                   >
                     <option value={0} className="bg-obsidian text-white">No Reminder</option>
                     <option value={5} className="bg-obsidian text-white">5 mins before</option>
                     <option value={15} className="bg-obsidian text-white">15 mins before</option>
                     <option value={30} className="bg-obsidian text-white">30 mins before</option>
                     <option value={60} className="bg-obsidian text-white">1 hour before</option>
                   </select>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-end">
                      <label className="text-[10px] uppercase font-bold text-white/40 ml-1 tracking-widest">Intensity Scalar</label>
                      <span className={`text-xl font-black font-mono ${accentColor}`}>{intensity}%</span>
                   </div>
                   <Slider 
                      value={intensity} 
                      onValueChange={(val) => setIntensity(val as number[])} 
                      max={100} 
                      step={1} 
                      className={`py-2`}
                   />
                   <div className="flex justify-between text-[8px] text-white/20 font-mono font-bold uppercase">
                      <span>Low_Yield</span>
                      <span>Critical_Mass</span>
                   </div>
                </div>

                <div className="flex gap-4 pt-4">
                   <Button 
                      onClick={resetForm}
                      variant="ghost" 
                      className="flex-1 h-12 rounded-xl text-white/40 hover:text-white"
                   >
                      Abort
                   </Button>
                   <Button 
                      onClick={handleSubmit}
                      className={`flex-[2] h-14 rounded-2xl text-xs font-black uppercase tracking-widest ${accentBg} text-black hover:brightness-110 shadow-lg`}
                   >
                      <Save className="w-4 h-4 mr-2" /> {taskToEdit ? 'Commit Changes' : 'Commit Node'}
                   </Button>
                </div>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
