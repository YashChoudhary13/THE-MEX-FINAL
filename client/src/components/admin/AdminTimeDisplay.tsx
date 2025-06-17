import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

export default function AdminTimeDisplay() {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-IE', {
      timeZone: 'Europe/Dublin',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  };

  const formatTimeForMobile = (date: Date) => {
    return new Intl.DateTimeFormat('en-IE', {
      timeZone: 'Europe/Dublin',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  };

  const formatDateForMobile = (date: Date) => {
    return new Intl.DateTimeFormat('en-IE', {
      timeZone: 'Europe/Dublin',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
      <Badge variant="outline" className="flex items-center gap-2 text-sm font-medium min-w-0">
        <Clock className="h-4 w-4 flex-shrink-0" />
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 min-w-0">
          <span className="font-mono text-sm truncate">{formatTimeForMobile(currentTime)}</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">•</span>
          <span className="text-xs text-muted-foreground truncate">{formatDateForMobile(currentTime)}</span>
        </div>
      </Badge>
      <Badge variant="secondary" className="text-xs px-2 py-1">
        Cork/Dublin
      </Badge>
    </div>
  );
}