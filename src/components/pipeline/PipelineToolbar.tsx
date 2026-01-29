import { Search, LayoutGrid, List, Kanban, AlertCircle, Star, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Toggle } from '@/components/ui/toggle';
import { PipelineViewMode, PipelineFilters, RoundEnum, SectorEnum } from '@/types/pipeline';
import { cn } from '@/lib/utils';

interface PipelineToolbarProps {
  filters: PipelineFilters;
  onFiltersChange: (filters: PipelineFilters) => void;
  viewMode: PipelineViewMode;
  onViewModeChange: (mode: PipelineViewMode) => void;
}

const rounds: RoundEnum[] = ['Seed', 'Series A', 'Series B', 'Series C', 'Series D', 'Series E', 'Series F+'];
const sectors: SectorEnum[] = [
  'Lending', 'Payments', 'DevOps', 'Sales Enablement', 'Wealth', 
  'Real Estate', 'Consumer', 'Capital Markets', 'Blockchain'
];

export function PipelineToolbar({ filters, onFiltersChange, viewMode, onViewModeChange }: PipelineToolbarProps) {
  return (
    <div className="flex flex-wrap gap-4 items-center sticky top-24 z-20 
                    bg-background/80 backdrop-blur rounded-xl px-4 py-3 w-full
                    border border-white/20 shadow-lg">
      <div className="flex items-center gap-3 flex-1">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>

        {/* Round Filter */}
        <Select
          value={filters.rounds[0] || ''}
          onValueChange={(value) => 
            onFiltersChange({ 
              ...filters, 
              rounds: value && value !== 'all' ? [value as RoundEnum] : [] 
            })
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Round" />
          </SelectTrigger>
          <SelectContent className="bg-popover border border-border">
            <SelectItem value="all">All Rounds</SelectItem>
            {rounds.map(round => (
              <SelectItem key={round} value={round}>{round}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sector Filter */}
        <Select
          value={filters.sectors[0] || ''}
          onValueChange={(value) => 
            onFiltersChange({ 
              ...filters, 
              sectors: value && value !== 'all' ? [value as SectorEnum] : [] 
            })
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sector" />
          </SelectTrigger>
          <SelectContent className="bg-popover border border-border">
            <SelectItem value="all">All Sectors</SelectItem>
            {sectors.map(sector => (
              <SelectItem key={sector} value={sector}>{sector}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Toggle-style Attention Filters */}
      <div className="flex items-center gap-2">
        <Toggle
          pressed={filters.needsAttention}
          onPressedChange={(pressed) => 
            onFiltersChange({ ...filters, needsAttention: pressed })
          }
          className={cn(
            "gap-1.5 px-3 h-9 text-sm",
            filters.needsAttention && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          )}
        >
          <AlertCircle className="h-3.5 w-3.5" />
          Needs Attention
        </Toggle>

        <Toggle
          pressed={filters.topOfMindOnly}
          onPressedChange={(pressed) => 
            onFiltersChange({ ...filters, topOfMindOnly: pressed })
          }
          className={cn(
            "gap-1.5 px-3 h-9 text-sm",
            filters.topOfMindOnly && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          )}
        >
          <Star className="h-3.5 w-3.5" />
          Top of Mind
        </Toggle>

        <Toggle
          pressed={filters.staleOnly}
          onPressedChange={(pressed) => 
            onFiltersChange({ ...filters, staleOnly: pressed })
          }
          className={cn(
            "gap-1.5 px-3 h-9 text-sm",
            filters.staleOnly && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          Stale
        </Toggle>
      </div>

      {/* View Mode Toggle */}
      <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && onViewModeChange(value as PipelineViewMode)}>
        <ToggleGroupItem value="kanban" aria-label="Kanban view">
          <Kanban className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="list" aria-label="List view">
          <List className="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="grid" aria-label="Grid view">
          <LayoutGrid className="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
