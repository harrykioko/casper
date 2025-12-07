import { CompanyAttentionState } from '@/types/attention';
import { CompanyAttentionTile } from './CompanyAttentionTile';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttentionTileHoverCardProps {
  company: CompanyAttentionState;
  onClick: (company: CompanyAttentionState) => void;
  onCreateTask?: (company: CompanyAttentionState) => void;
}

const statusLabels: Record<string, string> = {
  red: 'Needs attention',
  yellow: 'Monitor',
  green: 'On track',
};

const statusColors: Record<string, string> = {
  red: 'text-red-500',
  yellow: 'text-amber-500',
  green: 'text-emerald-500',
};

export function AttentionTileHoverCard({ company, onClick, onCreateTask }: AttentionTileHoverCardProps) {
  const topSignals = company.signals.slice(0, 2);

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div>
          <CompanyAttentionTile company={company} onClick={onClick} />
        </div>
      </HoverCardTrigger>
      <HoverCardContent 
        side="top" 
        align="center"
        className="w-64 p-3 backdrop-blur-xl bg-popover/95 border-border/50"
      >
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-sm text-foreground truncate">
                {company.name}
              </h4>
              <p className={cn("text-xs font-medium", statusColors[company.status])}>
                {statusLabels[company.status]}
              </p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Score: {company.score.toFixed(1)}
            </span>
          </div>

          {/* Signals */}
          {topSignals.length > 0 && (
            <div className="space-y-1">
              {topSignals.map((signal, i) => (
                <p key={i} className="text-xs text-muted-foreground leading-relaxed">
                  • {signal.description}
                </p>
              ))}
            </div>
          )}

          {/* Quick actions */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 h-7 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onClick(company);
              }}
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              Log
            </Button>
            {onCreateTask && (
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 h-7 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateTask(company);
                }}
              >
                <Plus className="w-3 h-3 mr-1" />
                Task
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="h-7 px-2"
              onClick={(e) => {
                e.stopPropagation();
                onClick(company);
              }}
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
