import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet';
import { CompanyCommandHeader } from './CompanyCommandHeader';
import { CompanyCommandSummary } from './CompanyCommandSummary';
import { CompanyCommandContacts } from './CompanyCommandContacts';
import { CompanyCommandTasks } from './CompanyCommandTasks';
import { CompanyCommandNotes } from './CompanyCommandNotes';
import { CompanyCommandTimeline } from './CompanyCommandTimeline';
import { useCompany } from '@/hooks/useCompany';
import { useCompanyContacts } from '@/hooks/useCompanyContacts';
import { useCompanyInteractions } from '@/hooks/useCompanyInteractions';
import { useCompanyTasks } from '@/hooks/useCompanyTasks';
import { useCompanyTimeline } from '@/hooks/useCompanyTimeline';
import { Skeleton } from '@/components/ui/skeleton';

interface CompanyCommandPaneProps {
  open: boolean;
  onClose: () => void;
  entityType: 'portfolio' | 'pipeline';
  entityId: string | null;
}

export function CompanyCommandPane({ open, onClose, entityType, entityId }: CompanyCommandPaneProps) {
  const { company, loading: companyLoading } = useCompany(entityType === 'portfolio' ? entityId ?? undefined : undefined);
  const { contacts, founders } = useCompanyContacts(entityType === 'portfolio' ? entityId ?? undefined : undefined);
  const { interactions, createInteraction, recentInteractions } = useCompanyInteractions(entityType === 'portfolio' ? entityId ?? undefined : undefined);
  const { tasks, openTasks, createTask, toggleComplete } = useCompanyTasks(entityType === 'portfolio' ? entityId ?? undefined : undefined);
  const timeline = useCompanyTimeline(interactions, tasks);

  const isLoading = companyLoading;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[540px] lg:w-[580px] p-0 bg-background/95 backdrop-blur-xl border-l overflow-hidden flex flex-col data-[state=open]:animate-in data-[state=open]:slide-in-from-right data-[state=open]:duration-200"
      >
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : entityType === 'portfolio' && company ? (
          <>
            <SheetHeader className="p-0 sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b border-border/40">
              <CompanyCommandHeader
                company={company}
                onClose={onClose}
              />
            </SheetHeader>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <CompanyCommandSummary
                lastInteractionAt={company.last_interaction_at}
                openTaskCount={openTasks.length}
                status={company.status}
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
          <div className="p-6">
            <p className="text-muted-foreground text-sm">
              Pipeline company details coming soon. Use the Pipeline page for full details.
            </p>
          </div>
        ) : (
          <div className="p-6">
            <p className="text-muted-foreground text-sm">No company selected.</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
