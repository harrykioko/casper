import { 
  FileText, 
  CheckSquare, 
  Phone, 
  Mail, 
  Calendar, 
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { GlassPanel, GlassPanelHeader } from '@/components/ui/glass-panel';
import { PipelineTimelineEvent } from '@/types/pipelineExtended';
import { format, isToday, isYesterday, isThisWeek, parseISO } from 'date-fns';

interface ActivityFeedProps {
  events: PipelineTimelineEvent[];
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
  const thisWeek: PipelineTimelineEvent[] = [];
  const older: PipelineTimelineEvent[] = [];

  events.forEach(event => {
    const date = parseISO(event.timestamp);
    if (isToday(date)) {
      today.push(event);
    } else if (isYesterday(date)) {
      yesterday.push(event);
    } else if (isThisWeek(date)) {
      thisWeek.push(event);
    } else {
      older.push(event);
    }
  });

  if (today.length > 0) groups.push({ label: 'Today', events: today });
  if (yesterday.length > 0) groups.push({ label: 'Yesterday', events: yesterday });
  if (thisWeek.length > 0) groups.push({ label: 'This Week', events: thisWeek });
  if (older.length > 0) groups.push({ label: 'Earlier', events: older });

  return groups;
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  // Take most recent 15 events
  const recentEvents = events.slice(0, 15);
  const groupedEvents = groupEventsByDate(recentEvents);

  if (events.length === 0) {
    return (
      <GlassPanel>
        <GlassPanelHeader title="Activity" />
        <div className="p-4">
          <p className="text-sm text-muted-foreground text-center py-4">
            No activity yet
          </p>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel>
      <GlassPanelHeader title="Activity" />
      
      <div className="p-4 max-h-[400px] overflow-y-auto">
        <div className="space-y-4">
          {groupedEvents.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                {group.label}
              </p>
              
              <div className="space-y-2">
                {group.events.map((event) => {
                  const Icon = getEventIcon(event.type, event.icon);
                  const time = format(parseISO(event.timestamp), 'h:mm a');
                  
                  return (
                    <div 
                      key={event.id}
                      className="flex items-start gap-2.5 py-1.5"
                    >
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground line-clamp-1">
                          {event.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {time}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassPanel>
  );
}
