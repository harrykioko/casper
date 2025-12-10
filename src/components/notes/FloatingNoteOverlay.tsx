import { useState, useEffect, useRef, useCallback } from 'react';
import { X, GripHorizontal, StickyNote, Briefcase, FolderKanban, BookOpen, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NoteEditor } from './NoteEditor';
import { createNote } from '@/hooks/useNotes';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { NoteTargetType } from '@/types/notes';
import type { FloatingNoteContextTarget, FloatingNoteInitialData } from '@/contexts/FloatingNoteContext';

interface FloatingNoteOverlayProps {
  target?: FloatingNoteContextTarget;
  initialData?: FloatingNoteInitialData;
  onClose: () => void;
}

const STORAGE_KEY = 'casper:floating-note:layout';

interface WindowLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

const DEFAULT_LAYOUT: WindowLayout = {
  x: window.innerWidth - 600,
  y: 100,
  width: 520,
  height: 400,
};

const MIN_WIDTH = 360;
const MIN_HEIGHT = 280;
const MAX_WIDTH = 800;
const MAX_HEIGHT = 700;

function getStoredLayout(): WindowLayout {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate the stored values
      if (
        typeof parsed.x === 'number' &&
        typeof parsed.y === 'number' &&
        typeof parsed.width === 'number' &&
        typeof parsed.height === 'number'
      ) {
        // Ensure window is within viewport
        return {
          x: Math.max(0, Math.min(parsed.x, window.innerWidth - 200)),
          y: Math.max(0, Math.min(parsed.y, window.innerHeight - 100)),
          width: Math.max(MIN_WIDTH, Math.min(parsed.width, MAX_WIDTH)),
          height: Math.max(MIN_HEIGHT, Math.min(parsed.height, MAX_HEIGHT)),
        };
      }
    }
  } catch {
    // Ignore parse errors
  }
  return { ...DEFAULT_LAYOUT, x: window.innerWidth - 600 };
}

function saveLayout(layout: WindowLayout) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // Ignore storage errors
  }
}

function getTargetIcon(targetType?: NoteTargetType) {
  switch (targetType) {
    case 'task':
      return <CheckSquare className="w-4 h-4" />;
    case 'company':
      return <Briefcase className="w-4 h-4" />;
    case 'project':
      return <FolderKanban className="w-4 h-4" />;
    case 'reading_item':
      return <BookOpen className="w-4 h-4" />;
    default:
      return <StickyNote className="w-4 h-4" />;
  }
}

function getTargetLabel(target?: FloatingNoteContextTarget): string {
  if (!target?.targetType) return 'Scratch note';
  
  const typeLabels: Record<NoteTargetType, string> = {
    task: 'Task',
    company: 'Company',
    project: 'Project',
    reading_item: 'Reading Item',
  };
  
  const label = typeLabels[target.targetType] || 'Note';
  return target.entityName ? `${label}: ${target.entityName}` : `Note for ${label}`;
}

export function FloatingNoteOverlay({ target, initialData, onClose }: FloatingNoteOverlayProps) {
  const [layout, setLayout] = useState<WindowLayout>(getStoredLayout);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; windowX: number; windowY: number } | null>(null);
  const resizeStartRef = useRef<{ mouseX: number; mouseY: number; width: number; height: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Drag handlers
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      windowX: layout.x,
      windowY: layout.y,
    };
  }, [layout.x, layout.y]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      
      const deltaX = e.clientX - dragStartRef.current.mouseX;
      const deltaY = e.clientY - dragStartRef.current.mouseY;
      
      const newX = Math.max(0, Math.min(
        dragStartRef.current.windowX + deltaX,
        window.innerWidth - 200
      ));
      const newY = Math.max(0, Math.min(
        dragStartRef.current.windowY + deltaY,
        window.innerHeight - 100
      ));
      
      setLayout(prev => ({ ...prev, x: newX, y: newY }));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      setLayout(prev => {
        saveLayout(prev);
        return prev;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      width: layout.width,
      height: layout.height,
    };
  }, [layout.width, layout.height]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeStartRef.current) return;
      
      const deltaX = e.clientX - resizeStartRef.current.mouseX;
      const deltaY = e.clientY - resizeStartRef.current.mouseY;
      
      const newWidth = Math.max(MIN_WIDTH, Math.min(
        resizeStartRef.current.width + deltaX,
        MAX_WIDTH
      ));
      const newHeight = Math.max(MIN_HEIGHT, Math.min(
        resizeStartRef.current.height + deltaY,
        MAX_HEIGHT
      ));
      
      setLayout(prev => ({ ...prev, width: newWidth, height: newHeight }));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
      setLayout(prev => {
        saveLayout(prev);
        return prev;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Handle save
  const handleSave = async (payload: { title?: string; content: string; noteType?: string }) => {
    if (target?.targetType && target?.targetId) {
      // Create note with target context
      const result = await createNote({
        title: payload.title,
        content: payload.content,
        noteType: payload.noteType,
        primaryContext: {
          targetType: target.targetType,
          targetId: target.targetId,
        },
        secondaryContexts: [],
      });
      
      if (result) {
        onClose();
      }
    } else {
      // Create scratch note (no links)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to create notes');
        return;
      }

      try {
        const { error } = await supabase
          .from('project_notes')
          .insert({
            title: payload.title || null,
            content: payload.content,
            note_type: payload.noteType || null,
            project_id: null,
            created_by: user.id,
          });

        if (error) throw error;

        toast.success('Note saved');
        onClose();
      } catch (err) {
        console.error('Error creating scratch note:', err);
        toast.error('Failed to save note');
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed z-[9999] flex flex-col rounded-2xl overflow-hidden shadow-2xl"
      style={{
        left: layout.x,
        top: layout.y,
        width: layout.width,
        height: layout.height,
      }}
    >
      {/* Glassmorphic background */}
      <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/30 dark:border-zinc-700/50 rounded-2xl" />
      
      {/* Content container */}
      <div className="relative flex flex-col h-full">
        {/* Header - drag handle */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-white/20 dark:border-zinc-700/40 cursor-move select-none"
          onMouseDown={handleDragStart}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <GripHorizontal className="w-4 h-4 text-muted-foreground" />
            {getTargetIcon(target?.targetType)}
            <span className="truncate max-w-[300px]">{getTargetLabel(target)}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Body - Note Editor */}
        <div className="flex-1 overflow-auto p-4">
          <NoteEditor
            mode="create"
            initialValue={{
              title: initialData?.initialTitle,
              content: initialData?.initialContent,
              noteType: initialData?.initialNoteType,
            }}
            onSave={handleSave}
            onCancel={onClose}
            showTitle={true}
            placeholder="Write your note... (Markdown supported)"
            className="h-full bg-transparent border-0 p-0"
          />
        </div>

        {/* Resize handle */}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeStart}
        >
          <svg
            className="w-full h-full text-muted-foreground/40"
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M14 14v-2h2v2h-2zm0-4v-2h2v2h-2zm-4 4v-2h2v2h-2zm0-4v-2h2v2h-2zm-4 4v-2h2v2h-2z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
