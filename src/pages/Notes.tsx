import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { StickyNote, Search, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { NotesList } from '@/components/notes/NotesList';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { useAllUserNotes, updateNote, deleteNote, createNote } from '@/hooks/useNotes';
import { cn } from '@/lib/utils';
import type { Note, NoteTargetType } from '@/types/notes';

type FilterType = 'all' | NoteTargetType;

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'task', label: 'Tasks' },
  { value: 'company', label: 'Companies' },
  { value: 'project', label: 'Projects' },
  { value: 'reading_item', label: 'Reading' },
];

export default function Notes() {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const filter = useMemo(() => ({
    targetType: filterType === 'all' ? undefined : filterType,
    search: searchQuery || undefined,
  }), [filterType, searchQuery]);

  const { notes, loading, refetch } = useAllUserNotes(filter);

  const handleEditNote = async (payload: { title?: string; content: string }) => {
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

  const handleCreateNote = async (payload: { title?: string; content: string }) => {
    // For global creation without a target, we'll need the AddNoteModal
    // This is a placeholder - notes should be created with context
    setIsCreating(false);
  };

  return (
    <div className="min-h-screen p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <StickyNote className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Notes</h1>
              <p className="text-sm text-muted-foreground">
                {notes.length} note{notes.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className={cn(
          "p-4 rounded-xl mb-6",
          "bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl",
          "border border-white/20 dark:border-white/10"
        )}>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-transparent border-white/20 dark:border-white/10"
              />
            </div>

            {/* Filter chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              {filterOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant={filterType === option.value ? 'default' : 'secondary'}
                  className={cn(
                    "cursor-pointer transition-all whitespace-nowrap",
                    filterType === option.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20"
                  )}
                  onClick={() => setFilterType(option.value)}
                >
                  {option.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Edit modal */}
        {editingNote && (
          <div className="mb-6">
            <NoteEditor
              mode="edit"
              initialValue={{
                title: editingNote.title || undefined,
                content: editingNote.content,
              }}
              onSave={handleEditNote}
              onCancel={() => setEditingNote(null)}
            />
          </div>
        )}

        {/* Notes list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <NotesList
            notes={notes}
            onEditNote={setEditingNote}
            onDeleteNote={handleDeleteNote}
            showContextChips
            emptyMessage={
              searchQuery
                ? "No notes match your search"
                : filterType !== 'all'
                ? `No notes for ${filterOptions.find(f => f.value === filterType)?.label.toLowerCase()}`
                : "No notes yet. Create one from a task, company, project, or reading item."
            }
          />
        )}
      </motion.div>
    </div>
  );
}
