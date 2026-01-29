import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PipelineCompany, PipelineStatus } from '@/types/pipeline';
import { PipelineCardAttention } from '@/lib/pipeline/pipelineAttentionHelpers';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ExternalLink, Star, ArrowUpRight, MoreHorizontal, ClipboardList,
  MessageSquare, ArrowRight, CheckCircle2, AlertTriangle, Clock
} from 'lucide-react';
import { formatTaskDate } from '@/utils/dateUtils';
import { ScrollArea } from '@/components/ui/scroll-area';
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

interface PipelineListViewProps {
  companies: PipelineCompany[];
  onCardClick: (company: PipelineCompany) => void;
  attentionMap?: Map<string, PipelineCardAttention>;
  onAddTask?: (company: PipelineCompany) => void;
  onLogNote?: (company: PipelineCompany) => void;
}

const statusColors = {
  new: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  passed: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300',
  to_share: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  interesting: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300',
  pearls: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
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

export function PipelineListView({ 
  companies, 
  onCardClick,
  attentionMap,
  onAddTask,
  onLogNote,
}: PipelineListViewProps) {
  const navigate = useNavigate();
  const { updateCompany } = usePipeline();

  const handleToggleTopOfMind = async (company: PipelineCompany, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateCompany(company.id, { is_top_of_mind: !company.is_top_of_mind });
      toast.success(company.is_top_of_mind ? 'Removed from Dashboard' : 'Pinned to Dashboard');
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  const handleMoveToStage = async (company: PipelineCompany, newStatus: PipelineStatus) => {
    if (newStatus === company.status) return;
    try {
      await updateCompany(company.id, { status: newStatus });
      toast.success(`Moved to ${stages.find(s => s.key === newStatus)?.label}`);
    } catch (error) {
      toast.error('Failed to move');
    }
  };

  const formatDaysAgo = (days: number | null) => {
    if (days === null) return '—';
    if (days === 0) return 'Today';
    if (days === 1) return '1d ago';
    return `${days}d ago`;
  };

  return (
    <div className="p-6">
      <div className="bg-white/10 dark:bg-slate-800/30 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-muted/20 h-12">
                <TableHead className="font-semibold text-sm tracking-wide text-foreground/80 py-4">Company</TableHead>
                <TableHead className="font-semibold text-sm tracking-wide text-foreground/80 py-4">Round</TableHead>
                <TableHead className="font-semibold text-sm tracking-wide text-foreground/80 py-4">Status</TableHead>
                <TableHead className="font-semibold text-sm tracking-wide text-foreground/80 py-4">Sector</TableHead>
                <TableHead className="font-semibold text-sm tracking-wide text-foreground/80 py-4">Raise</TableHead>
                <TableHead className="font-semibold text-sm tracking-wide text-foreground/80 py-4">Close</TableHead>
                <TableHead className="font-semibold text-sm tracking-wide text-foreground/80 py-4">Tasks</TableHead>
                <TableHead className="font-semibold text-sm tracking-wide text-foreground/80 py-4">Last Touch</TableHead>
                <TableHead className="font-semibold text-sm tracking-wide text-foreground/80 py-4">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground text-base">
                    No companies found
                  </TableCell>
                </TableRow>
              ) : (
                companies.map((company) => {
                  const attention = attentionMap?.get(company.id);
                  const isTopOfMind = company.is_top_of_mind ?? false;
                  
                  return (
                    <TableRow 
                      key={company.id} 
                      className="cursor-pointer hover:bg-muted/8 dark:hover:bg-white/8 border-b border-muted/10 dark:border-white/10 transition-colors duration-150 h-16"
                      onClick={() => onCardClick(company)}
                    >
                      <TableCell className="font-medium text-base py-4 align-middle">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarImage src={company.logo_url || undefined} alt={company.company_name} />
                            <AvatarFallback className="bg-muted text-xs font-medium">
                              {company.company_name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>{company.company_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 align-middle">
                        <Badge variant="secondary" className={roundColors[company.current_round]}>
                          {company.current_round}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 align-middle">
                        <Badge variant="secondary" className={statusColors[company.status as keyof typeof statusColors]}>
                          {company.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 align-middle">
                        {company.sector && (
                          <Badge variant="outline">{company.sector}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="py-4 align-middle text-sm">
                        {company.raise_amount_usd && (
                          <span>${company.raise_amount_usd.toLocaleString()}</span>
                        )}
                      </TableCell>
                      <TableCell className="py-4 align-middle text-sm">
                        {company.close_date && (
                          <span>{formatTaskDate(company.close_date) || company.close_date}</span>
                        )}
                      </TableCell>
                      {/* Tasks Column */}
                      <TableCell className="py-4 align-middle">
                        {attention && (
                          <div className="flex items-center gap-1.5">
                            {attention.hasOverdueTasks && (
                              <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                            )}
                            {attention.openTaskCount > 0 ? (
                              <span className={attention.hasOverdueTasks ? 'text-red-500' : 'text-muted-foreground'}>
                                {attention.openTaskCount}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/50">—</span>
                            )}
                          </div>
                        )}
                      </TableCell>
                      {/* Last Touch Column */}
                      <TableCell className="py-4 align-middle">
                        {attention && (
                          <span className={attention.isStale ? 'text-amber-500 flex items-center gap-1' : 'text-muted-foreground'}>
                            {attention.isStale && <Clock className="h-3 w-3" />}
                            {formatDaysAgo(attention.daysSinceTouch)}
                          </span>
                        )}
                      </TableCell>
                      {/* Actions Column */}
                      <TableCell className="py-4 align-middle">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-7 w-7 ${isTopOfMind ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-500'}`}
                            onClick={(e) => handleToggleTopOfMind(company, e)}
                            title={isTopOfMind ? 'Remove from Dashboard' : 'Pin to Dashboard'}
                          >
                            <Star className={`h-3.5 w-3.5 ${isTopOfMind ? 'fill-current' : ''}`} />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/pipeline/${company.id}`);
                            }}
                            title="Open deal room"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Button>

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

                          <DropdownMenu>
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
                              <DropdownMenuItem onClick={() => onAddTask?.(company)}>
                                <ClipboardList className="h-4 w-4 mr-2" />
                                Add task
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onLogNote?.(company)}>
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
                                        onClick={() => handleMoveToStage(company, stage.key)}
                                      >
                                        {stage.label}
                                      </DropdownMenuItem>
                                    ))
                                  }
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={async () => {
                                  await handleMoveToStage(company, 'passed');
                                }}
                                className="text-rose-600 dark:text-rose-400"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Mark as passed
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}
