import { Plus, MessageSquare, Mail, Phone, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompanyCommandQuickActionsProps {
  companyId: string;
  primaryFounderEmail?: string | null;
  onAddTask: () => void;
  onAddNote: () => void;
  onFloatingNote?: () => void;
  entityType?: 'portfolio' | 'pipeline';
}

export function CompanyCommandQuickActions({ 
  companyId, 
  primaryFounderEmail, 
  onAddTask, 
  onAddNote,
  onFloatingNote 
}: CompanyCommandQuickActionsProps) {
  return (
    <div className="flex items-center gap-1.5">
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 text-xs gap-1 px-2"
        onClick={onAddTask}
      >
        <Plus className="w-3 h-3" />
        Task
      </Button>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 text-xs gap-1 px-2"
        onClick={onAddNote}
      >
        <MessageSquare className="w-3 h-3" />
        Note
      </Button>
      {onFloatingNote && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 text-xs gap-1 px-2"
          onClick={onFloatingNote}
          title="Open floating note window"
        >
          <StickyNote className="w-3 h-3" />
          Float
        </Button>
      )}
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 text-xs gap-1 px-2"
        onClick={onAddNote}
      >
        <Phone className="w-3 h-3" />
        Log Call
      </Button>
      {primaryFounderEmail && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-7 text-xs gap-1 px-2"
          asChild
        >
          <a href={`mailto:${primaryFounderEmail}`}>
            <Mail className="w-3 h-3" />
            Email
          </a>
        </Button>
      )}
    </div>
  );
}
