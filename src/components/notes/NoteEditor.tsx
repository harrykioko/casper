import { useState, useCallback } from 'react';
import { Bold, Italic, List, Link as LinkIcon, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface NoteEditorProps {
  mode: 'create' | 'edit';
  initialValue?: {
    title?: string;
    content?: string;
    noteType?: string;
  };
  onSave: (payload: { title?: string; content: string; noteType?: string }) => Promise<void>;
  onCancel?: () => void;
  showTitle?: boolean;
  placeholder?: string;
  className?: string;
}

export function NoteEditor({
  mode,
  initialValue,
  onSave,
  onCancel,
  showTitle = true,
  placeholder = 'Write your note... (Markdown supported)',
  className,
}: NoteEditorProps) {
  const [title, setTitle] = useState(initialValue?.title || '');
  const [content, setContent] = useState(initialValue?.content || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim() || undefined,
        content: content.trim(),
      });
      if (mode === 'create') {
        setTitle('');
        setContent('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
  };

  // Insert markdown formatting at cursor
  const insertFormatting = useCallback((prefix: string, suffix: string = prefix) => {
    const textarea = document.querySelector('[data-note-content]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newContent = 
      content.substring(0, start) + 
      prefix + selectedText + suffix + 
      content.substring(end);
    
    setContent(newContent);
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + prefix.length + selectedText.length + suffix.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  }, [content]);

  return (
    <div className={cn(
      "flex flex-col gap-3 p-4 rounded-xl h-full",
      "bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl",
      "border border-white/20 dark:border-white/10",
      className
    )}>
      {showTitle && (
        <Input
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-sm bg-transparent border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary/30"
        />
      )}

      {/* Formatting toolbar */}
      <div className="flex items-center gap-1 border-b border-white/10 pb-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => insertFormatting('**')}
          title="Bold (⌘B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => insertFormatting('_')}
          title="Italic (⌘I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => insertFormatting('\n- ', '')}
          title="Bullet list"
        >
          <List className="w-3.5 h-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => insertFormatting('[', '](url)')}
          title="Insert link"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </Button>
      </div>

      <Textarea
        data-note-content
        placeholder={placeholder}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-1 min-h-[120px] text-sm resize-none bg-transparent border-white/20 dark:border-white/10 focus:ring-2 focus:ring-primary/30"
        autoFocus
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          ⌘+Enter to save, Esc to cancel
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              <X className="w-3.5 h-3.5 mr-1" />
              Cancel
            </Button>
          )}
          <Button
            size="sm"
            className="h-8 text-xs"
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
          >
            <Check className="w-3.5 h-3.5 mr-1" />
            {mode === 'create' ? 'Save Note' : 'Update'}
          </Button>
        </div>
      </div>
    </div>
  );
}
