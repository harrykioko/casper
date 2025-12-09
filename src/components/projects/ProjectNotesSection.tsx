import { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NoteCard } from './NoteCard';
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
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            Notes
            <span className="text-xs text-muted-foreground font-normal">
              ({notes.length})
            </span>
          </CardTitle>
          {!isAdding && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Note
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isAdding && (
          <div className="space-y-2">
            <Textarea
              placeholder="Write your note... (Markdown supported)"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[100px] text-sm resize-none"
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
                  onClick={() => {
                    setIsAdding(false);
                    setNewContent('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
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
          <div className="text-center py-6 text-muted-foreground text-sm">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No notes yet</p>
            <p className="text-xs mt-1">Add notes to capture ideas and research</p>
          </div>
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
      </CardContent>
    </Card>
  );
}
