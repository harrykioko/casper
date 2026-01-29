import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PipelineCompany, PipelineStatus } from '@/types/pipeline';
import { PipelineCardAttention } from '@/lib/pipeline/pipelineAttentionHelpers';
import { formatTaskDate } from '@/utils/dateUtils';
import { 
  ExternalLink, Calendar, DollarSign, GripVertical, Star, 
  ArrowUpRight, MoreHorizontal, ClipboardList, MessageSquare,
  ArrowRight, CheckCircle2, AlertTriangle, Clock
} from 'lucide-react';
import { usePipeline } from '@/hooks/usePipeline';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface PipelineCardProps {
  company: PipelineCompany;
  onClick: () => void;
  isDragging?: boolean;
  dragHandleProps?: any;
  attention?: PipelineCardAttention;
  onAddTask?: () => void;
  onLogNote?: () => void;
}

const statusColors = {
  new: 'border-slate-300 dark:border-slate-500',
  active: 'border-emerald-300 dark:border-emerald-500',
  passed: 'border-rose-300 dark:border-rose-500',
  to_share: 'border-amber-300 dark:border-amber-500',
  interesting: 'border-sky-300 dark:border-sky-500',
  pearls: 'border-purple-300 dark:border-purple-500',
};

const roundColors = {
  'Seed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  'Series A': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'Series B': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  'Series C': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  'Series D': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  'Series E': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
  'Series F+': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
};

const stages: { key: PipelineStatus; label: string }[] = [
  { key: 'new', label: 'New' },
  { key: 'to_share', label: 'To Share' },
  { key: 'interesting', label: 'Interesting' },
  { key: 'pearls', label: 'Pearls' },
  { key: 'active', label: 'Active' },
  { key: 'passed', label: 'Passed' },
];

