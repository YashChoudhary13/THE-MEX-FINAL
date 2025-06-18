import { createContext, ReactNode, useContext, useState, useEffect } from 'react';

type NotificationStatus = 'unsupported' | 'default' | 'granted' | 'denied' | 'unavailable';

type NotificationContextType = {
  isNotificationsEnabled: boolean;
  notificationStatus: NotificationStatus;
  isBrowserSupported: boolean;
  checkPermission: () => Promise<NotificationPermission>;
  requestPermission: () => Promise<boolean>;
  sendNotification: (title: string, options?: NotificationOptions) => void;
  serviceWorkerRegistration: ServiceWorkerRegistration | null;
};

export const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<NotificationStatus>('default');
  const [isBrowserSupported, setIsBrowserSupported] = useState(false);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);
  
  // Initialize notification state and service worker on mount
  useEffect(() => {
    // Check if the browser supports notifications
    const isSupported = "Notification" in window && "serviceWorker" in navigator;
    setIsBrowserSupported(isSupported);
    
    if (!isSupported) {
      setNotificationStatus('unsupported');
      return;
    }
    
    // Register service worker
    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service worker registered:', registration);
        setServiceWorkerRegistration(registration);
        
        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        console.log('Service worker is ready');
      } catch (error) {
        console.error('Service worker registration failed:', error);
      }
    };
    
    registerServiceWorker();
    
    // Check current permission status
    const permission = Notification.permission;
    setNotificationStatus(permission as NotificationStatus);
    
    // Update enabled status if permission is granted
    if (permission === 'granted') {
      setIsNotificationsEnabled(true);
    } else if (permission === 'denied') {
      // If denied, set to unavailable because we can't request again
      setNotificationStatus('unavailable');
    }
  }, []);
  
  const checkPermission = async (): Promise<NotificationPermission> => {
    if (!isBrowserSupported) {
      return 'denied';
    }
    
    const permission = Notification.permission;
    setNotificationStatus(permission as NotificationStatus);
    
    if (permission === 'granted') {
      setIsNotificationsEnabled(true);
    } else if (permission === 'denied') {
      setNotificationStatus('unavailable');
    }
    
    return permission;
  };
  
  const requestPermission = async (): Promise<boolean> => {
    if (!isBrowserSupported) {
      console.log("Browser doesn't support notifications");
      return false;
    }
    
    // If already denied, we can't request again in most browsers
    if (Notification.permission === 'denied') {
      setNotificationStatus('unavailable');
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission as NotificationStatus);
      
      const granted = permission === 'granted';
      setIsNotificationsEnabled(granted);
      
      // If denied after request, set to unavailable for future attempts
      if (permission === 'denied') {
        setNotificationStatus('unavailable');
      }
      
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };
  
  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (!isNotificationsEnabled || !isBrowserSupported) return;
    
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
        notificationStatus,
        isBrowserSupported,
        checkPermission,
        requestPermission,
        sendNotification,
        serviceWorkerRegistration,
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