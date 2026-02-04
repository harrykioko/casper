
# Smarter Task + Commitment Creation from Email Drawer

## Overview

This plan upgrades the email drawer's inline task creation flow to support smarter prefills from AI extraction, an enhanced compact UI with editable suggestion chips, and commitment creation support for tracking promises and deliverables.

---

## Phase 1: Types and Draft Schema

### 1.1 Create Action Draft Types

**New File: `src/types/emailActionDrafts.ts`**

Define canonical draft shapes for task and commitment creation from email:

```typescript
export interface TaskDraft {
  title: string;
  initialNote?: string;
  dueDate?: Date | null;
  dueDateConfidence?: "suggested" | "explicit";
  priority?: "low" | "medium" | "high";
  priorityConfidence?: "suggested" | "explicit";
  category?: string;
  categoryConfidence?: "suggested" | "explicit";
  companyId?: string;
  companyName?: string;
  companyType?: "portfolio" | "pipeline";
  companyConfidence?: "suggested" | "linked";
  projectId?: string;
  projectName?: string;
  sourceEmailId: string;
}

export interface CommitmentDraft {
  title: string;
  content: string;
  context?: string;
  dueDate?: Date | null;
  counterpartyName?: string;
  counterpartyId?: string;
  companyId?: string;
  companyName?: string;
  companyType?: "portfolio" | "pipeline";
  direction: "owed_by_me" | "owed_to_me";
  linkedTasks?: TaskDraft[];
  sourceEmailId: string;
}
```

---

## Phase 2: Improved Initial Note Logic

### 2.1 Create Note Builder Utility

**New File: `src/lib/inbox/buildTaskNote.ts`**

Build clean initial notes from extracted email data:

```typescript
export function buildTaskNoteFromEmail(item: InboxItem): string {
  const parts: string[] = [];

  // Prefer AI summary/key points
  if (item.extractedSummary) {
    parts.push(item.extractedSummary);
  }

  // Add next step if actionable
  if (item.extractedNextStep?.isActionRequired && item.extractedNextStep?.label) {
    parts.push(`Next step: ${item.extractedNextStep.label}`);
  }

  // Add key points (first 2-3)
  if (item.extractedKeyPoints?.length) {
    const topPoints = item.extractedKeyPoints.slice(0, 3);
    parts.push(topPoints.map(p => `- ${p}`).join("\n"));
  }

  // Fallback to cleaned text snippet (not raw body)
  if (parts.length === 0 && item.cleanedText) {
    const snippet = item.cleanedText.slice(0, 300).trim();
    if (snippet) parts.push(snippet);
  }

  return parts.join("\n\n").trim();
}
```

This utility explicitly avoids using raw email body with signatures and disclaimers.

---

## Phase 3: Task Prefill Logic

### 3.1 Create Prefill Builder

**New File: `src/lib/inbox/buildTaskDraft.ts`**

Hybrid heuristic + model-based prefill logic:

```typescript
export function buildTaskDraftFromEmail(
  item: InboxItem,
  suggestion?: StructuredSuggestion
): TaskDraft {
  const draft: TaskDraft = {
    title: suggestion?.title || item.displaySubject || item.subject || "",
    initialNote: buildTaskNoteFromEmail(item),
    sourceEmailId: item.id,
  };

  // Company prefill
  if (suggestion?.company_id) {
    draft.companyId = suggestion.company_id;
    draft.companyName = suggestion.company_name || undefined;
    draft.companyType = suggestion.company_type;
    draft.companyConfidence = "suggested";
  } else if (item.relatedCompanyId) {
    draft.companyId = item.relatedCompanyId;
    draft.companyName = item.relatedCompanyName;
    draft.companyType = item.relatedCompanyType;
    draft.companyConfidence = "linked";
  }

  // Due date prefill
  const dueHint = suggestion?.due_hint;
  if (dueHint) {
    draft.dueDate = parseDueHint(dueHint);
    draft.dueDateConfidence = "suggested";
  }

  // Priority prefill
  if (draft.dueDate) {
    const daysUntilDue = differenceInDays(draft.dueDate, new Date());
    if (daysUntilDue <= 2) {
      draft.priority = "high";
      draft.priorityConfidence = "suggested";
    } else {
      draft.priority = "medium";
      draft.priorityConfidence = "suggested";
    }
  }

  // Category inference
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

function parseDueHint(hint: string): Date | null {
  // Parse explicit dates and relative dates
  const lower = hint.toLowerCase();
  const today = new Date();
  
  if (lower.includes("today")) return today;
  if (lower.includes("tomorrow")) return addDays(today, 1);
  if (lower.includes("end of week") || lower.includes("friday")) {
    return nextFriday(today);
  }
  if (lower.includes("next week") || lower.includes("monday")) {
    return nextMonday(today);
  }
  // Try parsing as date string
  const parsed = parseISO(hint);
  return isValid(parsed) ? parsed : null;
}

function inferCategoryFromIntent(
  type?: string,
  extractedCategories?: string[]
): string | undefined {
  if (type === "CREATE_PERSONAL_TASK") return "Personal";
  if (extractedCategories?.includes("personal")) return "Personal";
  if (extractedCategories?.includes("admin")) return "Admin";
  return undefined;
}
```

