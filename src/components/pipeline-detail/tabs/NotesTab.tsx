import { useState } from 'react';
import { FileText, Phone, Calendar, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { GlassPanel, GlassPanelHeader, GlassSubcard } from '@/components/ui/glass-panel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PipelineInteraction } from '@/types/pipelineExtended';
import { InteractionType } from '@/types/portfolio';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface NotesTabProps {
  companyId: string;
  interactions: PipelineInteraction[];
  isLoading: boolean;
  onCreateInteraction: (data: { interaction_type: InteractionType; content: string; occurred_at?: string }) => Promise<any>;
}

const noteTypes: { value: InteractionType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'note', label: 'Note', icon: FileText },
  { value: 'call', label: 'Call', icon: Phone },
  { value: 'meeting', label: 'Meeting', icon: Calendar },
  { value: 'update', label: 'Update', icon: RefreshCw },
];

const interactionTypeBadgeColors: Record<string, string> = {
  note: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  call: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  meeting: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  update: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  email: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
};

const interactionTypeLabels: Record<string, string> = {
  note: 'Note',
  call: 'Call',
  meeting: 'Meeting',
  update: 'Update',
  email: 'Email',
};

export function NotesTab({
  companyId,
  interactions,
  isLoading,
  onCreateInteraction,
}: NotesTabProps) {
  const [newNoteContent, setNewNoteContent] = useState('');
  const [noteType, setNoteType] = useState<InteractionType>('note');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;
    
    setIsSaving(true);
    try {
      await onCreateInteraction({
        interaction_type: noteType,
        content: newNoteContent.trim(),
      });
      setNewNoteContent('');
      setNoteType('note');
    } finally {
      setIsSaving(false);
    }
  };

  // Filter to note-type interactions
  const notes = interactions.filter(i => 
    ['note', 'call', 'meeting', 'update'].includes(i.interaction_type)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Note Composer */}
      <GlassPanel>
        <GlassPanelHeader title="Add Note" />
        <div className="p-4 space-y-3">
          <Textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Add a note, call summary, or diligence update..."
            className="min-h-[100px] resize-none bg-muted/30 border-border/50 focus-visible:ring-1"
            disabled={isSaving}
          />
          
          <div className="flex items-center justify-between">
            <Select value={noteType} onValueChange={(v) => setNoteType(v as InteractionType)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {noteTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center gap-2">
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button onClick={handleAddNote} disabled={!newNoteContent.trim() || isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Note'
              )}
            </Button>
          </div>
        </div>
      </GlassPanel>

      {/* Notes Feed */}
      <GlassPanel>
        <GlassPanelHeader title={`Notes (${notes.length})`} />
        <div className="p-4">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No notes yet. Add one above!
            </p>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <GlassSubcard key={note.id} className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wide",
                      interactionTypeBadgeColors[note.interaction_type] || 'bg-muted text-muted-foreground'
                    )}>
                      {interactionTypeLabels[note.interaction_type] || note.interaction_type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(note.occurred_at), 'MMM d, yyyy · h:mm a')}
                    </span>
                  </div>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                </GlassSubcard>
              ))}
            </div>
          )}
        </div>
      </GlassPanel>
    </div>
  );
}
