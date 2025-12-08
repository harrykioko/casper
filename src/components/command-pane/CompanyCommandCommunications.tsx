import { Calendar, Mail, MessageSquare } from 'lucide-react';
import { LinkedCommunication } from '@/hooks/useCompanyLinkedCommunications';
import { Skeleton } from '@/components/ui/skeleton';

interface CompanyCommandCommunicationsProps {
  linkedCommunications: LinkedCommunication[];
  loading?: boolean;
  onEventClick?: (eventId: string) => void;
  onEmailClick?: (emailId: string) => void;
}

export function CompanyCommandCommunications({
  linkedCommunications,
  loading,
  onEventClick,
  onEmailClick,
}: CompanyCommandCommunicationsProps) {
  if (loading) {
    return (
      <div className="px-6 py-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Recent communications
        </h3>
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Recent communications
      </h3>

      {linkedCommunications.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic">
          No recent emails or meetings linked to this company.
        </p>
      ) : (
        <div className="space-y-1">
          {linkedCommunications.map((comm) => (
            <button
              key={comm.id}
              onClick={() => {
                if (comm.type === 'event' && onEventClick && comm.eventData) {
                  onEventClick(comm.eventData.id);
                } else if (comm.type === 'email' && onEmailClick && comm.emailData) {
                  onEmailClick(comm.emailData.id);
                }
              }}
              className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors text-left group"
            >
              <div className="mt-0.5">
                {comm.type === 'event' ? (
                  <Calendar className="h-4 w-4 text-blue-500" />
                ) : (
                  <Mail className="h-4 w-4 text-amber-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {comm.title}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {comm.subtitle}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
