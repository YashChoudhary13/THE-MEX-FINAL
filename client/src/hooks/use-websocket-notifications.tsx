import { useEffect, useRef } from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { useToast } from '@/hooks/use-toast';

interface OrderUpdateMessage {
  type: 'ORDER_UPDATE';
  orderId: number;
  order: {
    id: number;
    customerName: string;
    status: string;
    total: number;
  };
}

interface UseWebSocketNotificationsProps {
  orderId?: number;
  enabled?: boolean;
}

export function useWebSocketNotifications({ orderId, enabled = true }: UseWebSocketNotificationsProps = {}) {
  const { isNotificationsEnabled } = useNotifications();
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const connect = () => {
      try {
        // Get WebSocket URL from current page URL
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.host;
        
        // Ensure we have a valid host
        if (!host || host === 'undefined') {
          console.error('Invalid host for WebSocket connection:', host);
          return;
        }
        
        const wsUrl = `${protocol}//${host}/ws`;
        console.log('Connecting to WebSocket:', wsUrl);
        
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('Customer WebSocket connected for notifications');
          // Subscribe to order updates if we have an order ID
          if (orderId) {
            ws.send(JSON.stringify({ 
              type: 'SUBSCRIBE_ORDER_UPDATES', 
              orderId 
            }));
            console.log(`Subscribed to order ${orderId} notifications`);
          }
        };

        ws.onmessage = (event) => {
          try {
            const data: OrderUpdateMessage = JSON.parse(event.data);
            
            if (data.type === 'ORDER_UPDATE') {
              const { order } = data;
              
              // Only show notifications for orders we're tracking or if no specific order is set
              if (!orderId || order.id === orderId) {
                const statusMessages = {
                  confirmed: 'Your order has been confirmed and is being prepared!',
                  preparing: 'Your order is now being prepared by our kitchen.',
                  ready: 'Your order is ready for pickup!',
                  completed: 'Thank you! Your order has been completed.',
                  cancelled: 'Your order has been cancelled.'
                };

                const message = statusMessages[order.status as keyof typeof statusMessages] || 
                               `Your order status has been updated to: ${order.status}`;

                // Send browser notification if enabled
                if (isNotificationsEnabled && Notification.permission === 'granted') {
                  try {
                    new Notification(`Order #${order.id} Update`, {
                      body: message,
                      icon: '/favicon.ico',
                      tag: `order-${order.id}`,
                      requireInteraction: true
                    });
                  } catch (error) {
                    console.error('Error sending notification:', error);
                  }
                }

                // Also show toast notification
                toast({
                  title: `Order #${order.id} Update`,
                  description: message,
                  duration: 5000,
                });
              }
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          console.log('Customer WebSocket disconnected');
          wsRef.current = null;
          
          // Reconnect after 3 seconds if still enabled
          if (enabled) {
            reconnectTimeoutRef.current = setTimeout(connect, 3000);
          }
        };

        ws.onerror = (error) => {
          console.error('Customer WebSocket error:', error);
        };

      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        
        // Retry connection after 5 seconds
        if (enabled) {
          reconnectTimeoutRef.current = setTimeout(connect, 5000);
        }
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [orderId, enabled, isNotificationsEnabled, toast]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN
  };
}