// Inbox Suggestions V2 - VC-Intent Aware Types

export type EmailIntent =
  | "intro_first_touch"
  | "pipeline_follow_up"
  | "portfolio_update"
  | "intro_request"
  | "scheduling"
  | "personal_todo"
  | "fyi_informational";

export type SuggestionType =
  | "LINK_COMPANY"
  | "CREATE_PIPELINE_COMPANY"
  | "CREATE_FOLLOW_UP_TASK"
  | "CREATE_PERSONAL_TASK"
  | "CREATE_INTRO_TASK"
  | "SET_STATUS"
  | "EXTRACT_UPDATE_HIGHLIGHTS";

export interface StructuredSuggestion {
  id: string;
  type: SuggestionType;
  title: string;
  confidence: "low" | "medium" | "high";
  effort_bucket: "quick" | "medium" | "long";
  effort_minutes: number;
  rationale: string;
  company_id?: string | null;
  company_name?: string | null;
  company_type?: "portfolio" | "pipeline";
  due_hint?: string | null;
  metadata?: Record<string, unknown>;
  is_dismissed?: boolean;
}

export interface CandidateCompany {
  id: string;
  name: string;
  type: "portfolio" | "pipeline";
  primary_domain: string | null;
  match_score: number;
  match_reason: "domain" | "name_mention" | "prior_link" | "sender_history";
}

export interface InboxSuggestionsResponse {
  intent: EmailIntent;
  intent_confidence: "low" | "medium" | "high";
  asks: string[];
  entities: string[];
  suggestions: StructuredSuggestion[];
  candidate_companies: CandidateCompany[];
  generated_at: string;
  version: number;
}

// Labels for UI display
export const EMAIL_INTENT_LABELS: Record<EmailIntent, string> = {
  intro_first_touch: "Intro / First Touch",
  pipeline_follow_up: "Pipeline Follow-up",
  portfolio_update: "Portfolio Update",
  intro_request: "Intro Request",
  scheduling: "Scheduling",
  personal_todo: "Personal Todo",
  fyi_informational: "FYI / Informational",
};

export const SUGGESTION_TYPE_LABELS: Record<SuggestionType, string> = {
  LINK_COMPANY: "Link Company",
  CREATE_PIPELINE_COMPANY: "Add to Pipeline",
  CREATE_FOLLOW_UP_TASK: "Follow-up Task",
  CREATE_PERSONAL_TASK: "Personal Task",
  CREATE_INTRO_TASK: "Intro Task",
  SET_STATUS: "Update Status",
  EXTRACT_UPDATE_HIGHLIGHTS: "Extract Highlights",
};

export const EFFORT_LABELS: Record<string, string> = {
  quick: "~5 min",
  medium: "~15 min",
  long: "30+ min",
};
