import { Inbox, Mail, Bell, MoreHorizontal, CheckSquare, Archive } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { mockInboxData, InboxItem } from '@/data/mockInboxData';
import { DashboardTile } from './DashboardTile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getTypeIcon(type: InboxItem['type']) {
  switch (type) {
    case 'email':
      return Mail;
    case 'notification':
      return Bell;
    default:
      return Mail;
  }
}

export function InboxTile() {
  const handleConvertToTask = (item: InboxItem) => {
    toast.success(`Created task from "${item.subject}"`);
  };

  const handleArchive = (item: InboxItem) => {
    toast.success(`Archived "${item.subject}"`);
  };

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      <Inbox className="w-8 h-8 mb-2" />
      <span className="text-sm font-medium">Inbox clear</span>
      <span className="text-xs">No new messages</span>
    </div>
  );

  const unreadCount = mockInboxData.filter(item => !item.isRead).length;

  return (
    <DashboardTile 
      title="Inbox" 
      icon={Inbox} 
      colSpan={4}
      isEmpty={mockInboxData.length === 0}
      emptyState={emptyState}
      action={
        unreadCount > 0 ? (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
            {unreadCount} new
          </span>
        ) : null
      }
    >
      <ScrollArea className="h-[220px]">
        <div className="space-y-1 pr-2">
          {mockInboxData.map((item) => {
            const TypeIcon = getTypeIcon(item.type);
            
            return (
              <div
                key={item.id}
                className={`group flex items-start gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors duration-150 cursor-pointer ${
                  !item.isRead ? 'bg-muted/30' : ''
                }`}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xs font-medium text-primary">
                  {item.type === 'notification' ? (
                    <Bell className="w-4 h-4" />
                  ) : (
                    getInitials(item.from)
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm truncate ${!item.isRead ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>
                      {item.from}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {formatDistanceToNow(new Date(item.timestamp), { addSuffix: false })}
                    </span>
                    {!item.isRead && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    )}
                  </div>
                  <p className={`text-xs truncate ${!item.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {item.subject}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{item.preview}</p>
                </div>

                {/* Quick Actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => handleConvertToTask(item)}>
                      <CheckSquare className="h-4 w-4 mr-2" />
                      Turn into task
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleArchive(item)}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </DashboardTile>
  );
}
