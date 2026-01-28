import { useState } from 'react';
import { StickyNote, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { NotesList } from '@/components/notes/NotesList';
import { useNotesForTarget, createNote, updateNote, deleteNote } from '@/hooks/useNotes';
import { cn } from '@/lib/utils';
import type { Note } from '@/types/notes';

interface ReadingItemNotesSectionProps {
  readingItemId: string;
  className?: string;
}

export function ReadingItemNotesSection({ readingItemId, className }: ReadingItemNotesSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const { notes, loading, refetch } = useNotesForTarget({
    targetType: 'reading_item',
    targetId: readingItemId,
  });

  const handleCreateNote = async (payload: { title?: string; content: string }) => {
    const result = await createNote({
      ...payload,
      primaryContext: { targetType: 'reading_item', targetId: readingItemId },
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
    <div className={cn(
      "rounded-lg p-3",
      "bg-white/40 dark:bg-white/[0.04]",
      "border border-white/20 dark:border-white/10",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <StickyNote className="w-3.5 h-3.5 text-muted-foreground" />
          <h3 className="text-xs font-medium">Notes</h3>
          {notes.length > 0 && (
            <span className="text-[10px] text-muted-foreground">({notes.length})</span>
          )}
        </div>
        {!isAdding && (
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-[10px] gap-0.5 px-2"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="w-3 h-3" />
            Add
          </Button>
        )}
      </div>

      {/* Inline editor for adding */}
      {isAdding && (
        <div className="mb-2">
          <NoteEditor
            mode="create"
            onSave={handleCreateNote}
            onCancel={() => setIsAdding(false)}
            showTitle={false}
            placeholder="Add a note..."
            className="text-xs"
          />
        </div>
      )}

      {/* Inline editor for editing */}
      {editingNote && (
        <div className="mb-2">
          <NoteEditor
            mode="edit"
            initialValue={{
              content: editingNote.content,
            }}
            onSave={handleUpdateNote}
            onCancel={() => setEditingNote(null)}
            showTitle={false}
          />
        </div>
      )}

      {/* Notes list */}
      {loading ? (
        <div className="flex items-center justify-center py-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
        </div>
      ) : (
        <NotesList
          notes={notes}
          onEditNote={setEditingNote}
          onDeleteNote={handleDeleteNote}
          maxHeight="150px"
          emptyMessage="No notes"
        />
      )}
    </div>
  );
}
