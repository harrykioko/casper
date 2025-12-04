import { InteractionType } from './portfolio';
import { RoundEnum, SectorEnum, PipelineStatus } from './pipeline';

export interface PipelineContact {
  id: string;
  pipeline_company_id: string;
  name: string;
  email?: string | null;
  role?: string | null;
  is_founder: boolean;
  is_primary: boolean;
  created_by: string;
  created_at: string;
}

export interface PipelineInteraction {
  id: string;
  pipeline_company_id: string;
  contact_id?: string | null;
  interaction_type: InteractionType;
  content: string;
  occurred_at: string;
  created_by: string;
  created_at: string;
  contact?: PipelineContact | null;
}

export interface PipelineTimelineEvent {
  id: string;
  type: 'interaction' | 'task_created' | 'task_completed';
  timestamp: string;
  title: string;
  description?: string;
  icon: InteractionType | 'task';
  metadata?: Record<string, unknown>;
}

export interface PipelineCompanyDetail {
  id: string;
  company_name: string;
  current_round: RoundEnum;
  status: PipelineStatus;
  sector?: SectorEnum | null;
  raise_amount_usd?: number | null;
  close_date?: string | null;
  website?: string | null;
  next_steps?: string | null;
  logo_url?: string | null;
  is_top_of_mind: boolean;
  last_interaction_at?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface PipelineFounderInput {
  id?: string;
  name: string;
  email?: string;
  role?: string;
  is_primary: boolean;
}
