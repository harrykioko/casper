

# AI-Driven Pipeline Company Creation from Inbox

## Overview

This feature enhances the Inbox AI Suggested Actions system to support first-class creation of new Pipeline Companies directly from introduction emails. When the AI detects an intro email for an unrecognized company, it suggests a `CREATE_PIPELINE_COMPANY` action. Clicking this opens a pre-populated modal where the user reviews and approves the AI-extracted data before creation.

---

## Architecture

```text
+---------------------------+
|   inbox-suggest-v2        |
|   (Edge Function)         |
|   - Detects intro emails  |
|   - Returns structured    |
|     metadata for company  |
|     creation in metadata  |
+-------------+-------------+
              |
              v
+---------------------------+
|   SuggestionCard          |
|   - Displays "Add to      |
|     Pipeline" action      |
|   - onClick -> opens      |
|     CreatePipelineModal   |
+-------------+-------------+
              |
              v
+---------------------------+
|   CreatePipelineModal     |
|   (New Component)         |
|   - Pre-filled fields     |
|   - User reviews/edits    |
|   - "Create" / "Cancel"   |
+-------------+-------------+
              |
              v
+---------------------------+
|   usePipeline.createCompany|
|   + linkCompany (inbox)   |
|   + createContact         |
+---------------------------+
```

---

## Implementation Details

### Part 1: Edge Function Enhancement (`inbox-suggest-v2`)

Update the AI system prompt and tool schema to return rich metadata when suggesting `CREATE_PIPELINE_COMPANY`.

**Changes to `supabase/functions/inbox-suggest-v2/index.ts`:**

1. **Update system prompt** to instruct the AI to extract company details for intro emails:
   - Company name (from signature, subject, or body)
   - Domain (extracted from sender email or mentioned URLs)
   - Sender name and email as primary contact
   - One-liner description (AI-generated)
   - Notes summary (intro context, traction mentions, founder background, any links)
   - Suggested tags (e.g., "fintech", "AI", "Series A")

2. **Update tool schema** to include `metadata` structure for `CREATE_PIPELINE_COMPANY`:

```typescript
metadata: {
  extracted_company_name: string;
  extracted_domain: string | null;
  primary_contact_name: string;
  primary_contact_email: string;
  description_oneliner: string;
  notes_summary: string;
  suggested_tags: string[];
  intro_source: string; // e.g., "Warm Intro from Harrison Kioko"
}
```

3. **Prioritize `CREATE_PIPELINE_COMPANY`** when:
   - Intent is `intro_first_touch`
   - No candidate companies match (empty `candidate_companies` or low scores)
   - Subject contains intro signals ("Intro", "Introduction", "Meet", "Connecting you")

### Part 2: New Types

**File: `src/types/inboxSuggestions.ts`**

Add interface for pipeline company creation metadata:

```typescript
export interface CreatePipelineCompanyMetadata {
  extracted_company_name: string;
  extracted_domain: string | null;
  primary_contact_name: string;
  primary_contact_email: string;
  description_oneliner: string;
  notes_summary: string;
  suggested_tags: string[];
  intro_source: string;
}
```

### Part 3: New Modal Component

**File: `src/components/inbox/CreatePipelineFromInboxModal.tsx`**

A lightweight, approval-oriented modal with AI-extracted data pre-populated:

**Layout:**
```text
+--------------------------------------------------+
| [Building2] Add to Pipeline                   [X] |
+--------------------------------------------------+
| [AI badge] Extracted from email                   |
|                                                   |
| Company Name *         [___________________]      |
| Domain                 [___________________]      |
| Stage                  [Seed v]                   |
| Source                 [Warm Intro]               |
|                                                   |
| ---- Primary Contact ----                         |
| Name                   [___________________]      |
| Email                  [___________________]      |
|                                                   |
| Description            [___________________]      |
| (AI one-liner, editable)                          |
|                                                   |
| Notes                                             |
| [__________________________________]              |
| [__________________________________]              |
| (AI summary with intro context)                   |
|                                                   |
| Tags                   [fintech] [AI] [+]         |
|                                                   |
+--------------------------------------------------+
|              [Cancel]   [Create Company]          |
+--------------------------------------------------+
```

**Features:**
- All fields are editable (user has full control)
- Company Name is required
- Default stage: "new" (first pipeline status)
- Source defaults to "Warm Intro" (stored in `next_steps` or a future source field)
- Tags displayed as editable chips
- "Create Company" button triggers creation flow

