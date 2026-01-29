import { useState, useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { PipelineCompany, EnhancedPipelineCompany, ColumnSummary } from '@/types/pipeline';
import { PipelineCardAttention, computeColumnSummary, PipelineTask } from '@/lib/pipeline/pipelineAttentionHelpers';
import { PipelineCard } from './PipelineCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ChevronDown, Settings2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface PipelineKanbanViewProps {
  companies: PipelineCompany[];
  onCardClick: (company: PipelineCompany) => void;
  attentionMap?: Map<string, PipelineCardAttention>;
  allTasks?: PipelineTask[];
  onAddTask?: (company: PipelineCompany) => void;
  onLogNote?: (company: PipelineCompany) => void;
}

type SortOption = 'default' | 'lastTouched' | 'closingSoon' | 'raiseAmount';

const columns = [
  { id: 'new', title: 'New', color: 'border-slate-300 dark:border-slate-500' },
  { id: 'passed', title: 'Passed', color: 'border-rose-300 dark:border-rose-500' },
  { id: 'to_share', title: 'To Share', color: 'border-amber-300 dark:border-amber-500' },
  { id: 'interesting', title: 'Interesting', color: 'border-sky-300 dark:border-sky-500' },
  { id: 'pearls', title: 'Pearls', color: 'border-purple-300 dark:border-purple-500' },
];

function DraggableCard({ 
  company, 
  onCardClick,
  attention,
  onAddTask,
  onLogNote,
}: { 
  company: PipelineCompany; 
  onCardClick: (company: PipelineCompany) => void;
  attention?: PipelineCardAttention;
  onAddTask?: () => void;
  onLogNote?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: company.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'opacity-50' : ''}
    >
      <PipelineCard
        company={company}
        onClick={() => onCardClick(company)}
        isDragging={isDragging}
        dragHandleProps={{ ...listeners, ...attributes }}
        attention={attention}
        onAddTask={onAddTask}
        onLogNote={onLogNote}
      />
    </div>
  );
}

function KanbanColumn({ 
  id, 
  title, 
  color, 
  companies, 
  onCardClick,
  attentionMap,
  summary,
  onAddTask,
  onLogNote,
}: { 
  id: string; 
  title: string; 
  color: string; 
  companies: PipelineCompany[];
  onCardClick: (company: PipelineCompany) => void;
  attentionMap?: Map<string, PipelineCardAttention>;
  summary?: ColumnSummary;
  onAddTask?: (company: PipelineCompany) => void;
  onLogNote?: (company: PipelineCompany) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });
  const [showNeedsAttention, setShowNeedsAttention] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');

  // Filter and sort companies
  const displayedCompanies = useMemo(() => {
    let filtered = [...companies];
    
    // Filter by needs attention if enabled
    if (showNeedsAttention && attentionMap) {
      filtered = filtered.filter(c => {
        const attention = attentionMap.get(c.id);
        return attention?.needsAttention;
      });
    }
    
    // Sort
    if (sortBy === 'lastTouched') {
      filtered.sort((a, b) => {
        const aTouch = a.last_interaction_at ? new Date(a.last_interaction_at).getTime() : 0;
        const bTouch = b.last_interaction_at ? new Date(b.last_interaction_at).getTime() : 0;
        return bTouch - aTouch; // Most recent first
      });
    } else if (sortBy === 'closingSoon') {
      filtered.sort((a, b) => {
        if (!a.close_date && !b.close_date) return 0;
        if (!a.close_date) return 1;
        if (!b.close_date) return -1;
        return new Date(a.close_date).getTime() - new Date(b.close_date).getTime();
      });
    } else if (sortBy === 'raiseAmount') {
      filtered.sort((a, b) => (b.raise_amount_usd || 0) - (a.raise_amount_usd || 0));
    }
    
    return filtered;
  }, [companies, showNeedsAttention, sortBy, attentionMap]);

  return (
    <div className="flex-1 min-w-80">
      <div className={`bg-white/10 dark:bg-slate-800/30 backdrop-blur-lg rounded-xl border-2 ${color} h-full`}>
        {/* Column Header */}
        <div className="p-4 border-b border-white/20">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-lg">{title}</h3>
            
            {/* Column Quick Controls */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 bg-popover border border-border">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor={`attention-${id}`} className="text-sm">
                      Needs attention only
                    </Label>
                    <Switch 
                      id={`attention-${id}`}
                      checked={showNeedsAttention}
                      onCheckedChange={setShowNeedsAttention}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Sort by</Label>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border border-border">
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="lastTouched">Last touched</SelectItem>
                        <SelectItem value="closingSoon">Closing soon</SelectItem>
                        <SelectItem value="raiseAmount">Raise amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <p className="text-sm text-muted-foreground">{companies.length} companies</p>
          
          {/* Column Summary */}
          {summary && summary.summaryText !== 'All clear' && (
            <p className="text-xs text-muted-foreground mt-1">
              {summary.summaryText}
            </p>
          )}
        </div>
        
        <div
          ref={setNodeRef}
          className={`transition-colors duration-200 ${isOver ? 'bg-primary/10' : ''}`}
        >
          <ScrollArea className="h-[calc(100vh-16rem)] p-4">
            <div className="space-y-5">
              {displayedCompanies.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>{showNeedsAttention ? 'No deals need attention' : 'No companies'}</p>
                  {!showNeedsAttention && <p className="text-xs mt-1">Drag companies here</p>}
                </div>
              ) : (
                displayedCompanies.map((company) => (
                  <DraggableCard
                    key={company.id}
                    company={company}
                    onCardClick={onCardClick}
                    attention={attentionMap?.get(company.id)}
                    onAddTask={() => onAddTask?.(company)}
                    onLogNote={() => onLogNote?.(company)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

export function PipelineKanbanView({ 
  companies, 
  onCardClick,
  attentionMap,
  allTasks = [],
  onAddTask,
  onLogNote,
}: PipelineKanbanViewProps) {
  // Compute column summaries
  const columnSummaries = useMemo(() => {
    const summaries = new Map<string, ColumnSummary>();
    
    for (const column of columns) {
      const columnCompanies = companies.filter(c => c.status === column.id);
      const summary = computeColumnSummary(columnCompanies, allTasks);
      summaries.set(column.id, summary);
    }
    
    return summaries;
  }, [companies, allTasks]);

  return (
    <div className="overflow-x-auto pr-4">
      <div className="flex gap-6 h-full p-6 min-w-max">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            color={column.color}
            companies={companies.filter(c => c.status === column.id)}
            onCardClick={onCardClick}
            attentionMap={attentionMap}
            summary={columnSummaries.get(column.id)}
            onAddTask={onAddTask}
            onLogNote={onLogNote}
          />
        ))}
      </div>
    </div>
  );
}
