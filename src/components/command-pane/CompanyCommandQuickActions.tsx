import { Plus, MessageSquare, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CompanyCommandQuickActionsProps {
  companyId: string;
  primaryFounderEmail?: string | null;
  onAddTask: () => void;
  onAddNote: () => void;
}

export function CompanyCommandQuickActions({ 
  companyId, 
  primaryFounderEmail, 
  onAddTask, 
  onAddNote 
}: CompanyCommandQuickActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        className="h-8 text-xs gap-1.5"
        onClick={onAddTask}
      >
        <Plus className="w-3.5 h-3.5" />
        Add Task
      </Button>
      <Button 
        variant="outline" 
        size="sm" 
        className="h-8 text-xs gap-1.5"
        onClick={onAddNote}
      >
        <MessageSquare className="w-3.5 h-3.5" />
        Add Note
      </Button>
      {primaryFounderEmail && (
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 text-xs gap-1.5"
          asChild
        >
          <a href={`mailto:${primaryFounderEmail}`}>
            <Mail className="w-3.5 h-3.5" />
            Email Founder
          </a>
        </Button>
      )}
    </div>
  );
}
