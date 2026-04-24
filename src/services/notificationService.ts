import { useAetherStore } from "../store/useAetherStore";
import { useEffect } from "react";

export function useNotificationSync() {
  const { user } = useAetherStore();

  useEffect(() => {
    if (!user) return;

    const requestPermission = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const registration = await navigator.serviceWorker.ready;
          const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
          
          if (!vapidKey) {
            console.warn("Notification sync disabled: VITE_VAPID_PUBLIC_KEY missing.");
            return;
          }

          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: vapidKey
          });

          // Send to our backend
          await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
          }).catch(err => console.error("Failed to sync sub with backend:", err));
        }
      } catch (err) {
        console.error("Notification permission error:", err);
      }
    };

    if ('serviceWorker' in navigator && 'PushManager' in window) {
      requestPermission();
    }
  }, [user]);
}

export const calendarService = {
  async fetchEvents(accessToken: string) {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.json();
  },

  async createEvent(accessToken: string, eventData: any) {
    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });
    return response.json();
  }
};
