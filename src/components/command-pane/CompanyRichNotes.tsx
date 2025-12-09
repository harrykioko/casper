import { useState } from 'react';
import { StickyNote, Plus, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { NotesList } from '@/components/notes/NotesList';
import { useNotesForTarget, createNote, updateNote, deleteNote } from '@/hooks/useNotes';
import { cn } from '@/lib/utils';
import type { Note, NoteTargetType } from '@/types/notes';

interface CompanyRichNotesProps {
  companyId: string;
  companyType: 'company' | 'pipeline';
  className?: string;
}

export function CompanyRichNotes({ companyId, companyType, className }: CompanyRichNotesProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Map pipeline companies to 'company' target type for now
  const targetType: NoteTargetType = 'company';
  
  const { notes, loading, refetch } = useNotesForTarget({
    targetType,
    targetId: companyId,
  });

  const displayedNotes = showAll ? notes : notes.slice(0, 3);

  const handleCreateNote = async (payload: { title?: string; content: string }) => {
    const result = await createNote({
      ...payload,
      primaryContext: { targetType, targetId: companyId },
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
      "rounded-xl p-4",
      "bg-white/40 dark:bg-white/[0.04]",
      "border border-white/20 dark:border-white/10",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-amber-500/20">
            <StickyNote className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <h3 className="text-sm font-medium">Notes</h3>
          {notes.length > 0 && (
            <span className="text-xs text-muted-foreground">({notes.length})</span>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs gap-1"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="w-3.5 h-3.5" />
          Add
        </Button>
      </div>

      {/* Inline editor for adding */}
      {isAdding && (
        <div className="mb-3">
          <NoteEditor
            mode="create"
            onSave={handleCreateNote}
            onCancel={() => setIsAdding(false)}
            showTitle={false}
            placeholder="Add a note..."
            className="border-amber-500/30"
          />
        </div>
      )}

      {/* Inline editor for editing */}
      {editingNote && (
        <div className="mb-3">
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
        </div>
      )}

      {/* Notes list */}
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
        </div>
      ) : (
        <>
          <NotesList
            notes={displayedNotes}
            onEditNote={setEditingNote}
            onDeleteNote={handleDeleteNote}
            maxHeight={showAll ? "300px" : undefined}
            emptyMessage="No notes yet"
          />

          {/* View all toggle */}
          {notes.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 h-7 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show less' : `View all ${notes.length} notes`}
              <ChevronRight className={cn(
                "w-3.5 h-3.5 ml-1 transition-transform",
                showAll && "rotate-90"
              )} />
            </Button>
          )}
        </>
      )}
    </div>
  );
}