---

## Phase 4: Redesigned Inline Task Form

### 4.1 New Compact Form with Suggestion Chips

**File: `src/components/inbox/inline-actions/InlineTaskForm.tsx`**

Redesign the form to use progressive disclosure and editable chips:

Key structural changes:

1. **Always show**: Title input (prominent) and a minimal initial note toggle
2. **Suggested chips**: Show only non-empty fields as compact chips
3. **Chip editing**: Clicking a chip opens a popover editor
4. **Add details affordance**: Single "Add..." button for optional fields

```text
+-----------------------------------------------+
| [ListTodo] Create Task                        |
+-----------------------------------------------+
| Task: [Make anniversary dinner reservation  ] |
|                                               |
| [+ Add note]  (collapsed, expands on click)   |
|                                               |
| Suggested:                                    |
| [Due: Tomorrow (Suggested)] [Priority: High]  |
| [Category: Personal]                          |
|                                               |
| [Add details...]                              |
|                                               |
| [Cancel]              [Confirm]               |
+-----------------------------------------------+
```

**Chip Component (Inline)**:

```typescript
interface SuggestionChipProps {
  label: string;
  value: string;
  confidence?: "suggested" | "explicit" | "linked";
  onEdit: () => void;
  onClear: () => void;
}

function SuggestionChip({ label, value, confidence, onEdit, onClear }) {
  return (
    <button onClick={onEdit} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-muted hover:bg-muted/80 border border-border/50">
      <span className="font-medium">{label}:</span>
      <span>{value}</span>
      {confidence === "suggested" && (
        <span className="text-amber-600 text-[8px]">(Suggested)</span>
      )}
      <X className="h-2.5 w-2.5 ml-1 opacity-60 hover:opacity-100" onClick={(e) => { e.stopPropagation(); onClear(); }} />
    </button>
  );
}
```

**Chip Editors** (using Popover):

- **Due Date**: Calendar popover
- **Priority**: Dropdown with Low/Medium/High
- **Category**: Dropdown with existing categories
- **Company**: Read-only display with option to unlink

**Form State**: Use `TaskDraft` type to track all fields and confidence levels.

---

## Phase 5: Commitment Creation Support

### 5.1 Detect Commitment Suggestions

The existing `CREATE_WAITING_ON` suggestion type handles commitment detection. No backend changes needed.

### 5.2 New Inline Commitment Form

**New File: `src/components/inbox/inline-actions/InlineCommitmentForm.tsx`**

Compact form for creating commitments from email:

```text
+-----------------------------------------------+
| [Handshake] Track Obligation                  |
+-----------------------------------------------+
| "AI rationale explaining the promise..."      |
+-----------------------------------------------+
| Title: [Send deck by Friday                 ] |
| From:  [John Smith] (editable)                |
| Due:   [Friday] (editable, optional)          |
|                                               |
| [x] Also create a task                        |
|                                               |
| [Cancel]              [Confirm]               |
+-----------------------------------------------+
```

Prefill from `CreateWaitingOnMetadata`:
- `commitment_title` -> Title
- `commitment_content` -> Content (hidden, used as context)
- `person_name` -> Counterparty
- `expected_by_hint` -> Due date (parsed)
- `context` -> Context field

### 5.3 Wire Commitment Creation in InlineActionPanel

**File: `src/components/inbox/InlineActionPanel.tsx`**

Add commitment action type and handler:

1. Add `"create_commitment"` to `ActionType`
2. Add handler `handleConfirmCommitment` using `useCommitments().createCommitment`
3. Update `handleSuggestionSelect` to route `CREATE_WAITING_ON` to commitment form
4. Log activity with `actionType: "create_commitment"`

