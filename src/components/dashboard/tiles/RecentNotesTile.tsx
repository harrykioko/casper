import { FileText, MessageSquare, Phone, Video, Mail, RefreshCw, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRecentNotes, RecentNote } from '@/hooks/useRecentNotes';
import { DashboardTile } from './DashboardTile';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RecentNotesTileProps {
  onCompanyClick: (companyId: string, entityType: 'portfolio' | 'pipeline') => void;
}

const interactionIcons: Record<RecentNote['interaction_type'], typeof FileText> = {
  note: FileText,
  call: Phone,
  meeting: Video,
  email: Mail,
  update: RefreshCw,
};

const interactionColors: Record<RecentNote['interaction_type'], string> = {
  note: 'bg-blue-500/10 text-blue-500',
  call: 'bg-green-500/10 text-green-500',
  meeting: 'bg-purple-500/10 text-purple-500',
  email: 'bg-amber-500/10 text-amber-500',
  update: 'bg-cyan-500/10 text-cyan-500',
};

export function RecentNotesTile({ onCompanyClick }: RecentNotesTileProps) {
  const { notes, loading } = useRecentNotes();

  if (loading) {
    return (
      <DashboardTile title="Recent Notes" icon={FileText} colSpan={6}>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </DashboardTile>
    );
  }

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      <FileText className="w-8 h-8 mb-2" />
      <span className="text-sm font-medium">No recent notes</span>
      <span className="text-xs">Notes and interactions will appear here</span>
    </div>
  );

  return (
    <DashboardTile 
      title="Recent Notes" 
      icon={FileText} 
      colSpan={6}
      isEmpty={notes.length === 0}
      emptyState={emptyState}
    >
      <ScrollArea className="h-[200px]">
        <div className="space-y-2 pr-2">
          {notes.map((note) => {
            const Icon = interactionIcons[note.interaction_type];
            const colorClass = interactionColors[note.interaction_type];
            
            return (
              <button
                key={note.id}
                onClick={() => onCompanyClick(note.company_id, note.entity_type)}
                className="w-full flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors duration-150 text-left group"
              >
                {/* Type Icon */}
                <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-4 h-4" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-foreground truncate">
                      {note.company_name}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {formatDistanceToNow(new Date(note.occurred_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {note.content}
                  </p>
                </div>

                {/* Arrow on hover */}
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </DashboardTile>
  );
}
