import { 
  CheckSquare, 
  Mail, 
  Calendar, 
  Building2,
  AlertTriangle,
  Clock,
  AlertCircle,
  Flag,
  ArrowUpDown
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PrioritySourceType, PriorityIconType } from "@/types/priority";

type SourceFilter = "all" | PrioritySourceType;
type UrgencyFilter = "all" | PriorityIconType;
type SortOption = "score" | "due" | "recency";

interface PriorityFiltersProps {
  sourceFilter: SourceFilter;
  setSourceFilter: (value: SourceFilter) => void;
  urgencyFilter: UrgencyFilter;
  setUrgencyFilter: (value: UrgencyFilter) => void;
  sortBy: SortOption;
  setSortBy: (value: SortOption) => void;
  availableSourceTypes: PrioritySourceType[];
  availableIconTypes: PriorityIconType[];
}

const sourceTypeLabels: Record<PrioritySourceType, { label: string; icon: typeof CheckSquare }> = {
  task: { label: "Tasks", icon: CheckSquare },
  inbox: { label: "Inbox", icon: Mail },
  calendar_event: { label: "Calendar", icon: Calendar },
  portfolio_company: { label: "Portfolio", icon: Building2 },
  pipeline_company: { label: "Pipeline", icon: Building2 },
  reading_item: { label: "Reading", icon: CheckSquare },
  nonnegotiable: { label: "Habits", icon: CheckSquare },
  project: { label: "Projects", icon: Building2 },
};

const iconTypeLabels: Record<PriorityIconType, { label: string; icon: typeof AlertTriangle }> = {
  overdue: { label: "Overdue", icon: AlertTriangle },
  "due-today": { label: "Due Today", icon: Clock },
  "due-soon": { label: "Due Soon", icon: Clock },
  "stale-company": { label: "Needs Attention", icon: AlertCircle },
  "unread-email": { label: "Unread Email", icon: Mail },
  "upcoming-event": { label: "Upcoming Event", icon: Calendar },
  "unread-reading": { label: "Unread Reading", icon: CheckSquare },
  nonnegotiable: { label: "Habit", icon: CheckSquare },
  "high-importance": { label: "High Priority", icon: Flag },
};

export function PriorityFilters({
  sourceFilter,
  setSourceFilter,
  urgencyFilter,
  setUrgencyFilter,
  sortBy,
  setSortBy,
  availableSourceTypes,
  availableIconTypes,
}: PriorityFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 pb-2">
      {/* Source Type Filter */}
      <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v as SourceFilter)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Source type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sources</SelectItem>
          {availableSourceTypes.map((type) => {
            const config = sourceTypeLabels[type];
            return (
              <SelectItem key={type} value={type}>
                <div className="flex items-center gap-2">
                  <config.icon className="h-4 w-4" />
                  {config.label}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Urgency/Icon Type Filter */}
      <Select value={urgencyFilter} onValueChange={(v) => setUrgencyFilter(v as UrgencyFilter)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Urgency" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Urgency Levels</SelectItem>
          {availableIconTypes.map((type) => {
            const config = iconTypeLabels[type];
            if (!config) return null;
            return (
              <SelectItem key={type} value={type}>
                <div className="flex items-center gap-2">
                  <config.icon className="h-4 w-4" />
                  {config.label}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Sort By */}
      <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
        <SelectTrigger className="w-[160px]">
          <ArrowUpDown className="h-4 w-4 mr-2" />
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="score">Priority Score</SelectItem>
          <SelectItem value="due">Due Date</SelectItem>
          <SelectItem value="recency">Most Recent</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
