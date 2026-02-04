/**
 * Build Task Draft from Email
 *
 * Hybrid heuristic + model-based prefill logic for task creation.
 */

import { 
  addDays, 
  nextFriday, 
  nextMonday, 
  parseISO, 
  isValid, 
  differenceInDays,
  startOfTomorrow,
} from "date-fns";
import type { InboxItem } from "@/types/inbox";
import type { StructuredSuggestion, CreateWaitingOnMetadata } from "@/types/inboxSuggestions";
import type { TaskDraft, CommitmentDraft } from "@/types/emailActionDrafts";
import { buildTaskNoteFromEmail, buildCommitmentContextFromEmail } from "./buildTaskNote";

/**
 * Parse a due date hint string into a Date object.
 * Handles explicit dates and relative date expressions.
 */
export function parseDueHint(hint: string): Date | null {
  if (!hint) return null;
  
  const lower = hint.toLowerCase().trim();
  const today = new Date();
  
  // Relative date expressions
  if (lower.includes("today") || lower === "asap" || lower === "urgent") {
    return today;
  }
  if (lower.includes("tomorrow")) {
    return startOfTomorrow();
  }
  if (lower.includes("end of week") || lower.includes("eow") || lower.includes("this friday")) {
    return nextFriday(today);
  }
  if (lower.includes("next week") || lower.includes("next monday")) {
    return nextMonday(today);
  }
  if (lower.includes("monday") && !lower.includes("next")) {
    return nextMonday(today);
  }
  if (lower.includes("friday") && !lower.includes("this")) {
    return nextFriday(today);
  }
  if (lower.includes("in a week") || lower.includes("one week")) {
    return addDays(today, 7);
  }
  if (lower.includes("in a few days") || lower.includes("couple days")) {
    return addDays(today, 3);
  }
  if (lower.includes("end of month") || lower.includes("eom")) {
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return endOfMonth;
  }
  
  // Try parsing as ISO date string
  const parsed = parseISO(hint);
  if (isValid(parsed)) {
    return parsed;
  }
  
  return null;
}

/**
 * Infer category from suggestion type and extracted categories
 */
function inferCategoryFromIntent(
  type?: string,
  extractedCategories?: string[] | null
): string | undefined {
  // Direct mapping from suggestion type
  if (type === "CREATE_PERSONAL_TASK") return "Personal";
  
  // Check extracted categories
  if (extractedCategories?.includes("personal")) return "Personal";
  if (extractedCategories?.includes("admin")) return "Admin";
  if (extractedCategories?.includes("investing")) return "Investing";
  if (extractedCategories?.includes("travel")) return "Travel";
  
  return undefined;
}

/**
 * Build a TaskDraft from email item and optional AI suggestion
 */
export function buildTaskDraftFromEmail(
  item: InboxItem,
  suggestion?: StructuredSuggestion | null
): TaskDraft {
  const draft: TaskDraft = {
    title: suggestion?.title || item.displaySubject || item.subject || "",
    initialNote: buildTaskNoteFromEmail(item),
    sourceEmailId: item.id,
  };

  // Company prefill - prefer suggestion, then email's linked company
  if (suggestion?.company_id) {
    draft.companyId = suggestion.company_id;
    draft.companyName = suggestion.company_name || undefined;
    draft.companyType = suggestion.company_type;
    draft.companyConfidence = "suggested";
  } else if (item.relatedCompanyId) {
    draft.companyId = item.relatedCompanyId;
    draft.companyName = item.relatedCompanyName || undefined;
    draft.companyType = item.relatedCompanyType;
    draft.companyConfidence = "linked";
  }

  // Due date prefill from suggestion hint
  const dueHint = suggestion?.due_hint;
  if (dueHint) {
    const parsedDate = parseDueHint(dueHint);
    if (parsedDate) {
      draft.dueDate = parsedDate;
      draft.dueDateConfidence = "suggested";
    }
  }

  // Priority prefill based on due date proximity
  if (draft.dueDate) {
    const daysUntilDue = differenceInDays(draft.dueDate, new Date());
    if (daysUntilDue <= 2) {
      draft.priority = "high";
      draft.priorityConfidence = "suggested";
    } else if (daysUntilDue <= 7) {
      draft.priority = "medium";
      draft.priorityConfidence = "suggested";
    }
  }

  // Category inference from suggestion type and extracted categories
  const inferredCategory = inferCategoryFromIntent(
    suggestion?.type,
    item.extractedCategories
  );
  if (inferredCategory) {
    draft.category = inferredCategory;
    draft.categoryConfidence = "suggested";
  }

  return draft;
}

/**
 * Build a CommitmentDraft from email item and CREATE_WAITING_ON suggestion
 */
export function buildCommitmentDraftFromSuggestion(
  item: InboxItem,
  suggestion: StructuredSuggestion
): CommitmentDraft {
  const metadata = suggestion.metadata as unknown as CreateWaitingOnMetadata | undefined;
  
  const draft: CommitmentDraft = {
    title: metadata?.commitment_title || suggestion.title || "",
    content: metadata?.commitment_content || suggestion.title || "",
    context: metadata?.context || buildCommitmentContextFromEmail(item),
    direction: "owed_to_me",
    alsoCreateTask: true,
    sourceEmailId: item.id,
  };

  // Counterparty from metadata or sender
  if (metadata?.person_name) {
    draft.counterpartyName = metadata.person_name;
  } else if (item.senderName) {
    draft.counterpartyName = item.senderName;
  }

  // Due date from hint
  const dueHint = metadata?.expected_by_hint || suggestion.due_hint;
  if (dueHint) {
    const parsedDate = parseDueHint(dueHint);
    if (parsedDate) {
      draft.dueDate = parsedDate;
      draft.dueDateConfidence = "suggested";
    }
  }

  // Company context
  if (suggestion.company_id) {
    draft.companyId = suggestion.company_id;
    draft.companyName = suggestion.company_name || undefined;
    draft.companyType = suggestion.company_type;
  } else if (item.relatedCompanyId) {
    draft.companyId = item.relatedCompanyId;
    draft.companyName = item.relatedCompanyName || undefined;
    draft.companyType = item.relatedCompanyType;
  }

  return draft;
}
