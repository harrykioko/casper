import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Pencil, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ProjectNote } from '@/hooks/useProjectNotes';

interface NoteCardProps {
  note: ProjectNote;
  onUpdate: (noteId: string, updates: { content?: string; title?: string }) => Promise<ProjectNote | null>;
  onDelete: (noteId: string) => Promise<boolean>;
  onSelect?: (note: ProjectNote) => void;
  isSelected?: boolean;
}

export function NoteCard({ note, onUpdate, onDelete, onSelect, isSelected }: NoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    if (!editContent.trim()) return;
    const result = await onUpdate(note.id, { content: editContent.trim() });
    if (result) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(note.id);
    setIsDeleting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditContent(note.content);
    }
  };

  // Get preview (first 3 lines or 150 chars)
  const preview = note.content.split('\n').slice(0, 3).join('\n').slice(0, 150);
  const hasMore = note.content.length > 150 || note.content.split('\n').length > 3;

  if (isEditing) {
    return (
      <div className="p-3 rounded-lg border border-border bg-background space-y-2">
        <Textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-[100px] text-sm resize-none"
          autoFocus
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            ⌘+Enter to save, Esc to cancel
          </span>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => {
                setIsEditing(false);
                setEditContent(note.content);
              }}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-emerald-500 hover:text-emerald-600"
              onClick={handleSave}
              disabled={!editContent.trim()}
            >
              <Check className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group p-3 rounded-lg border transition-colors cursor-pointer",
        isSelected
          ? "border-primary/50 bg-primary/5"
          : "border-border/50 bg-background/50 hover:border-border hover:bg-background"
      )}
      onClick={() => onSelect?.(note)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm whitespace-pre-wrap break-words">
            {preview}
            {hasMore && <span className="text-muted-foreground">...</span>}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
          >
            <Pencil className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            disabled={isDeleting}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}
