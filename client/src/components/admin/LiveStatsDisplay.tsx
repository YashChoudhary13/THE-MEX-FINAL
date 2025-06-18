import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, ShoppingCart, Clock, Wifi, WifiOff } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface CurrentStats {
  totalOrders: number;
  totalRevenue: number;
  completedRevenue: number;
  completedOrders: number;
}

export default function LiveStatsDisplay() {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isConnected, setIsConnected] = useState(false);

  // Fetch current day stats
  const { data: currentStats, refetch } = useQuery<CurrentStats>({
    queryKey: ['/api/admin/current-stats'],
  });

  // Format time for Dublin timezone
  const formatDublinTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-IE', {
      timeZone: 'Europe/Dublin',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log('WebSocket connected for admin updates');
      setIsConnected(true);
      socket.send(JSON.stringify({ type: 'SUBSCRIBE_ADMIN' }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        const updateTypes = ['NEW_ORDER', 'ORDER_UPDATE', 'daily_reset'];

        if (updateTypes.includes(data.type)) {
          refetch();
          setLastUpdated(new Date());
          queryClient.invalidateQueries({ queryKey: ['/api/admin/orders'] });
          queryClient.invalidateQueries({ queryKey: ['/api/admin/current-stats'] });
          queryClient.invalidateQueries({ queryKey: ['/api/admin/daily-reports'] });
          queryClient.invalidateQueries({ queryKey: ['/api/admin/monthly-reports'] });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    return () => {
      socket.close();
    };
  }, [refetch]);


  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {currentStats?.totalOrders ?? 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Live count for today
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {currentStats ? formatCurrency(currentStats.completedRevenue || 0) : '€0.00'}
          </div>
          <p className="text-xs text-muted-foreground">
            Completed orders only
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Order</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {currentStats && currentStats.totalOrders > 0 
              ? formatCurrency(currentStats.totalRevenue / currentStats.totalOrders)
              : '€0.00'
            }
          </div>
          <p className="text-xs text-muted-foreground">
            Per order today
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">
            {formatDublinTime(lastUpdated)}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Dublin Time
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}