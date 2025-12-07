export type AttentionStatus = 'red' | 'yellow' | 'green';

export interface AttentionSignal {
  source: 'tasks' | 'interactions' | 'inbox' | 'calendar' | 'manual' | string;
  weight: number;
  description: string;
  timestamp: string;
}

export interface CompanyAttentionState {
  companyId: string;
  entityType: 'portfolio' | 'pipeline';
  name: string;
  logoUrl: string | null;
  
  // Pipeline-specific display data
  pipelineStatus?: string;
  
  // Attention engine output
  status: AttentionStatus;
  score: number;
  signals: AttentionSignal[];
}
