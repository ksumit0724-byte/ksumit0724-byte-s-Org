import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppMode = 'titan' | 'zenith';
export type AppTheme = 'dark' | 'light';

export interface AetherTask {
  id: string;
  type: 'work' | 'workout';
  mode: AppMode;
  title: string;
  category: string;
  startTime: number; // Timestamp
  intensity?: number; // 0-100
  reminderOffset?: number; // minutes before start time
  reminderSent?: boolean;
  status?: 'pending' | 'active' | 'complete' | 'overdue';
  createdAt: number;
  energyLevel?: number;
  outputType?: 'Creative' | 'Analytical' | 'Communication' | 'Learning' | string;
}

export interface AetherNotification {
  id: string;
  title: string;
  message: string;
  type: 'reminder' | 'system';
  timestamp: number;
}

interface AetherState {
  mode: AppMode;
  theme: AppTheme;
  user: any | null;
  session: any | null;
  tasks: AetherTask[];
  notifications: AetherNotification[];
  targetedMuscles: string[];
  isDemoMode: boolean;
  activeMode: AppMode | null;
  currentScreen: 'mode-selection' | 'dashboard';
  setMode: (mode: AppMode) => void;
  resetMode: () => void;
  setTheme: (theme: AppTheme) => void;
  setUser: (user: any) => void;
  setSession: (session: any) => void;
  setDemoMode: (isDemo: boolean) => void;
  addTask: (task: Omit<AetherTask, 'id' | 'createdAt'> & { id?: string, status?: 'pending' | 'active' | 'complete' | 'overdue', createdAt?: number }) => void;
  updateTask: (id: string, updates: Partial<AetherTask>) => void;
  deleteTask: (id: string) => void;
  setTasks: (tasks: AetherTask[]) => void;
  addNotification: (notif: Omit<AetherNotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  toggleMuscle: (muscle: string) => void;
  updateUser: (updates: any) => void;
}

export const useAetherStore = create<AetherState>()(
  persist(
    (set) => ({
      mode: 'zenith',
      theme: 'dark',
      user: null,
      session: null,
      tasks: [],
      notifications: [],
      targetedMuscles: [],
      isDemoMode: false,
      activeMode: null,
      currentScreen: 'mode-selection',
      setMode: (mode) => set({ mode, activeMode: mode, currentScreen: 'dashboard' }),
      resetMode: () => set({ currentScreen: 'mode-selection' }),
      setTheme: (theme) => set({ theme }),
      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setDemoMode: (isDemoMode) => set({ isDemoMode }),
      addTask: (task) => set((state) => ({
        tasks: [{ ...task, id: task.id || Math.random().toString(36).substr(2, 9), createdAt: task.createdAt || Date.now(), status: task.status || 'pending' }, ...state.tasks]
      })),
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
      })),
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter(t => t.id !== id)
      })),
      setTasks: (tasks) => set({ tasks }),
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
        notifications: [{ ...notif, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() }, ...state.notifications].slice(0, 5) 
      })),
      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
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
        theme: state.theme,
        targetedMuscles: state.targetedMuscles,
        notifications: state.notifications,
        tasks: state.tasks,
        isDemoMode: state.isDemoMode,
        user: state.user,
        session: state.session,
        activeMode: state.activeMode,
        currentScreen: state.currentScreen
      }),
    }
  )
);
