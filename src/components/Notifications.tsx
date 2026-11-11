import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Notifications() {
  const [unreadCount] = useState(0);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative text-primary-foreground hover:bg-primary-foreground/20 rounded-xl"
      title="Notificações"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {unreadCount}
        </span>
      )}
    </Button>
  );
}
