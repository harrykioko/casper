import { MessageSquare, Mail, Calendar } from 'lucide-react';
import { GlassPanel, GlassPanelHeader } from '@/components/ui/glass-panel';
import { PipelineCompanyDetail } from '@/types/pipelineExtended';
import { useCompanyLinkedCommunications } from '@/hooks/useCompanyLinkedCommunications';
import { GlassSubcard } from '@/components/ui/glass-panel';

interface CommsTabProps {
  company: PipelineCompanyDetail;
}

export function CommsTab({ company }: CommsTabProps) {
  const { linkedCommunications, loading } = useCompanyLinkedCommunications(company.primary_domain, company.id);

  const events = linkedCommunications.filter(c => c.type === 'event');
  const emails = linkedCommunications.filter(c => c.type === 'email');
  const hasContent = linkedCommunications.length > 0;

  if (!company.primary_domain) {
    return (
      <GlassPanel>
        <GlassPanelHeader title="Communications" />
        <div className="p-4">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground mb-1">
              No domain configured
            </p>
            <p className="text-xs text-muted-foreground">
              Add a website to the company to see linked emails and meetings.
            </p>
          </div>
        </div>
      </GlassPanel>
    );
  }

  if (loading) {
    return (
      <GlassPanel>
        <GlassPanelHeader title="Communications" />
        <div className="p-4">
          <p className="text-sm text-muted-foreground text-center py-8">
            Loading communications...
          </p>
        </div>
      </GlassPanel>
    );
  }

  if (!hasContent) {
    return (
      <GlassPanel>
        <GlassPanelHeader title="Communications" />
        <div className="p-4">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground mb-1">
              No communications found
            </p>
            <p className="text-xs text-muted-foreground">
              Emails and calendar events with {company.primary_domain} will appear here.
            </p>
          </div>
        </div>
      </GlassPanel>
    );
  }

  return (
    <div className="space-y-6">
      {events.length > 0 && (
        <GlassPanel>
          <GlassPanelHeader title={`Meetings (${events.length})`} />
          <div className="p-4 space-y-2">
            {events.map((event) => (
              <GlassSubcard key={event.id} className="flex items-start gap-3 p-3">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-clamp-1">{event.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{event.subtitle}</p>
                </div>
              </GlassSubcard>
            ))}
          </div>
        </GlassPanel>
      )}

      {emails.length > 0 && (
        <GlassPanel>
          <GlassPanelHeader title={`Emails (${emails.length})`} />
          <div className="p-4 space-y-2">
            {emails.map((email) => (
              <GlassSubcard key={email.id} className="flex items-start gap-3 p-3">
                <Mail className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-clamp-1">{email.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{email.subtitle}</p>
                </div>
              </GlassSubcard>
            ))}
          </div>
        </GlassPanel>
      )}
    </div>
  );
}
