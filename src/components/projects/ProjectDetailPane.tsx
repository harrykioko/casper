import { X, FileText, Calendar, Clock, Tag, ArrowRight, CheckSquare } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ProjectNote } from '@/hooks/useProjectNotes';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
      <div className={cn(
        "w-[380px] h-full flex items-center justify-center",
        "bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl",
        "border-l border-white/20 dark:border-white/[0.08]"
      )}>
        <div className="text-center text-muted-foreground p-6">
          <div className={cn(
            "w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center",
            "bg-muted/30"
          )}>
            <FileText className="w-8 h-8 opacity-30" />
          </div>
          <p className="text-sm font-medium">Select an item</p>
          <p className="text-xs mt-1 opacity-70">View and edit details here</p>
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
    <AnimatePresence mode="wait">
      <motion.div
        key={selectedNote.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "w-[380px] h-full flex flex-col",
          "bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl",
          "border-l border-white/20 dark:border-white/[0.08]",
          "shadow-[-4px_0_24px_rgba(0,0,0,0.04)] dark:shadow-[-4px_0_28px_rgba(0,0,0,0.3)]"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between p-4",
          "border-b border-white/20 dark:border-white/[0.06]",
          "bg-white/40 dark:bg-white/[0.02]"
        )}>
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center",
              "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
            )}>
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-foreground">Note</span>
          </div>
          <div className="flex items-center gap-1">
            {/* Action buttons */}
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-7 px-2 text-xs gap-1 rounded-lg",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-white/40 dark:hover:bg-white/10"
              )}
            >
              <CheckSquare className="w-3 h-3" />
              Task
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={cn(
                "h-7 px-2 text-xs gap-1 rounded-lg",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-white/40 dark:hover:bg-white/10"
              )}
            >
              <ArrowRight className="w-3 h-3" />
              Move
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isEditing ? (
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className={cn(
                "min-h-[300px] text-sm resize-none",
                "bg-white/50 dark:bg-white/[0.04]",
                "border border-white/30 dark:border-white/10",
                "focus:ring-2 focus:ring-indigo-500/30"
              )}
              autoFocus
            />
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/90">
                {selectedNote.content}
              </pre>
            </div>
          )}
        </div>

        {/* Metadata Section */}
        <div className={cn(
          "px-4 py-3 border-t border-white/10 dark:border-white/[0.06]",
          "bg-white/30 dark:bg-white/[0.02]"
        )}>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>Created {format(new Date(selectedNote.created_at), 'MMM d, yyyy')}</span>
            </div>
            {selectedNote.updated_at !== selectedNote.created_at && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>Updated {formatDistanceToNow(new Date(selectedNote.updated_at), { addSuffix: true })}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Tag className="w-3 h-3" />
              <span>No tags</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={cn(
          "p-4 border-t border-white/10 dark:border-white/[0.06]",
          "bg-white/40 dark:bg-white/[0.02]"
        )}>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="flex-1 h-8 text-xs"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(selectedNote.content);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className={cn(
                    "flex-1 h-8 text-xs",
                    "bg-indigo-500 hover:bg-indigo-600 text-white"
                  )}
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
                  className={cn(
                    "flex-1 h-8 text-xs",
                    "bg-white/50 dark:bg-white/[0.04]",
                    "border-white/30 dark:border-white/10"
                  )}
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-3 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
