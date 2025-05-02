import { createContext, ReactNode, useContext, useState, useEffect } from 'react';

type NotificationContextType = {
  isNotificationsEnabled: boolean;
  checkPermission: () => Promise<NotificationPermission>;
  requestPermission: () => Promise<boolean>;
  sendNotification: (title: string, options?: NotificationOptions) => void;
};

export const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  
  useEffect(() => {
    // Check if the browser supports notifications
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications.");
      return;
    }
    
    // Check if permission is already granted
    if (Notification.permission === 'granted') {
      setIsNotificationsEnabled(true);
    }
  }, []);
  
  const checkPermission = async (): Promise<NotificationPermission> => {
    if (!("Notification" in window)) {
      return 'denied';
    }
    return Notification.permission;
  };
  
  const requestPermission = async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setIsNotificationsEnabled(granted);
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };
  
  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (!isNotificationsEnabled) return;
    
    try {
      new Notification(title, options);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };
  
  return (
    <NotificationContext.Provider
      value={{
        isNotificationsEnabled,
        checkPermission,
        requestPermission,
        sendNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}