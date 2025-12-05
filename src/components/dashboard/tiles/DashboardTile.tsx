import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardTileProps {
  title: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  colSpan?: 3 | 4 | 6 | 12;
  className?: string;
  emptyState?: ReactNode;
  isEmpty?: boolean;
}

const colSpanClasses = {
  3: 'col-span-12 sm:col-span-6 lg:col-span-3',
  4: 'col-span-12 md:col-span-6 lg:col-span-4',
  6: 'col-span-12 lg:col-span-6',
  12: 'col-span-12',
};

export function DashboardTile({
  title,
  icon: Icon,
  action,
  children,
  colSpan = 4,
  className,
  emptyState,
  isEmpty,
}: DashboardTileProps) {
  return (
    <div
      className={cn(
        colSpanClasses[colSpan],
        'bg-card/60 backdrop-blur-sm rounded-2xl border border-border/40 shadow-sm hover:shadow-md transition-shadow duration-200',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <h3 className="font-semibold text-foreground">{title}</h3>
        </div>
        {action}
      </div>

      {/* Content */}
      <div className="px-5 pb-5">
        {isEmpty && emptyState ? emptyState : children}
      </div>
    </div>
  );
}
