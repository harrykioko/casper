import { useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { NoteCard } from './NoteCard';
import { GlassModuleCard } from './GlassModuleCard';
import { ProjectEmptyState } from './ProjectEmptyState';
import { ProjectNote } from '@/hooks/useProjectNotes';

interface ProjectNotesSectionProps {
  notes: ProjectNote[];
  onCreateNote: (content: string, title?: string) => Promise<ProjectNote | null>;
  onUpdateNote: (noteId: string, updates: { content?: string; title?: string }) => Promise<ProjectNote | null>;
  onDeleteNote: (noteId: string) => Promise<boolean>;
  onSelectNote?: (note: ProjectNote) => void;
  selectedNoteId?: string;
}

export function ProjectNotesSection({
  notes,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onSelectNote,
  selectedNoteId,
}: ProjectNotesSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newContent.trim()) return;
    
    setIsSubmitting(true);
    const result = await onCreateNote(newContent.trim());
    if (result) {
      setNewContent('');
      setIsAdding(false);
    }
    setIsSubmitting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setIsAdding(false);
      setNewContent('');
    }
  };

  return (
    <GlassModuleCard
      icon={<FileText className="w-4 h-4" />}
      title="Notes"
      count={notes.length}
      onAdd={() => setIsAdding(true)}
      addLabel="Add Note"
      accentColor="#6366f1"
    >
      {isAdding && (
        <div className="space-y-3 mb-4">
          <Textarea
            placeholder="Write your note... (Markdown supported)"
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[100px] text-sm resize-none bg-white/50 dark:bg-white/[0.04] border-white/30 dark:border-white/10 focus:ring-2 focus:ring-indigo-500/30"
            autoFocus
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              ⌘+Enter to save, Esc to cancel
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => {
                  setIsAdding(false);
                  setNewContent('');
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={handleSubmit}
                disabled={!newContent.trim() || isSubmitting}
              >
                Save Note
              </Button>
            </div>
          </div>
        </div>
      )}

      {notes.length === 0 && !isAdding ? (
        <ProjectEmptyState
          icon={<FileText className="w-7 h-7" />}
          title="No notes yet"
          description="Add ideas and insights to shape this project."
          actionLabel="Add Note"
          onAction={() => setIsAdding(true)}
        />
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onUpdate={onUpdateNote}
              onDelete={onDeleteNote}
              onSelect={onSelectNote}
              isSelected={selectedNoteId === note.id}
            />
          ))}
        </div>
      )}
    </GlassModuleCard>
  );
}
