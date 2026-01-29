import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ExternalLink, 
  Star, 
  Plus, 
  FileText, 
  Upload, 
  Phone, 
  Mail, 
  Pencil,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PipelineCompanyDetail } from '@/types/pipelineExtended';
import { usePipeline } from '@/hooks/usePipeline';
import { format, formatDistanceToNow } from 'date-fns';
import { useState } from 'react';
import { usePipelineTasks } from '@/hooks/usePipelineTasks';
import { usePipelineInteractions } from '@/hooks/usePipelineInteractions';

interface DealRoomHeroProps {
  company: PipelineCompanyDetail;
  onOpenEdit: () => void;
  onRefetch: () => void;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  passed: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
  to_share: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  interesting: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  pearls: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
};

function formatRaise(amount?: number | null): string {
  if (!amount) return '';
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount}`;
}

export function DealRoomHero({ company, onOpenEdit, onRefetch }: DealRoomHeroProps) {
  const { updateCompany } = usePipeline();
  const { createTask } = usePipelineTasks(company.id);
  const { createInteraction } = usePipelineInteractions(company.id);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [taskInput, setTaskInput] = useState('');
  const [noteInput, setNoteInput] = useState('');

  const handleToggleTopOfMind = async () => {
    await updateCompany(company.id, { is_top_of_mind: !company.is_top_of_mind });
    onRefetch();
  };

  const handleQuickAddTask = async () => {
    if (!taskInput.trim()) return;
    await createTask(taskInput.trim());
    setTaskInput('');
    setShowAddTask(false);
  };

  const handleQuickAddNote = async () => {
    if (!noteInput.trim()) return;
    await createInteraction({ 
      interaction_type: 'note', 
      content: noteInput.trim() 
    });
    setNoteInput('');
    setShowAddNote(false);
  };

  const lastTouch = company.last_interaction_at 
    ? formatDistanceToNow(new Date(company.last_interaction_at), { addSuffix: true })
    : null;

  return (
    <div className="px-6 py-4">
      <div className="max-w-[1800px] mx-auto">
        {/* Top row: Back link */}
        <Link 
          to="/pipeline" 
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Pipeline
        </Link>

        {/* Main hero row */}
        <div className="flex items-start justify-between gap-6">
          {/* Left: Logo + Info */}
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div className="w-14 h-14 rounded-xl bg-card border border-border flex items-center justify-center overflow-hidden p-2 flex-shrink-0 shadow-sm">
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.company_name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <span className="text-xl font-semibold text-muted-foreground">
                  {company.company_name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="space-y-1.5">
              {/* Name + Status + Star */}
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-foreground">
                  {company.company_name}
                </h1>
                <Badge 
                  variant="outline" 
                  className={`text-xs px-2.5 py-0.5 rounded-full capitalize ${statusColors[company.status] || ''}`}
                >
                  {company.status.replace('_', ' ')}
                </Badge>
                <button
                  onClick={handleToggleTopOfMind}
                  className="p-1 rounded hover:bg-muted/50 transition-colors"
                  title={company.is_top_of_mind ? 'Remove from focus' : 'Add to focus'}
                >
                  <Star 
                    className={`w-5 h-5 ${
                      company.is_top_of_mind 
                        ? 'text-amber-500 fill-amber-500' 
                        : 'text-muted-foreground'
                    }`} 
                  />
                </button>
              </div>

              {/* Metadata row */}
              <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                <span className="font-medium">{company.current_round}</span>
                
                {company.sector && (
                  <>
                    <span className="text-border">•</span>
                    <span>{company.sector}</span>
                  </>
                )}
                
                {company.raise_amount_usd && (
                  <>
                    <span className="text-border">•</span>
                    <span>{formatRaise(company.raise_amount_usd)}</span>
                  </>
                )}
                
                {company.close_date && (
                  <>
                    <span className="text-border">•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(company.close_date), 'MMM yyyy')}
                    </span>
                  </>
                )}
                
                {company.website && (
                  <>
                    <span className="text-border">•</span>
                    <a
                      href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Website
                    </a>
                  </>
                )}
                
                {lastTouch && (
                  <>
                    <span className="text-border">•</span>
                    <span className="text-muted-foreground/70">
                      Last touch {lastTouch}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Primary actions */}
            <Button 
              size="sm" 
              onClick={() => setShowAddTask(true)}
              className="gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setShowAddNote(true)}
              className="gap-1.5"
            >
              <FileText className="w-4 h-4" />
              Add Note
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              className="gap-1.5"
            >
              <Upload className="w-4 h-4" />
              Upload File
            </Button>

            {/* Secondary icon buttons */}
            <div className="h-6 w-px bg-border mx-1" />
            
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8"
              title="Log Call"
            >
              <Phone className="w-4 h-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8"
              title="Draft Email"
            >
              <Mail className="w-4 h-4" />
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8"
              onClick={onOpenEdit}
              title="Edit Company"
            >
              <Pencil className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Inline Quick Add Task */}
        {showAddTask && (
          <div className="mt-4 flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border">
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickAddTask()}
              placeholder="What needs to be done?"
              className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
            <Button size="sm" onClick={handleQuickAddTask} disabled={!taskInput.trim()}>
              Add
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAddTask(false)}>
              Cancel
            </Button>
          </div>
        )}

        {/* Inline Quick Add Note */}
        {showAddNote && (
          <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border space-y-2">
            <textarea
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Add a note, call summary, or update..."
              className="w-full bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground resize-none min-h-[80px]"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowAddNote(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleQuickAddNote} disabled={!noteInput.trim()}>
                Save Note
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
