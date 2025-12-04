export type CompanyKind = 'portfolio' | 'pipeline' | 'other';
export type CompanyStatus = 'active' | 'watching' | 'exited' | 'archived';
export type InteractionType = 'note' | 'call' | 'meeting' | 'email' | 'update';

export interface Company {
  id: string;
  name: string;
  website_url?: string | null;
  logo_url?: string | null;
  kind: CompanyKind;
  status: CompanyStatus;
  last_interaction_at?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyContact {
  id: string;
  company_id: string;
  name: string;
  email?: string | null;
  role?: string | null;
  is_founder: boolean;
  is_primary: boolean;
  created_by: string;
  created_at: string;
}

export interface CompanyInteraction {
  id: string;
  company_id: string;
  contact_id?: string | null;
  interaction_type: InteractionType;
  content: string;
  occurred_at: string;
  created_by: string;
  created_at: string;
  contact?: CompanyContact | null;
}

export interface TimelineEvent {
  id: string;
  type: 'interaction' | 'task_created' | 'task_completed';
  timestamp: string;
  title: string;
  description?: string;
  icon: InteractionType | 'task';
  metadata?: Record<string, unknown>;
}

export interface CompanyWithStats extends Company {
  open_task_count?: number;
  contacts?: CompanyContact[];
}

export interface FounderInput {
  id?: string;
  name: string;
  email?: string;
  role?: string;
  is_primary: boolean;
}
