import { PipelineCompany } from '@/types/pipeline';
import { PipelineCard } from './PipelineCard';
import { useDroppable } from '@dnd-kit/core';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ActiveDealsSidebarProps {
  activeDeals: PipelineCompany[];
  onCardClick: (company: PipelineCompany) => void;
}

export function ActiveDealsSidebar({ activeDeals, onCardClick }: ActiveDealsSidebarProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: 'active-sidebar',
  });

  const sortedDeals = [...activeDeals].sort((a, b) => {
    if (!a.close_date && !b.close_date) return 0;
    if (!a.close_date) return 1;
    if (!b.close_date) return -1;
    return new Date(a.close_date).getTime() - new Date(b.close_date).getTime();
  });

  return (
    <div className="w-80 bg-white/10 dark:bg-slate-800/30 backdrop-blur-lg border-l border-white/20">
      <div className="p-4 border-b border-white/20">
        <h2 className="font-semibold text-lg">Active Deals</h2>
        <p className="text-sm text-muted-foreground">{activeDeals.length} active</p>
      </div>
      
      <div
        ref={setNodeRef}
        className={`h-full transition-colors duration-200 ${
          isOver ? 'bg-emerald-500/10' : ''
        }`}
      >
        <ScrollArea className="h-[calc(100vh-12rem)] p-4">
          <div className="space-y-4">
            {sortedDeals.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>No active deals</p>
                <p className="text-xs mt-1">Drag deals here to mark as active</p>
              </div>
            ) : (
              sortedDeals.map((company) => (
                <PipelineCard
                  key={company.id}
                  company={company}
                  onClick={() => onCardClick(company)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}