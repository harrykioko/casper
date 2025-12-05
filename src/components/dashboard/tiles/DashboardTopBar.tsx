import { Command, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { usePriorityItems } from '@/hooks/usePriorityItems';

interface DashboardTopBarProps {
  onCommandClick: () => void;
}

export function DashboardTopBar({ onCommandClick }: DashboardTopBarProps) {
  const { user } = useAuth();
  const { priorityItems } = usePriorityItems();
  
  // Extract first name from email or full name
  const getFirstName = () => {
    if (!user?.email) return 'there';
    const emailName = user.email.split('@')[0];
    // Capitalize first letter
    return emailName.charAt(0).toUpperCase() + emailName.slice(1).split(/[._-]/)[0];
  };

  const overdueCount = priorityItems.filter(item => item.type === 'overdue').length;
  const dueTodayCount = priorityItems.filter(item => item.type === 'due_today').length;

  return (
    <div className="flex items-center justify-between mb-8">
      {/* Left side - Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Hello, {getFirstName()}
        </h1>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-muted-foreground">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </span>
          
          {/* Activity Summary Pills */}
          <div className="flex items-center gap-2">
            {overdueCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-medium">
                {overdueCount} overdue
              </span>
            )}
            {dueTodayCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                {dueTodayCount} due today
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onCommandClick}
          className="gap-2 bg-card/60 border-border/40 hover:bg-card/80"
        >
          <Command className="h-4 w-4" />
          <span className="hidden sm:inline">Command</span>
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </Button>
      </div>
    </div>
  );
}
