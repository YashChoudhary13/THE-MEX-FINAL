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
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    // Create WebSocket connection
    const newSocket = new WebSocket(wsUrl);
    
    newSocket.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
      
      // Subscribe to updates for this specific order
      newSocket.send(JSON.stringify({
        type: 'SUBSCRIBE_TO_ORDER',
        orderId: orderId
      }));
    };
    
    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Only process updates for our specific order
        if (data.type === 'order_update' && data.orderId === orderId) {
          // Automatically refetch the order data to get the latest
          refetch();
          
          // Show a toast notification about the status change
          toast({
            title: 'Order Status Updated',
            description: `Your order is now ${data.status}`,
          });
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