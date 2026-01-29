import { useState, useEffect, useCallback } from 'react';
import { FileText, ArrowRight, Plus, CheckSquare, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { GlassPanel, GlassPanelHeader, GlassSubcard } from '@/components/ui/glass-panel';
import { PipelineCompanyDetail, PipelineInteraction } from '@/types/pipelineExtended';
import { usePipeline } from '@/hooks/usePipeline';
import { PipelineAttachment } from '@/hooks/usePipelineAttachments';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PipelineTask {
  id: string;
  content: string;
  completed: boolean;
  scheduled_for?: string | null;
  priority?: string | null;
}

interface OverviewTabProps {
  company: PipelineCompanyDetail;
  tasks: PipelineTask[];
  interactions: PipelineInteraction[];
  attachments: PipelineAttachment[];
  onRefetch: () => void;
  onCreateTask: (content: string, options?: { scheduled_for?: string; priority?: string }) => Promise<any>;
  onViewAllTasks: () => void;
  onViewAllNotes: () => void;
  onViewAllFiles: () => void;
}

const interactionTypeLabels: Record<string, string> = {
  note: 'Note',
  call: 'Call',
  meeting: 'Meeting',
  update: 'Update',
  email: 'Email',
};

const interactionTypeBadgeColors: Record<string, string> = {
  note: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  call: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  meeting: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  update: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  email: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
};

export function OverviewTab({
  company,
  tasks,
  interactions,
  attachments,
  onRefetch,
  onCreateTask,
  onViewAllTasks,
  onViewAllNotes,
  onViewAllFiles,
}: OverviewTabProps) {
  const { updateCompany } = usePipeline();
  const [nextSteps, setNextSteps] = useState(company.next_steps || '');
  const [isSaving, setIsSaving] = useState(false);
  const [quickTaskInput, setQuickTaskInput] = useState('');

  // Reset local state when company changes
  useEffect(() => {
    setNextSteps(company.next_steps || '');
  }, [company.next_steps]);

  // Debounced autosave for next steps
  const saveNextSteps = useCallback(async (value: string) => {
    if (value === company.next_steps) return;
    
    setIsSaving(true);
    try {
      await updateCompany(company.id, { next_steps: value });
    } catch (err) {
      toast.error('Failed to save next steps');
    } finally {
      setIsSaving(false);
    }
  }, [company.id, company.next_steps, updateCompany]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (nextSteps !== company.next_steps) {
        saveNextSteps(nextSteps);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [nextSteps, company.next_steps, saveNextSteps]);

  const handleQuickAddTask = async () => {
    if (!quickTaskInput.trim()) return;
    await onCreateTask(quickTaskInput.trim());
    setQuickTaskInput('');
  };

  const openTasks = tasks.filter(t => !t.completed).slice(0, 5);
  const recentNotes = interactions
    .filter(i => ['note', 'call', 'meeting', 'update'].includes(i.interaction_type))
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Next Steps */}
      <GlassPanel>
        <GlassPanelHeader 
          title="Next Steps" 
          action={
            isSaving && (
              <span className="text-xs text-muted-foreground">Saving...</span>
            )
          }
        />
        <div className="p-4">
          <Textarea
            value={nextSteps}
            onChange={(e) => setNextSteps(e.target.value)}
            placeholder="Capture the next steps for this deal..."
            className="min-h-[100px] resize-none bg-muted/30 border-border/50 focus-visible:ring-1"
          />
        </div>
      </GlassPanel>

      {/* Open Tasks Preview */}
      <GlassPanel>
        <GlassPanelHeader 
          title="Open Tasks"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAllTasks}
              className="gap-1 text-xs"
            >
              View all
              <ArrowRight className="w-3 h-3" />
            </Button>
          }
        />
        <div className="p-4 space-y-3">
          {/* Quick add */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
              <Plus className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={quickTaskInput}
                onChange={(e) => setQuickTaskInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickAddTask()}
                placeholder="Add a task..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            {quickTaskInput && (
              <Button size="sm" onClick={handleQuickAddTask}>
                Add
              </Button>
            )}
          </div>

          {/* Task list */}
          {openTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No open tasks
            </p>
          ) : (
            <div className="space-y-2">
              {openTasks.map((task) => (
                <GlassSubcard key={task.id} className="flex items-start gap-3 p-3">
                  <CheckSquare className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">{task.content}</p>
                    {task.scheduled_for && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Due {format(new Date(task.scheduled_for), 'MMM d')}
                      </p>
                    )}
                  </div>
                </GlassSubcard>
              ))}
            </div>
          )}
        </div>
      </GlassPanel>

      {/* Recent Notes Preview */}
      <GlassPanel>
        <GlassPanelHeader 
          title="Recent Notes"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAllNotes}
              className="gap-1 text-xs"
            >
              View all
              <ArrowRight className="w-3 h-3" />
            </Button>
          }
        />
        <div className="p-4">
          {recentNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No notes yet
            </p>
          ) : (
            <div className="space-y-3">
              {recentNotes.map((note) => (
                <GlassSubcard key={note.id} className="p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-medium",
                      interactionTypeBadgeColors[note.interaction_type] || 'bg-muted text-muted-foreground'
                    )}>
                      {interactionTypeLabels[note.interaction_type] || note.interaction_type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(note.occurred_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <p className="text-sm text-foreground line-clamp-3">{note.content}</p>
                </GlassSubcard>
              ))}
            </div>
          )}
        </div>
      </GlassPanel>

      {/* Recent Files Preview */}
      <GlassPanel>
        <GlassPanelHeader 
          title="Recent Files"
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={onViewAllFiles}
              className="gap-1 text-xs"
            >
              View all
              <ArrowRight className="w-3 h-3" />
            </Button>
          }
        />
        <div className="p-4">
          {attachments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="w-10 h-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground mb-2">
                No files uploaded yet
              </p>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={onViewAllFiles}>
                <Plus className="w-4 h-4" />
                Upload File
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {attachments.slice(0, 3).map((attachment) => (
                <GlassSubcard key={attachment.id} className="flex items-center gap-3 p-3">
                  <File className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{attachment.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(attachment.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </GlassSubcard>
              ))}
            </div>
          )}
        </div>
      </GlassPanel>

      {/* Communications Preview */}
      <GlassPanel>
        <GlassPanelHeader title="Communications" />
        <div className="p-4">
          <p className="text-sm text-muted-foreground text-center py-4">
            Connect emails and meetings to see them here.
          </p>
        </div>
      </GlassPanel>
    </div>
  );
}
