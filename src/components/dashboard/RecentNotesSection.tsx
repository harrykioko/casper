import { FileText, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { GlassPanel, GlassPanelHeader, GlassSubcard } from "@/components/ui/glass-panel";
import { formatDistanceToNow } from "date-fns";

interface Note {
  id: string;
  content: string;
  companyName: string;
  createdAt: string;
}

interface RecentNotesSectionProps {
  notes?: Note[];
}

export function RecentNotesSection({ notes = [] }: RecentNotesSectionProps) {
  // Show placeholder if no notes
  const displayNotes = notes.length > 0 ? notes.slice(0, 4) : [
    { id: '1', content: 'Sample note placeholder', companyName: 'Company A', createdAt: new Date().toISOString() },
    { id: '2', content: 'Another note placeholder', companyName: 'Company B', createdAt: new Date(Date.now() - 86400000).toISOString() },
  ];

  return (
    <GlassPanel className="h-full">
      <GlassPanelHeader 
        title="Recent Notes" 
        action={
          <Link 
            to="/portfolio" 
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
          >
            View All
            <ArrowRight className="h-3 w-3" />
          </Link>
        }
      />
      
      <div className="space-y-3">
        {displayNotes.map((note) => (
          <GlassSubcard key={note.id}>
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-accent-purple/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText className="h-4 w-4 text-accent-purple" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground line-clamp-2">{note.content}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{note.companyName}</span>
                  <span className="text-xs text-muted-foreground/50">•</span>
                  <span className="text-xs text-muted-foreground/70">
                    {formatDistanceToNow(new Date(note.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </GlassSubcard>
        ))}
      </div>
      
      {notes.length === 0 && (
        <p className="mt-4 text-xs text-muted-foreground/70 text-center italic">
          Notes from portfolio and pipeline companies will appear here.
        </p>
      )}
    </GlassPanel>
  );
}
