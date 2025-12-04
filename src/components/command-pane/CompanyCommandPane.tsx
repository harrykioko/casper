import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet';
import { CompanyCommandHeader } from './CompanyCommandHeader';
import { CompanyCommandSummary } from './CompanyCommandSummary';
import { CompanyCommandContacts } from './CompanyCommandContacts';
import { CompanyCommandTasks } from './CompanyCommandTasks';
import { CompanyCommandNotes } from './CompanyCommandNotes';
import { CompanyCommandTimeline } from './CompanyCommandTimeline';
import { CompanyCommandQuickActions } from './CompanyCommandQuickActions';
import { useCompany } from '@/hooks/useCompany';
import { useCompanyContacts } from '@/hooks/useCompanyContacts';
import { useCompanyInteractions } from '@/hooks/useCompanyInteractions';
import { useCompanyTasks } from '@/hooks/useCompanyTasks';
import { useCompanyTimeline } from '@/hooks/useCompanyTimeline';
import { Skeleton } from '@/components/ui/skeleton';
import { differenceInDays, parseISO } from 'date-fns';

interface CompanyCommandPaneProps {
  open: boolean;
  onClose: () => void;
  entityType: 'portfolio' | 'pipeline';
  entityId: string | null;
}

function getHealthBorderColor(lastInteractionAt: string | null | undefined): string {
  if (!lastInteractionAt) return 'border-t-red-500';
  const days = differenceInDays(new Date(), parseISO(lastInteractionAt));
  if (days <= 7) return 'border-t-emerald-500';
  if (days <= 14) return 'border-t-amber-500';
  return 'border-t-red-500';
}

export function CompanyCommandPane({ open, onClose, entityType, entityId }: CompanyCommandPaneProps) {
  const { company, loading: companyLoading } = useCompany(entityType === 'portfolio' ? entityId ?? undefined : undefined);
  const { contacts, founders } = useCompanyContacts(entityType === 'portfolio' ? entityId ?? undefined : undefined);
  const { interactions, createInteraction, recentInteractions } = useCompanyInteractions(entityType === 'portfolio' ? entityId ?? undefined : undefined);
  const { tasks, openTasks, createTask, toggleComplete } = useCompanyTasks(entityType === 'portfolio' ? entityId ?? undefined : undefined);
  const timeline = useCompanyTimeline(interactions, tasks);

  const isLoading = companyLoading;
  const healthBorderColor = company ? getHealthBorderColor(company.last_interaction_at) : '';
  
  // Get earliest open task for "Next Step"
  const nextTask = openTasks.length > 0 ? openTasks[0].content : null;
  
  // Get primary founder email
  const primaryFounder = founders.find(f => f.is_primary) || founders[0];

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent 
        side="right" 
        className={`w-full sm:w-[600px] lg:w-[680px] xl:w-[720px] p-0 bg-background/95 backdrop-blur-xl border-l overflow-hidden flex flex-col data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=open]:duration-200 border-t-4 ${healthBorderColor}`}
      >
        {isLoading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>
        ) : entityType === 'portfolio' && company ? (
          <>
            <SheetHeader className="p-0 sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/40">
              <CompanyCommandHeader
                company={company}
                onClose={onClose}
              />
            </SheetHeader>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Action Overview - Next Step + Summary */}
              <CompanyCommandSummary
                lastInteractionAt={company.last_interaction_at}
                openTaskCount={openTasks.length}
                status={company.status}
                nextTask={nextTask}
              />

              {/* Quick Actions */}
              <CompanyCommandQuickActions
                companyId={company.id}
                primaryFounderEmail={primaryFounder?.email}
                onAddTask={() => {
                  const input = document.querySelector<HTMLInputElement>('[data-task-input]');
                  input?.focus();
                }}
                onAddNote={() => {
                  const textarea = document.querySelector<HTMLTextAreaElement>('[data-note-input]');
                  textarea?.focus();
                }}
              />

              {founders.length > 0 && (
                <CompanyCommandContacts contacts={founders} />
              )}

              <CompanyCommandTasks
                tasks={openTasks.slice(0, 5)}
                companyId={company.id}
                onCreateTask={createTask}
                onToggleComplete={toggleComplete}
              />

              <CompanyCommandNotes
                interactions={recentInteractions}
                companyId={company.id}
                onCreateInteraction={createInteraction}
              />

              <CompanyCommandTimeline events={timeline.slice(0, 8)} />
            </div>
          </>
        ) : entityType === 'pipeline' ? (
          <div className="p-4">
            <p className="text-muted-foreground text-sm">
              Pipeline company details coming soon. Use the Pipeline page for full details.
            </p>
          </div>
        ) : (
          <div className="p-4">
            <p className="text-muted-foreground text-sm">No company selected.</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
