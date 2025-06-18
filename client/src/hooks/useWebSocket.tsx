import { useEffect, useRef } from 'react';
import { queryClient } from '@/lib/queryClient';

interface UseWebSocketOptions {
  onMessage?: (data: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const socketRef = useRef<WebSocket | null>(null);
  const { onMessage, onConnect, onDisconnect } = options;

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    
    // Ensure we have a valid host
    if (!host || host === 'undefined') {
      console.error('Invalid host for WebSocket connection:', host);
      return;
    }
    
    const wsUrl = `${protocol}//${host}/ws`;
    console.log('Admin WebSocket connecting to:', wsUrl);
    
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('Admin WebSocket connected');
      // Subscribe to admin updates
      socket.send(JSON.stringify({ type: 'SUBSCRIBE_ADMIN' }));
      console.log('Subscribed to admin updates');
      onConnect?.();
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        // Handle different message types
        switch (data.type) {
          case 'NEW_ORDER':
            // Invalidate orders query to refresh the list
            queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
            queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
            break;
          case 'ORDER_UPDATE':
            // Invalidate orders query to refresh the list
            queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
            queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
            break;
          case 'daily_reset':
            // Invalidate all admin queries on daily reset
            queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
            queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
            queryClient.invalidateQueries({ queryKey: ['/api/admin/daily-reports'] });
            break;
        }
        
        onMessage?.(data);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      onDisconnect?.();
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      socket.close();
    };
  }, [onMessage, onConnect, onDisconnect]);

  return socketRef.current;
}