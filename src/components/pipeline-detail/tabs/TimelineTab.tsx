import { 
  FileText, 
  CheckSquare, 
  Phone, 
  Mail, 
  Calendar, 
  RefreshCw,
  MessageSquare,
  Loader2
} from 'lucide-react';
import { GlassPanel, GlassPanelHeader, GlassSubcard } from '@/components/ui/glass-panel';
import { PipelineTimelineEvent } from '@/types/pipelineExtended';
import { format, parseISO } from 'date-fns';

interface TimelineTabProps {
  events: PipelineTimelineEvent[];
  isLoading: boolean;
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

export function TimelineTab({ events, isLoading }: TimelineTabProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <GlassPanel>
        <GlassPanelHeader title="Timeline" />
        <div className="p-4">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">
              No activity yet
            </p>
          </div>
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel>
      <GlassPanelHeader title={`Timeline (${events.length})`} />
      <div className="p-4">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
          
          <div className="space-y-4">
            {events.map((event, index) => {
              const Icon = getEventIcon(event.type, event.icon);
              const timestamp = parseISO(event.timestamp);
              
              return (
                <div key={event.id} className="relative flex gap-4 pl-1">
                  {/* Icon bubble */}
                  <div className="relative z-10 w-7 h-7 rounded-full bg-background border-2 border-border flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  
                  {/* Content */}
                  <GlassSubcard className="flex-1 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">{event.title}</p>
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(timestamp, 'MMM d, h:mm a')}
                      </span>
                    </div>
                  </GlassSubcard>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
