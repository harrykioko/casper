import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PipelineCompany } from '@/types/pipeline';
import { formatTaskDate } from '@/utils/dateUtils';
import { ExternalLink, Calendar, DollarSign, GripVertical, Star } from 'lucide-react';
import { usePipeline } from '@/hooks/usePipeline';
import { toast } from 'sonner';

interface PipelineCardProps {
  company: PipelineCompany;
  onClick: () => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}

const statusColors = {
  new: 'border-slate-400',
  active: 'border-emerald-400',
  passed: 'border-rose-400',
  to_share: 'border-amber-400',
  interesting: 'border-sky-400',
  pearls: 'border-purple-400',
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

export function PipelineCard({ company, onClick, isDragging, dragHandleProps }: PipelineCardProps) {
  const { updateCompany } = usePipeline();
  const statusBorderColor = statusColors[company.status as keyof typeof statusColors];
  const isTopOfMind = company.is_top_of_mind ?? false;

  const handleToggleTopOfMind = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateCompany(company.id, { is_top_of_mind: !isTopOfMind });
      toast.success(isTopOfMind ? 'Removed from Dashboard' : 'Pinned to Dashboard');
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  return (
    <div
      className={`bg-white/15 dark:bg-slate-800/30 backdrop-blur-lg rounded-2xl p-4 border-2 ${statusBorderColor} shadow-xl cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-2xl ${
        isDragging ? 'scale-90 opacity-80' : ''
      } ${isTopOfMind ? 'ring-2 ring-amber-400/50' : ''}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-2 flex-1 min-w-0">
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
          
          <h3 className="font-semibold text-lg truncate flex-1">{company.company_name}</h3>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          {/* Top of Mind Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 ${isTopOfMind ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-500'}`}
            onClick={handleToggleTopOfMind}
            title={isTopOfMind ? 'Remove from Dashboard' : 'Pin to Dashboard'}
          >
            <Star className={`h-3.5 w-3.5 ${isTopOfMind ? 'fill-current' : ''}`} />
          </Button>
          
          {company.website && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                window.open(company.website, '_blank');
              }}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Round Badge */}
      <Badge variant="secondary" className={`mb-3 ${roundColors[company.current_round]}`}>
        {company.current_round}
      </Badge>

      {/* Sector */}
      {company.sector && (
        <Badge variant="outline" className="mb-3 ml-2">
          {company.sector}
        </Badge>
      )}

      {/* Details */}
      <div className="space-y-2 text-sm text-muted-foreground">
        {company.raise_amount_usd && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-3 w-3" />
            <span>${company.raise_amount_usd.toLocaleString()}</span>
          </div>
        )}
        
        {company.close_date && (
          <div className="flex items-center gap-2">
            <Calendar className="h-3 w-3" />
            <span>{formatTaskDate(company.close_date) || company.close_date}</span>
          </div>
        )}
      </div>

      {/* Next Steps Preview */}
      {company.next_steps && (
        <p className="text-xs text-muted-foreground mt-3 line-clamp-2">
          {company.next_steps}
        </p>
      )}
    </div>
  );
}
