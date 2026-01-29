import { useState } from 'react';
import { format } from 'date-fns';
import { FileText, Pencil, Trash2, MessageSquare, Phone, Calendar, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { Note, NoteTargetType } from '@/types/notes';

interface NotesListProps {
  notes: Note[];
  onEditNote?: (note: Note) => void;
  onDeleteNote?: (noteId: string) => Promise<boolean>;
  onNoteClick?: (note: Note) => void;
  showContextChips?: boolean;
  maxHeight?: string;
  emptyMessage?: string;
  className?: string;
}

const noteTypeIcons: Record<string, React.ElementType> = {
  call: Phone,
  meeting: Calendar,
  update: MessageSquare,
  general: FileText,
};

const targetTypeLabels: Record<NoteTargetType, string> = {
  task: 'Task',
  company: 'Company',
  project: 'Project',
  reading_item: 'Reading',
  calendar_event: 'Event',
};

const targetTypeColors: Record<NoteTargetType, string> = {
  task: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  company: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
  project: 'bg-violet-500/20 text-violet-600 dark:text-violet-400',
  reading_item: 'bg-rose-500/20 text-rose-600 dark:text-rose-400',
  calendar_event: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
};

function NoteCard({
  note,
  onEdit,
  onDelete,
  onClick,
  showContextChips,
}: {
  note: Note;
  onEdit?: () => void;
  onDelete?: () => void;
  onClick?: () => void;
  showContextChips?: boolean;
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const NoteTypeIcon = note.noteType ? noteTypeIcons[note.noteType] || FileText : FileText;

  const handleDelete = () => {
    setShowDeleteConfirm(false);
    onDelete?.();
  };

  return (
    <>
      <div
        className={cn(
          "group p-3 rounded-lg transition-all duration-200",
          "bg-white/40 dark:bg-white/[0.04] hover:bg-white/60 dark:hover:bg-white/[0.08]",
          "border border-white/20 dark:border-white/10",
          onClick && "cursor-pointer"
        )}
        onClick={onClick}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <NoteTypeIcon className="w-3.5 h-3.5 text-muted-foreground" />
            {note.noteType && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 capitalize">
                {note.noteType}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {format(new Date(note.createdAt), 'MMM d, yyyy')}
            </span>
          </div>
          
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                {onEdit && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                    <Pencil className="w-3.5 h-3.5 mr-2" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-2" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Title if present */}
        {note.title && (
          <h4 className="font-medium text-sm mb-1 line-clamp-1">{note.title}</h4>
        )}

        {/* Content preview */}
        <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">
          {note.content}
        </p>

        {/* Context chips */}
        {showContextChips && note.links && note.links.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-white/10">
            {note.links.map((link) => (
              <Badge
                key={link.id}
                variant="secondary"
                className={cn("text-[10px] px-1.5 py-0 h-4", targetTypeColors[link.targetType])}
              >
                {targetTypeLabels[link.targetType]}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function NotesList({
  notes,
  onEditNote,
  onDeleteNote,
  onNoteClick,
  showContextChips = false,
  maxHeight,
  emptyMessage = 'No notes yet',
  className,
}: NotesListProps) {
  if (notes.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <FileText className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={cn("space-y-2", className)}
      style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}
    >
      {notes.map((note) => (
        <NoteCard
          key={note.id}
          note={note}
          onEdit={onEditNote ? () => onEditNote(note) : undefined}
          onDelete={onDeleteNote ? () => onDeleteNote(note.id) : undefined}
          onClick={onNoteClick ? () => onNoteClick(note) : undefined}
          showContextChips={showContextChips}
        />
      ))}
    </div>
  );
}