---

## Phase 6: Suggestion Card Integration

### 6.1 Update Suggestion Routing

**File: `src/components/inbox/InlineActionPanel.tsx`**

Update `handleSuggestionSelect` to:

1. Build proper `TaskDraft` using `buildTaskDraftFromEmail`
2. Route `CREATE_WAITING_ON` suggestions to `InlineCommitmentForm`
3. Pass draft data to forms via prefill props

```typescript
case "CREATE_FOLLOW_UP_TASK":
case "CREATE_PERSONAL_TASK":
case "CREATE_INTRO_TASK":
  const taskDraft = buildTaskDraftFromEmail(item, suggestion);
  setActiveAction("create_task");
  setPrefillData(taskDraft);
  break;

case "CREATE_WAITING_ON":
  const commitmentDraft = buildCommitmentDraftFromSuggestion(item, suggestion);
  setActiveAction("create_commitment");
  setPrefillData(commitmentDraft);
  break;
```

---

## Phase 7: Update Task Creation Handler

### 7.1 Enhanced Task Creation

**File: `src/components/inbox/InlineActionPanel.tsx`**

Update `handleConfirmTask` to accept full draft data:

```typescript
const handleConfirmTask = async (draft: TaskDraft) => {
  const result = await createTask({
    content: draft.title,
    source_inbox_item_id: draft.sourceEmailId,
    pipeline_company_id: draft.companyType === "pipeline" ? draft.companyId : undefined,
    company_id: draft.companyType === "portfolio" ? draft.companyId : undefined,
    priority: draft.priority,
    scheduled_for: draft.dueDate?.toISOString(),
    // category_id would need lookup
  });
  
  // ... activity logging and success state
};
```

---

## Files Changed Summary

| File | Action | Description |
|------|--------|-------------|
| `src/types/emailActionDrafts.ts` | Create | TaskDraft and CommitmentDraft type definitions |
| `src/lib/inbox/buildTaskNote.ts` | Create | Utility to build clean notes from extraction |
| `src/lib/inbox/buildTaskDraft.ts` | Create | Prefill logic with date parsing and inference |
| `src/components/inbox/inline-actions/InlineTaskForm.tsx` | Rewrite | Compact chip-based form with popovers |
| `src/components/inbox/inline-actions/InlineCommitmentForm.tsx` | Create | Inline commitment creation form |
| `src/components/inbox/inline-actions/index.ts` | Update | Export new form |
| `src/components/inbox/InlineActionPanel.tsx` | Update | Wire commitment action, update suggestion routing |
| `src/types/inboxSuggestions.ts` | Update | Add TaskDraftMetadata type (optional) |

---

## UI Component Details

### Chip Edit Popovers

**Priority Popover**:
```text
+----------------+
| [Low]          |
| [Medium] (*)   |
| [High]         |
+----------------+
```

**Date Popover**:
```text
+-----------------+
| [Calendar]      |
| Quick picks:    |
| - Today         |
| - Tomorrow      |
| - End of week   |
| - Next Monday   |
+-----------------+
```

### Progressive Disclosure

Initial state shows only populated suggestion chips. "Add details..." expands a section with:
- Category selector (if not already suggested)
- Priority selector (if not already suggested)
- Due date picker (if not already suggested)
- Project selector (optional)

---

## Database Considerations

No schema changes required. The existing tables support all needed fields:

- `tasks.priority` - already exists
- `tasks.scheduled_for` - already exists for due date
- `tasks.category_id` - already exists
- `tasks.source_inbox_item_id` - already exists
- `commitments.source_id` + `source_type` - already exists for email linking

---

## Success Criteria Validation

1. "Make anniversary dinner reservation" creates a task with:
   - Clean initial note from extraction (no signature)
   - Category suggested as "Personal" (from intent)
   - Priority suggested as "High" (if due soon)
   - Due date suggested within days (editable chip)

2. Users can edit suggested values quickly via chip popovers

3. Commitments can be created when promises exist via `CREATE_WAITING_ON` suggestion

4. All flows remain inline within the email drawer and require explicit confirmation

---

## Technical Notes

- All UI changes are contained within the email drawer inline action system
- No changes to routes or non-email surfaces
- Uses existing Radix Popover for chip editors
- Maintains compact form factor with progressive disclosure
- Draft types provide type safety for prefill data flow
- Note builder explicitly excludes raw body to prevent signatures/disclaimers
