export type RoundEnum =
  | 'Seed'
  | 'Series A'
  | 'Series B'
  | 'Series C'
  | 'Series D'
  | 'Series E'
  | 'Series F+';

export type SectorEnum =
  | 'Lending'
  | 'Payments'
  | 'DevOps'
  | 'Sales Enablement'
  | 'Wealth'
  | 'Real Estate'
  | 'Consumer'
  | 'Capital Markets'
  | 'Blockchain';

export type PipelineStatus = 'new' | 'active' | 'passed' | 'to_share' | 'interesting' | 'pearls';

export interface PipelineCompany {
  id: string;
  company_name: string;
  current_round: RoundEnum;
  status: PipelineStatus;
  sector?: SectorEnum;
  raise_amount_usd?: number;
  close_date?: string;
  website?: string;
  next_steps?: string;
  logo_url?: string;
  is_top_of_mind?: boolean;
  last_interaction_at?: string | null;
  primary_domain?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PipelineStats {
  total: number;
  active: number;
  passed: number;
  to_share: number;
  interesting: number;
  pearls: number;
  new: number;
}

export type PipelineViewMode = 'kanban' | 'list' | 'grid';

export interface PipelineFilters {
  search: string;
  rounds: RoundEnum[];
  sectors: SectorEnum[];
  // Attention-based toggle filters
  needsAttention?: boolean;
  topOfMindOnly?: boolean;
  staleOnly?: boolean;
}

// Attention signals for a pipeline company card
export interface PipelineCardAttention {
  isStale: boolean;
  daysSinceTouch: number | null;
  hasOverdueTasks: boolean;
  openTaskCount: number;
  hasNextSteps: boolean;
  isClosingSoon: boolean;
  needsAttention: boolean;
}

// Pipeline company with computed attention signals
export interface EnhancedPipelineCompany extends PipelineCompany {
  attention: PipelineCardAttention;
}

// Column summary for Kanban headers
export interface ColumnSummary {
  staleCount: number;
  openTaskCount: number;
  closingSoonCount: number;
  overdueCount: number;
  summaryText: string;
}