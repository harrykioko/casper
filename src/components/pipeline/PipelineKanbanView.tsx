import { useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { PipelineCompany } from '@/types/pipeline';
import { PipelineCard } from './PipelineCard';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PipelineKanbanViewProps {
  companies: PipelineCompany[];
  onCardClick: (company: PipelineCompany) => void;
}

const columns = [
  { id: 'new', title: 'New', color: 'border-slate-400' },
  { id: 'passed', title: 'Passed', color: 'border-rose-400' },
  { id: 'to_share', title: 'To Share', color: 'border-amber-400' },
  { id: 'interesting', title: 'Interesting', color: 'border-sky-400' },
  { id: 'pearls', title: 'Pearls', color: 'border-purple-400' },
];

function DraggableCard({ company, onCardClick }: { company: PipelineCompany; onCardClick: (company: PipelineCompany) => void }) {
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
      />
    </div>
  );
}

function KanbanColumn({ 
  id, 
  title, 
  color, 
  companies, 
  onCardClick 
}: { 
  id: string; 
  title: string; 
  color: string; 
  companies: PipelineCompany[];
  onCardClick: (company: PipelineCompany) => void;
}) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div className="flex-1 min-w-80">
      <div className={`bg-white/10 dark:bg-slate-800/30 backdrop-blur-lg rounded-xl border-2 ${color} h-full`}>
        <div className="p-4 border-b border-white/20">
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground">{companies.length} companies</p>
        </div>
        
        <div
          ref={setNodeRef}
          className={`transition-colors duration-200 ${isOver ? 'bg-primary/10' : ''}`}
        >
          <ScrollArea className="h-[calc(100vh-16rem)] p-4">
            <div className="space-y-4">
              {companies.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>No companies</p>
                  <p className="text-xs mt-1">Drag companies here</p>
                </div>
              ) : (
                companies.map((company) => (
                  <DraggableCard
                    key={company.id}
                    company={company}
                    onCardClick={onCardClick}
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

export function PipelineKanbanView({ companies, onCardClick }: PipelineKanbanViewProps) {
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
          />
        ))}
      </div>
    </div>
  );
}