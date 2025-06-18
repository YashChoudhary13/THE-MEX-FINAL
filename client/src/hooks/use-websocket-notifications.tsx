import { useEffect, useRef } from 'react';

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
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const connect = () => {
      try {
        const host = window.location.host;
        const isSecure = window.location.protocol === 'https:';
        const protocol = isSecure ? 'wss' : 'ws';
        
        // Only connect if we have a valid host - no fallbacks
        if (!host || host.includes('undefined')) {
          console.warn('Invalid host, skipping WebSocket connection:', host);
          return;
        }
        
        const wsUrl = `${protocol}://${host}/ws`;
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

                // Show toast notification for order updates

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
          console.error('Customer WebSocket connection failed:', error);
          console.error('Failed WebSocket URL was:', wsUrl);
        };

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        
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
  }, [orderId, enabled, toast]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN
  };
}