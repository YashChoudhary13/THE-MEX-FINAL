import { useEffect, useState } from 'react';
import { Order } from '@shared/schema';

// Define order status types
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

// Define types for WebSocket messages
type OrderUpdateMessage = {
  type: 'ORDER_UPDATE';
  orderId: number;
  order: Order;
};

type SubscriptionConfirmedMessage = {
  type: 'SUBSCRIPTION_CONFIRMED';
  orderId: number;
};

type WebSocketMessage = OrderUpdateMessage | SubscriptionConfirmedMessage;

/**
 * Custom hook for tracking real-time order status
 * @param orderId The ID of the order to track
 */
export function useOrderTracker(orderId: number | null) {
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    let socket: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;

    // Function to establish WebSocket connection
    const connect = () => {
      try {
        // Clear any existing error
        setError(null);
        
        // Create WebSocket connection
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        socket = new WebSocket(wsUrl);

        // Set up event handlers
        socket.onopen = () => {
          console.log('WebSocket connected!');
          setIsConnected(true);
          
          // Subscribe to order updates
          if (socket) {
            socket.send(JSON.stringify({
              type: 'SUBSCRIBE_TO_ORDER',
              orderId
            }));
          }
        };

        socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data) as WebSocketMessage;
            
            switch (message.type) {
              case 'SUBSCRIPTION_CONFIRMED':
                console.log(`Subscription confirmed for order ${message.orderId}`);
                break;
                
              case 'ORDER_UPDATE':
                console.log(`Received update for order ${message.orderId}`, message.order);
                
                if (message.orderId === orderId) {
                  setOrder(message.order);
                  setStatus(message.order.status as OrderStatus);
                }
                break;
            }
          } catch (err) {
            console.error('Error processing WebSocket message:', err);
          }
        };

        socket.onclose = (event) => {
          console.log(`WebSocket disconnected: ${event.reason}`);
          setIsConnected(false);
          
          // Attempt to reconnect after a delay, unless we closed it intentionally
          if (!event.wasClean) {
            setError('Connection lost. Attempting to reconnect...');
            reconnectTimer = setTimeout(connect, 3000);
          }
        };

        socket.onerror = (event) => {
          console.error('WebSocket error:', event);
          setError('Connection error occurred');
        };

      } catch (err) {
        console.error('Error setting up WebSocket:', err);
        setError('Failed to establish connection');
        
        // Attempt to reconnect after a delay
        reconnectTimer = setTimeout(connect, 3000);
      }
    };

    // Initial connection
    connect();

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.close();
      }
      
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [orderId]);

  return {
    order,
    status,
    isConnected,
    error
  };
}