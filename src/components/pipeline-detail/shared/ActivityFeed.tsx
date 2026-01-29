import { 
  FileText, 
  CheckSquare, 
  Phone, 
  Mail, 
  Calendar, 
  RefreshCw,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { GlassPanel, GlassPanelHeader } from '@/components/ui/glass-panel';
import { PipelineTimelineEvent } from '@/types/pipelineExtended';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

interface ActivityFeedProps {
  events: PipelineTimelineEvent[];
  onViewFullTimeline?: () => void;
  maxItems?: number;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  note: FileText,
  call: Phone,
  meeting: Calendar,
  email: Mail,
  update: RefreshCw,
  task: CheckSquare,
  task_created: CheckSquare,
  task_completed: CheckSquare,
};

function getEventIcon(type: string, icon?: string) {
  if (icon && iconMap[icon]) {
    return iconMap[icon];
  }
  if (iconMap[type]) {
    return iconMap[type];
  }
  return MessageSquare;
}

function groupEventsByDate(events: PipelineTimelineEvent[]) {
  const groups: { label: string; events: PipelineTimelineEvent[] }[] = [];
  const today: PipelineTimelineEvent[] = [];
  const yesterday: PipelineTimelineEvent[] = [];
  const earlier: PipelineTimelineEvent[] = [];

  events.forEach(event => {
    const date = parseISO(event.timestamp);
    if (isToday(date)) {
      today.push(event);
    } else if (isYesterday(date)) {
      yesterday.push(event);
    } else {
      earlier.push(event);
    }
  });

  if (today.length > 0) groups.push({ label: 'Today', events: today });
  if (yesterday.length > 0) groups.push({ label: 'Yesterday', events: yesterday });
  if (earlier.length > 0) groups.push({ label: 'Earlier', events: earlier });

  return groups;
}

export function ActivityFeed({ events, onViewFullTimeline, maxItems = 5 }: ActivityFeedProps) {
  const recentEvents = events.slice(0, maxItems);
  const groupedEvents = groupEventsByDate(recentEvents);
  const hasMore = events.length > maxItems;

  if (events.length === 0) {
    return null;
  }

  return (
    <GlassPanel variant="subtle" padding="md">
      <GlassPanelHeader title="Activity" />
      
      <div className="space-y-3">
        {groupedEvents.map((group) => (
          <div key={group.label}>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              {group.label}
            </p>
            
            <div className="space-y-1.5">
              {group.events.map((event) => {
                const Icon = getEventIcon(event.type, event.icon);
                const time = format(parseISO(event.timestamp), 'h:mm a');
                
                return (
                  <div 
                    key={event.id}
                    className="flex items-start gap-2 py-1"
                  >
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-3 h-3 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-1">
                        {event.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* View full timeline link */}
        {hasMore && onViewFullTimeline && (
          <button
            onClick={onViewFullTimeline}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors pt-1"
          >
            View full timeline
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </GlassPanel>
  );
}
