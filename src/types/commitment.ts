/**
 * Commitment Types
 *
 * Represents promises made to others - the #1 source of things slipping through cracks.
 */

export type CommitmentStatus = 'open' | 'completed' | 'broken' | 'delegated' | 'cancelled';
export type CommitmentSource = 'call' | 'email' | 'meeting' | 'message' | 'manual';
export type ImpliedUrgency = 'asap' | 'today' | 'this_week' | 'next_week' | 'this_month' | 'when_possible';

export interface Commitment {
  id: string;

  // What was promised
  content: string;
  context?: string;

  // To whom
  personId?: string;
  personName?: string;

  // Related company
  companyId?: string;
  companyType?: 'portfolio' | 'pipeline';
  companyName?: string;

  // When
  promisedAt: string;
  dueAt?: string;
  impliedUrgency?: ImpliedUrgency;

  // Source
  sourceType: CommitmentSource;
  sourceId?: string;
  sourceReference?: string;

  // Status
  status: CommitmentStatus;
  completedAt?: string;
  completedVia?: string;
  completionNotes?: string;

  // Delegation
  delegatedToPersonId?: string;
  delegatedToName?: string;
  delegatedAt?: string;

  // Snooze tracking
  snoozedUntil?: string;
  snoozeCount: number;
  lastSnoozedAt?: string;

  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommitmentInsert {
  content: string;
  context?: string;
  personId?: string;
  personName?: string;
  companyId?: string;
  companyType?: 'portfolio' | 'pipeline';
  companyName?: string;
  promisedAt?: string;
  dueAt?: string;
  impliedUrgency?: ImpliedUrgency;
  sourceType?: CommitmentSource;
  sourceId?: string;
  sourceReference?: string;
}

export interface CommitmentUpdate {
  content?: string;
  context?: string;
  personId?: string;
  personName?: string;
  companyId?: string;
  companyType?: 'portfolio' | 'pipeline';
  companyName?: string;
  dueAt?: string | null;
  impliedUrgency?: ImpliedUrgency | null;
  status?: CommitmentStatus;
  completedVia?: string;
  completionNotes?: string;
  delegatedToPersonId?: string;
  delegatedToName?: string;
  snoozedUntil?: string | null;
}

/**
 * Transform database row to frontend type
 */
export function transformCommitment(row: any): Commitment {
  return {
    id: row.id,
    content: row.content,
    context: row.context,
    personId: row.person_id,
    personName: row.person_name,
    companyId: row.company_id,
    companyType: row.company_type,
    companyName: row.company_name,
    promisedAt: row.promised_at,
    dueAt: row.due_at,
    impliedUrgency: row.implied_urgency,
    sourceType: row.source_type,
    sourceId: row.source_id,
    sourceReference: row.source_reference,
    status: row.status,
    completedAt: row.completed_at,
    completedVia: row.completed_via,
    completionNotes: row.completion_notes,
    delegatedToPersonId: row.delegated_to_person_id,
    delegatedToName: row.delegated_to_name,
    delegatedAt: row.delegated_at,
    snoozedUntil: row.snoozed_until,
    snoozeCount: row.snooze_count || 0,
    lastSnoozedAt: row.last_snoozed_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Transform frontend type to database format
 */
export function transformCommitmentForDatabase(data: CommitmentInsert | CommitmentUpdate): any {
  const result: any = {};

  if ('content' in data && data.content !== undefined) result.content = data.content;
  if ('context' in data && data.context !== undefined) result.context = data.context;
  if ('personId' in data) result.person_id = data.personId;
  if ('personName' in data) result.person_name = data.personName;
  if ('companyId' in data) result.company_id = data.companyId;
  if ('companyType' in data) result.company_type = data.companyType;
  if ('companyName' in data) result.company_name = data.companyName;
  if ('promisedAt' in data) result.promised_at = data.promisedAt;
  if ('dueAt' in data) result.due_at = data.dueAt;
  if ('impliedUrgency' in data) result.implied_urgency = data.impliedUrgency;
  if ('sourceType' in data) result.source_type = data.sourceType;
  if ('sourceId' in data) result.source_id = data.sourceId;
  if ('sourceReference' in data) result.source_reference = data.sourceReference;
  if ('status' in data) result.status = data.status;
  if ('completedVia' in data) result.completed_via = data.completedVia;
  if ('completionNotes' in data) result.completion_notes = data.completionNotes;
  if ('delegatedToPersonId' in data) result.delegated_to_person_id = data.delegatedToPersonId;
  if ('delegatedToName' in data) result.delegated_to_name = data.delegatedToName;
  if ('snoozedUntil' in data) result.snoozed_until = data.snoozedUntil;

  return result;
}
