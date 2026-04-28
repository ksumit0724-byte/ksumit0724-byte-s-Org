import { useEffect } from 'react';
import { useAetherStore } from '../store/useAetherStore';

export function useTaskReminders() {
  const { tasks, updateTask, addNotification } = useAetherStore();

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      
      tasks.forEach(task => {
        if (task.reminderOffset && task.reminderOffset > 0 && !task.reminderSent) {
          const reminderTime = task.startTime - task.reminderOffset * 60000;
          
          if (now >= reminderTime) {
            // Trigger Reminder
            addNotification({
              title: 'Upcoming Node',
              message: `"${task.title}" is scheduled in ${task.reminderOffset} minutes.`,
              type: 'reminder'
            });

            // Native Browser Notification if permitted
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Aether OS Reminder', {
                body: `"${task.title}" starts in ${task.reminderOffset} minutes.`,
                icon: '/icon.png' // optional fallback
              });
            }

            // Mark as sent
            updateTask(task.id, { reminderSent: true });
          }
        }
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [tasks, updateTask, addNotification]);
}
