import { X, FileText, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ProjectNote } from '@/hooks/useProjectNotes';
import { useState, useEffect } from 'react';

interface ProjectDetailPaneProps {
  selectedNote: ProjectNote | null;
  onClose: () => void;
  onUpdateNote: (noteId: string, updates: { content?: string; title?: string }) => Promise<ProjectNote | null>;
  onDeleteNote: (noteId: string) => Promise<boolean>;
}

export function ProjectDetailPane({
  selectedNote,
  onClose,
  onUpdateNote,
  onDeleteNote,
}: ProjectDetailPaneProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (selectedNote) {
      setEditContent(selectedNote.content);
      setIsEditing(false);
    }
  }, [selectedNote?.id]);

  if (!selectedNote) {
    return (
      <div className="w-[380px] h-full flex items-center justify-center border-l border-border/50 bg-background/30">
        <div className="text-center text-muted-foreground">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Select an item to view details</p>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    if (!editContent.trim()) return;
    const result = await onUpdateNote(selectedNote.id, { content: editContent.trim() });
    if (result) {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await onDeleteNote(selectedNote.id);
    if (confirmed) {
      onClose();
    }
  };

  return (
    <div className="w-[380px] h-full flex flex-col border-l border-border/50 bg-background/50 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Note</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isEditing ? (
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[300px] text-sm resize-none"
            autoFocus
          />
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {selectedNote.content}
            </pre>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border/50 space-y-3">
        <p className="text-xs text-muted-foreground">
          Created {formatDistanceToNow(new Date(selectedNote.created_at), { addSuffix: true })}
          {selectedNote.updated_at !== selectedNote.created_at && (
            <> • Updated {formatDistanceToNow(new Date(selectedNote.updated_at), { addSuffix: true })}</>
          )}
        </p>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsEditing(false);
                  setEditContent(selectedNote.content);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!editContent.trim()}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
