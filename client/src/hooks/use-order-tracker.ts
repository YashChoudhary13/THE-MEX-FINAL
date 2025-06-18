import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export interface OrderDetails {
  id: number;
  status: OrderStatus;
  customerName: string;
  customerPhone: string;
  items: {
    id: number;
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  createdAt: string;
  estimatedReadyTime?: string;
}

export function useOrderTracker(orderId: number) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  // Fetch initial order details
  const { 
    data: order, 
    isLoading,
    error,
    refetch 
  } = useQuery<OrderDetails>({
    queryKey: [`/api/orders/${orderId}`],
  });
  
  // Connect to WebSocket for real-time updates
  useEffect(() => {
    // Only connect if we have an order ID
    if (!orderId) return;
    
    const host = window.location.host;
    const isSecure = window.location.protocol === 'https:';
    const protocol = isSecure ? 'wss' : 'ws';
    
    // Only connect if we have a valid host - no fallbacks
    if (!host || host.includes('undefined')) {
      console.warn('Invalid host, skipping order tracker WebSocket connection:', host);
      return;
    }
    
    const wsUrl = `${protocol}://${host}/ws`;
    console.log('Connecting to WebSocket:', wsUrl);
    
    // Create WebSocket connection
    const newSocket = new WebSocket(wsUrl);
    
    newSocket.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected for order tracking');
      
      // Subscribe to updates for this specific order
      const subscriptionMessage = {
        type: 'SUBSCRIBE_TO_ORDER',
        orderId: orderId
      };
      console.log('Sending subscription message:', subscriptionMessage);
      newSocket.send(JSON.stringify(subscriptionMessage));
    };
    
    newSocket.onmessage = (event) => {
      try {
        console.log('WebSocket message received:', event.data);
        const data = JSON.parse(event.data);
        console.log('Parsed WebSocket data:', data);
        
        // Only process updates for our specific order
        if (data.type === 'ORDER_UPDATE' && data.orderId === orderId) {
          console.log('Received order update for order:', orderId);
          // Automatically refetch the order data to get the latest
          refetch();
          
          // Show a toast notification about the status change
          if (data.order && data.order.status) {
            toast({
              title: 'Order Status Updated',
              description: `Your order is now ${data.order.status}`,
            });
          }
        } else if (data.type === 'SUBSCRIPTION_CONFIRMED' && data.orderId === orderId) {
          console.log('Successfully subscribed to order updates for order:', orderId);
        } else {
          console.log('Received message with unhandled type or different order ID');
        }
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };
    
    newSocket.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
    };
    
    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
    
    setSocket(newSocket);
    
    // Clean up the WebSocket connection when the component unmounts
    return () => {
      if (newSocket.readyState === WebSocket.OPEN) {
        newSocket.close();
      }
    };
  }, [orderId, refetch, toast]);
  
  // Function to manually request a refresh of the order data
  const refreshOrder = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    order,
    isLoading,
    error,
    isConnected,
    refreshOrder
  };
}