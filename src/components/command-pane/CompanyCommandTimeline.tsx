import { MessageSquare, Phone, Users, Mail, Bell, CheckCircle, Circle } from 'lucide-react';
import { TimelineEvent, InteractionType } from '@/types/portfolio';
import { formatDistanceToNow } from 'date-fns';

interface CompanyCommandTimelineProps {
  events: TimelineEvent[];
}

const iconMap: Record<InteractionType | 'task', typeof MessageSquare> = {
  note: MessageSquare,
  call: Phone,
  meeting: Users,
  email: Mail,
  update: Bell,
  task: CheckCircle,
};

export function CompanyCommandTimeline({ events }: CompanyCommandTimelineProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <div className="bg-card/50 border border-border/30 rounded-xl p-3 backdrop-blur-sm space-y-2">
      <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Timeline</h4>
      
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border/60" />
        
        <div className="space-y-2.5">
          {events.map((event) => {
            const Icon = iconMap[event.icon] || Circle;
            const isTask = event.type === 'task_created' || event.type === 'task_completed';
            
            return (
              <div key={event.id} className="flex gap-3 relative">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                  isTask ? 'bg-primary/10 ring-2 ring-background' : 'bg-muted ring-2 ring-background'
                }`}>
                  <Icon className={`w-2.5 h-2.5 ${isTask ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                
                <div className="flex-1 min-w-0 pb-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium text-foreground truncate">{event.title}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
