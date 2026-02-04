/**
 * Email Action Draft Types
 *
 * Canonical draft shapes for task and commitment creation from email.
 * These types are used by AI suggestions and the manual action composer.
 */

export type ConfidenceLevel = "suggested" | "explicit" | "linked";

export interface TaskDraft {
  title: string;
  initialNote?: string;
  dueDate?: Date | null;
  dueDateConfidence?: ConfidenceLevel;
  priority?: "low" | "medium" | "high";
  priorityConfidence?: ConfidenceLevel;
  category?: string;
  categoryConfidence?: ConfidenceLevel;
  companyId?: string;
  companyName?: string;
  companyType?: "portfolio" | "pipeline";
  companyConfidence?: ConfidenceLevel;
  projectId?: string;
  projectName?: string;
  sourceEmailId: string;
}

export interface CommitmentDraft {
  title: string;
  content: string;
  context?: string;
  dueDate?: Date | null;
  dueDateConfidence?: ConfidenceLevel;
  counterpartyName?: string;
  counterpartyId?: string;
  companyId?: string;
  companyName?: string;
  companyType?: "portfolio" | "pipeline";
  direction: "owed_by_me" | "owed_to_me";
  alsoCreateTask?: boolean;
  linkedTasks?: TaskDraft[];
  sourceEmailId: string;
}

/**
 * Helper to check if any suggested field exists in the draft
 */
export function hasSuggestedFields(draft: TaskDraft): boolean {
  return !!(
    (draft.dueDate && draft.dueDateConfidence === "suggested") ||
    (draft.priority && draft.priorityConfidence === "suggested") ||
    (draft.category && draft.categoryConfidence === "suggested") ||
    (draft.companyId && draft.companyConfidence === "suggested")
  );
}

/**
 * Pipeline Company Draft
 * 
 * Structured prefill data for creating pipeline companies from email.
 * Includes confidence indicators for AI-suggested fields.
 */
export interface PipelineCompanyDraftContact {
  name: string;
  email: string;
  role?: string;
  confidence?: ConfidenceLevel;
}

export interface PipelineCompanyDraft {
  companyName: string;
  companyNameConfidence?: ConfidenceLevel;
  domain?: string | null;
  domainConfidence?: ConfidenceLevel;
  website?: string | null;
  contacts: PipelineCompanyDraftContact[];
  contextSummary?: string;
  keyPoints?: string[];
  introSource?: string;
  suggestedStage?: string;
  suggestedTags?: string[];
  reason: string;
  sourceEmailId: string;
  confidence: {
    isIntroOrFollowup: number;
    companyMatch: number;
    domainInferred: number;
  };
}
