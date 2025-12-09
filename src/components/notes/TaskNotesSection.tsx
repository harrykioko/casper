import { useState } from 'react';
import { StickyNote, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { NotesList } from '@/components/notes/NotesList';
import { useNotesForTarget, createNote, updateNote, deleteNote } from '@/hooks/useNotes';
import { cn } from '@/lib/utils';
import type { Note } from '@/types/notes';

interface TaskNotesSectionProps {
  taskId: string;
  className?: string;
}

export function TaskNotesSection({ taskId, className }: TaskNotesSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const { notes, loading, refetch } = useNotesForTarget({
    targetType: 'task',
    targetId: taskId,
  });

  const handleCreateNote = async (payload: { title?: string; content: string }) => {
    const result = await createNote({
      ...payload,
      primaryContext: { targetType: 'task', targetId: taskId },
    });
    if (result) {
      setIsAdding(false);
      refetch();
    }
  };

  const handleUpdateNote = async (payload: { title?: string; content: string }) => {
    if (!editingNote) return;
    const result = await updateNote(editingNote.id, payload);
    if (result) {
      setEditingNote(null);
      refetch();
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const success = await deleteNote(noteId);
    if (success) {
      refetch();
    }
    return success;
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">Notes</h3>
          {notes.length > 0 && (
            <span className="text-xs text-muted-foreground">({notes.length})</span>
          )}
        </div>
        {!isAdding && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs gap-1"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Add note
          </Button>
        )}
      </div>

      {/* Inline editor for adding */}
      {isAdding && (
        <NoteEditor
          mode="create"
          onSave={handleCreateNote}
          onCancel={() => setIsAdding(false)}
          showTitle={false}
          placeholder="Add a note about this task..."
        />
      )}

      {/* Inline editor for editing */}
      {editingNote && (
        <NoteEditor
          mode="edit"
          initialValue={{
            title: editingNote.title || undefined,
            content: editingNote.content,
          }}
          onSave={handleUpdateNote}
          onCancel={() => setEditingNote(null)}
          showTitle={false}
        />
      )}

      {/* Notes list */}
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
        </div>
      ) : (
        <NotesList
          notes={notes}
          onEditNote={setEditingNote}
          onDeleteNote={handleDeleteNote}
          maxHeight="200px"
          emptyMessage="No notes for this task"
        />
      )}
    </div>
  );
}
