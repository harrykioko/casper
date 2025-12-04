import { Phone, Mail, Users, FileText, Bell, CheckCircle2, PlusCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TimelineEvent, InteractionType } from '@/types/portfolio';
import { format, formatDistanceToNow } from 'date-fns';

interface CompanyTimelineProps {
  events: TimelineEvent[];
  loading?: boolean;
}

const interactionIcons: Record<InteractionType, React.ReactNode> = {
  note: <FileText className="h-3.5 w-3.5" />,
  call: <Phone className="h-3.5 w-3.5" />,
  meeting: <Users className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
  update: <Bell className="h-3.5 w-3.5" />,
};

function getIcon(event: TimelineEvent) {
  if (event.type === 'task_completed') {
    return <CheckCircle2 className="h-3.5 w-3.5" />;
  }
  if (event.type === 'task_created') {
    return <PlusCircle className="h-3.5 w-3.5" />;
  }
  return interactionIcons[event.icon as InteractionType] || <FileText className="h-3.5 w-3.5" />;
}

function getIconColor(event: TimelineEvent): string {
  if (event.type === 'task_completed') {
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
  }
  if (event.type === 'task_created') {
    return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
  }
  return 'bg-primary/10 text-primary';
}

export function CompanyTimeline({ events, loading }: CompanyTimelineProps) {
  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground py-4 text-center">
            Loading timeline...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground py-4 text-center">
            No activity yet. Add tasks or interactions to see the timeline.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[13px] top-2 bottom-2 w-px bg-border" />

          {/* Events */}
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="relative flex gap-3">
                {/* Icon */}
                <div
                  className={`relative z-10 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${getIconColor(
                    event
                  )}`}
                >
                  {getIcon(event)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium">{event.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(event.timestamp), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
