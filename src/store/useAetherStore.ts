import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppMode = 'titan' | 'zenith';

export interface AetherTask {
  id: string;
  type: 'work' | 'workout';
  title: string;
  category: string;
  startTime: number; // Timestamp
  intensity?: number; // 0-100
  createdAt: number;
}

interface AetherState {
  mode: AppMode;
  user: any | null;
  session: any | null;
  tasks: AetherTask[];
  notifications: any[];
  targetedMuscles: string[];
  isDemoMode: boolean;
  setMode: (mode: AppMode) => void;
  setUser: (user: any) => void;
  setSession: (session: any) => void;
  setDemoMode: (isDemo: boolean) => void;
  addTask: (task: Omit<AetherTask, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<AetherTask>) => void;
  deleteTask: (id: string) => void;
  addNotification: (notif: any) => void;
  toggleMuscle: (muscle: string) => void;
  updateUser: (updates: any) => void;
}

export const useAetherStore = create<AetherState>()(
  persist(
    (set) => ({
      mode: 'zenith',
      user: null,
      session: null,
      tasks: [],
      notifications: [],
      targetedMuscles: [],
      isDemoMode: false,
      setMode: (mode) => set({ mode }),
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setDemoMode: (isDemoMode) => set({ isDemoMode }),
      addTask: (task) => set((state) => ({
        tasks: [{ ...task, id: Math.random().toString(36).substr(2, 9), createdAt: Date.now() }, ...state.tasks]
      })),
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
      })),
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id)
      })),
      updateUser: (updates) => set((state) => {
        const newUser = state.user ? { ...state.user, ...updates } : updates;
        
        let newSession = state.session;
        if (state.session) {
          const sessionUser = state.session.user || {};
          newSession = {
            ...state.session,
            user: {
              ...sessionUser,
              user_metadata: {
                ...(sessionUser.user_metadata || {}),
                ...updates
              }
            }
          };
        }

        return { user: newUser, session: newSession };
      }),
      addNotification: (notif) => set((state) => ({ 
        notifications: [notif, ...state.notifications].slice(0, 5) 
      })),
      toggleMuscle: (muscle) => set((state) => ({
        targetedMuscles: state.targetedMuscles.includes(muscle)
          ? state.targetedMuscles.filter(m => m !== muscle)
          : [...state.targetedMuscles, muscle]
      })),
    }),
    {
      name: 'aether-os-storage',
      partialize: (state) => ({ 
        mode: state.mode, 
        targetedMuscles: state.targetedMuscles,
        notifications: state.notifications,
        tasks: state.tasks,
        isDemoMode: state.isDemoMode,
        user: state.user,
        session: state.session
      }),
    }
  )
);
