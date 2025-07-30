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
}