**Props:**
```typescript
interface CreatePipelineFromInboxModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inboxItem: InboxItem;
  prefillData: CreatePipelineCompanyMetadata;
  onCompanyCreated: (companyId: string, companyName: string) => void;
}
```

**Creation Flow:**
1. Call `usePipeline().createCompany()` with extracted data
2. Call `usePipelineContacts().createContact()` to add primary contact
3. Create initial note with AI-generated summary via pipeline_interactions
4. Call `linkCompany()` to associate inbox item with new company
5. Show success toast and close modal

### Part 4: Update SuggestionCard

**File: `src/components/inbox/SuggestionCard.tsx`**

Update the button label for `CREATE_PIPELINE_COMPANY`:
- Current: "Create"
- New: "Add to Pipeline" (more descriptive)

### Part 5: Update Inbox Page Handler

**File: `src/pages/Inbox.tsx`**

Add state and handler for the new modal:

```typescript
// State
const [pipelineModalItem, setPipelineModalItem] = useState<{
  item: InboxItem;
  metadata: CreatePipelineCompanyMetadata;
} | null>(null);

// In handleApproveSuggestion:
case "CREATE_PIPELINE_COMPANY": {
  const metadata = suggestion.metadata as CreatePipelineCompanyMetadata | undefined;
  if (metadata?.extracted_company_name) {
    // Open the new modal with pre-filled data
    setPipelineModalItem({ item, metadata });
  } else {
    // Fallback: Use basic extraction from email
    setPipelineModalItem({
      item,
      metadata: {
        extracted_company_name: item.senderName || "",
        extracted_domain: item.senderEmail?.split("@")[1] || null,
        primary_contact_name: item.senderName || "",
        primary_contact_email: item.senderEmail || "",
        description_oneliner: "",
        notes_summary: item.preview || "",
        suggested_tags: [],
        intro_source: "Email",
      },
    });
  }
  break;
}

// Handler for company created
const handlePipelineCompanyCreated = (companyId: string, companyName: string) => {
  if (pipelineModalItem) {
    linkCompany(pipelineModalItem.item.id, companyId, companyName, 'pipeline');
    toast.success(`${companyName} added to pipeline and linked to email`);
  }
  setPipelineModalItem(null);
};
```

### Part 6: Update InboxActionRail Handler

**File: `src/components/inbox/InboxActionRail.tsx`**

Ensure `onApproveSuggestion` is called with full suggestion including metadata, so the parent component can extract the prefill data.

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/inbox/CreatePipelineFromInboxModal.tsx` | New modal for AI-assisted pipeline company creation |

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/inbox-suggest-v2/index.ts` | Add metadata extraction for CREATE_PIPELINE_COMPANY |
| `src/types/inboxSuggestions.ts` | Add CreatePipelineCompanyMetadata interface |
| `src/components/inbox/SuggestionCard.tsx` | Update button label for pipeline action |
| `src/pages/Inbox.tsx` | Add modal state and handler for pipeline creation |

---

## UX Considerations

1. **Approval-Oriented Design**: The modal emphasizes that "AI has done the work" but the user is in control. All fields are editable.

2. **Confidence Signal**: Show an "AI" badge near the header to indicate this is auto-extracted data.

3. **No Auto-Creation**: The company is only created when the user explicitly clicks "Create Company".

4. **Seamless Linking**: After creation, the email is automatically linked to the new company, enabling future AI actions (drafting replies, scheduling follow-ups).

5. **Graceful Fallback**: If AI metadata is missing or incomplete, use basic extraction from sender info.

---

## Technical Considerations

### Pipeline Company Fields

Based on `usePipeline.createCompany()`, the minimal required fields are:
- `company_name` (required)
- `current_round` (required, RoundEnum - default to "Seed")

Optional fields to pre-fill:
- `website` - constructed from domain if available
- `next_steps` - can store intro source/context
- `status` - default to "new"

### Contact Creation

After company creation, use the company ID to create a contact:
- `name` - from primary_contact_name
- `email` - from primary_contact_email
- `is_founder` - default true
- `is_primary` - default true

### Notes/Interactions

Create an initial pipeline_interaction with type "note" containing the AI-generated summary.

---

## Testing Checklist

1. Forward an intro email to the inbox
2. Generate AI suggestions - verify CREATE_PIPELINE_COMPANY appears with high priority
3. Click "Add to Pipeline" - verify modal opens with pre-filled data
4. Edit fields and click "Create Company"
5. Verify:
   - Company appears in Pipeline
   - Contact is created and linked
   - Email is linked to the company
   - Initial note is created with summary
6. Test fallback when metadata is missing
7. Test Cancel button closes modal without side effects