export function PipelineCard({ 
  company, 
  onClick, 
  isDragging, 
  dragHandleProps,
  attention,
  onAddTask,
  onLogNote,
}: PipelineCardProps) {
  const navigate = useNavigate();
  const { updateCompany } = usePipeline();
  const statusBorderColor = statusColors[company.status as keyof typeof statusColors];
  const isTopOfMind = company.is_top_of_mind ?? false;
  const [menuOpen, setMenuOpen] = useState(false);

  const handleToggleTopOfMind = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateCompany(company.id, { is_top_of_mind: !isTopOfMind });
      toast.success(isTopOfMind ? 'Removed from Dashboard' : 'Pinned to Dashboard');
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleOpenFullPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/pipeline/${company.id}`);
  };

  const handleMoveToStage = async (newStatus: PipelineStatus) => {
    if (newStatus === company.status) return;
    try {
      await updateCompany(company.id, { status: newStatus });
      toast.success(`Moved to ${stages.find(s => s.key === newStatus)?.label}`);
    } catch (error) {
      toast.error('Failed to move');
    }
  };

  const handleMarkAsPassed = async () => {
    try {
      await updateCompany(company.id, { status: 'passed' });
      toast.success('Marked as passed');
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  // Format days since touch
  const formatDaysAgo = (days: number | null) => {
    if (days === null) return null;
    if (days === 0) return 'Today';
    if (days === 1) return '1d ago';
    return `${days}d ago`;
  };

  return (
    <div
      className={`bg-white/15 dark:bg-slate-800/30 backdrop-blur-lg rounded-2xl p-3.5 border-2 ${statusBorderColor} shadow-xl cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl ${
        isDragging ? 'scale-90 opacity-80' : ''
      } ${isTopOfMind ? 'ring-2 ring-amber-400/50' : ''}`}
      onClick={onClick}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between mb-2.5">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Drag Handle */}
          {dragHandleProps && (
            <div 
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/10 rounded transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          
          {/* Company Logo */}
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={company.logo_url || undefined} alt={company.company_name} />
            <AvatarFallback className="bg-white/10 text-xs font-medium">
              {company.company_name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <h3 className="font-semibold text-base truncate flex-1">{company.company_name}</h3>
        </div>
        
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Top of Mind Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 ${isTopOfMind ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-500'}`}
            onClick={handleToggleTopOfMind}
            title={isTopOfMind ? 'Remove from Dashboard' : 'Pin to Dashboard'}
          >
            <Star className={`h-3.5 w-3.5 ${isTopOfMind ? 'fill-current' : ''}`} />
          </Button>
          
          {/* Open Full Page */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={handleOpenFullPage}
            title="Open deal room"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>

          {/* Website Link */}
          {company.website && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                window.open(company.website, '_blank');
              }}
              title="Open website"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}

          {/* Kebab Menu */}
          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              className="w-48 bg-popover border border-border z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem 
                onClick={() => {
                  onAddTask?.();
                  setMenuOpen(false);
                }}
              >
                <ClipboardList className="h-4 w-4 mr-2" />
                Add task
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  onLogNote?.();
                  setMenuOpen(false);
                }}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Log note
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Move to...
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-popover border border-border">
                  {stages
                    .filter(s => s.key !== company.status)
                    .map(stage => (
                      <DropdownMenuItem 
                        key={stage.key}
                        onClick={() => {
                          handleMoveToStage(stage.key);
                          setMenuOpen(false);
                        }}
                      >
                        {stage.label}
                      </DropdownMenuItem>
                    ))
                  }
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  handleMarkAsPassed();
                  setMenuOpen(false);
                }}
                className="text-rose-600 dark:text-rose-400"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark as passed
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Metadata Row */}
      <div className="flex flex-wrap gap-1.5 mb-2.5">
        <Badge variant="secondary" className={roundColors[company.current_round]}>
          {company.current_round}
        </Badge>
        {company.sector && (
          <Badge variant="outline" className="text-xs">
            {company.sector}
          </Badge>
        )}
      </div>

      {/* Deal Facts Row */}
      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-2">
        {company.raise_amount_usd && (
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-3 w-3" />
            <span>${company.raise_amount_usd.toLocaleString()}</span>
          </div>
        )}
        
        {company.close_date && (
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            <span>{formatTaskDate(company.close_date) || company.close_date}</span>
          </div>
        )}
      </div>

      {/* Next Steps Preview */}
      {company.next_steps && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
          {company.next_steps}
        </p>
      )}

      {/* Attention Row - Only render if there's something to show */}
      {attention && (attention.openTaskCount > 0 || attention.isStale || attention.hasOverdueTasks || attention.hasNextSteps || attention.daysSinceTouch !== null) && (
        <div className="flex flex-wrap items-center gap-2 pt-2 mt-2 border-t border-white/10 text-xs">
          {/* Overdue indicator */}
          {attention.hasOverdueTasks && (
            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-0 text-[10px] px-1.5 py-0.5">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Overdue
            </Badge>
          )}

          {/* Stale badge */}
          {attention.isStale && !attention.hasOverdueTasks && (
            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-[10px] px-1.5 py-0.5">
              <Clock className="h-3 w-3 mr-1" />
              Stale
            </Badge>
          )}

          {/* Task count */}
          {attention.openTaskCount > 0 && (
            <span className="text-muted-foreground flex items-center gap-1">
              <ClipboardList className="h-3 w-3" />
              {attention.openTaskCount} task{attention.openTaskCount !== 1 ? 's' : ''}
            </span>
          )}

          {/* Last touch */}
          {attention.daysSinceTouch !== null && !attention.isStale && (
            <span className="text-muted-foreground">
              {formatDaysAgo(attention.daysSinceTouch)}
            </span>
          )}

          {/* Next steps indicator */}
          {attention.hasNextSteps && !attention.isStale && !attention.hasOverdueTasks && attention.openTaskCount === 0 && (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Next step set
            </span>
          )}
        </div>
      )}
    </div>
  );
}
