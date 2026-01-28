

# Inbox Enhancement Plan: Clean Rendering, Attachments, and Suggested Actions

## Overview

This plan implements three major upgrades to the Inbox detail workspace:
1. **Clean email rendering** with deterministic stripping of forwarded wrappers, disclaimers, and signatures
2. **Attachment storage and UI** with Supabase Storage bucket and inline previews
3. **Suggested actions** with Phase A (heuristics) and Phase B (AI via Edge Function)

---

## Current State Summary

**Inbox Item Schema** (`inbox_items` table):
- `text_body`, `html_body` - raw email content
- `snippet` - 280 char preview
- `from_email`, `from_name`, `subject` - already parsed for forwarded emails in ingestion
- No attachment columns or related table

**Existing Patterns**:
- `readingHelpers.ts` provides a good model for heuristic suggestion logic
- OPENAI_API_KEY secret is already configured for AI features
- Storage bucket `company-logos` exists with public access pattern

**Current Content Pane** (`InboxContentPane.tsx`):
- Has basic disclaimer splitting (`splitContentAtDisclaimer`)
- "View original email" collapsible exists but needs improvement
- Placeholder for attachments section exists

---

## Implementation Plan

### Phase 1: Enhanced Email Cleaning (Client-Side First)

**Create: `src/lib/emailCleaners.ts`**

A utility module with pure functions for deterministic email cleaning:

```typescript
interface CleanedEmail {
  cleanedText: string;
  cleanedHtml: string | null;
  originalSender: { name: string | null; email: string | null } | null;
  originalSubject: string | null;
  originalDate: string | null;
  wasForwarded: boolean;
  cleaningApplied: string[];
}

// Main cleaning functions:
- cleanEmailContent(text, html): CleanedEmail
- stripForwardedWrapper(text): { body: string; meta: ForwardedMeta | null }
- stripDisclaimers(text): string
- stripSignatures(text): string  
- sanitizeHtml(html): string
```

**Cleaning Rules**:

| Pattern Type | Detection | Action |
|-------------|-----------|--------|
| Forwarded wrapper | `---------- Forwarded message ---------`, `--- Original Message ---` | Extract original sender/subject, strip header block |
| Header blocks | Lines starting with `From:`, `Sent:`, `To:`, `Subject:`, `Date:` at start of content | Strip entire block, preserve extracted metadata |
| Legal disclaimers | `DISCLAIMER:`, `CONFIDENTIALITY NOTICE`, `This email and any files transmitted`, `If you are not the intended recipient`, `This message is intended only` | Strip from first match onwards |
| Signatures | `-- ` on own line, phone patterns, multi-line blocks at end with name/title | Strip cautiously (only if after main content) |
| HTML cleaning | `<style>`, `<script>`, tracking pixels | Use regex removal, preserve semantic structure |

**Safety Rule**: If cleaning removes more than 80% of content, fall back to raw.

**Update: `src/components/inbox/InboxContentPane.tsx`**

- Replace inline `splitContentAtDisclaimer` with `cleanEmailContent()`
- Display cleaned content by default
- Update "View original email" to show full raw text/html
- Show original sender info in header if different from stored sender

---

### Phase 2: Attachment Storage and UI

**Database Migration: Create `inbox_attachments` table**

```sql
CREATE TABLE public.inbox_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inbox_item_id uuid NOT NULL REFERENCES public.inbox_items(id) ON DELETE CASCADE,
  filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes integer NOT NULL,
  storage_path text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

ALTER TABLE public.inbox_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attachments"
  ON public.inbox_attachments FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Service role can insert attachments"
  ON public.inbox_attachments FOR INSERT
  WITH CHECK (true);
```

**Database Migration: Create `inbox-attachments` storage bucket**

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('inbox-attachments', 'inbox-attachments', false);

CREATE POLICY "Users can read their own attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'inbox-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**Update: `supabase/functions/email-inbox-ingest/index.ts`**

Modify to handle attachments from the webhook payload:

```typescript
// After inbox_item insert, process attachments
if (payload.attachments && Array.isArray(payload.attachments)) {
  for (const attachment of payload.attachments) {
    const storagePath = `${user.id}/${inboxItemId}/${attachment.filename}`;
    
    // Upload binary content to storage
    const { error: uploadError } = await supabaseClient.storage
      .from('inbox-attachments')
      .upload(storagePath, decode(attachment.content), {
        contentType: attachment.contentType,
      });
    
    // Insert metadata record
    if (!uploadError) {
      await supabaseClient.from('inbox_attachments').insert({
        inbox_item_id: inboxItemId,
        filename: attachment.filename,
        mime_type: attachment.contentType,
        size_bytes: attachment.size,
        storage_path: storagePath,
        created_by: user.id,
      });
    }
  }
}
```

**Create: `src/hooks/useInboxAttachments.ts`**

```typescript
interface InboxAttachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
}

function useInboxAttachments(inboxItemId: string) {
  // Fetch attachments for item
  // Generate signed URLs for download/preview
  return { attachments, isLoading, getSignedUrl };
}
```

**Create: `src/components/inbox/InboxAttachmentsSection.tsx`**

UI component for the content pane:
- List attachment cards (icon by mime type, filename, formatted size)
- Download button using signed URL
- Inline preview toggle for images (png, jpg, gif, webp) and PDFs
- Use `<img>` for images, `<iframe>` for PDFs (with fallback)

**Update: `src/components/inbox/InboxContentPane.tsx`**

- Add `<InboxAttachmentsSection>` between body and "View original email"
- Pass `inboxItemId` to fetch attachments

---

### Phase 3A: Suggested Actions (Heuristic)

**Create: `src/lib/inboxSuggestions.ts`**

```typescript
interface SuggestedAction {
  id: string;
  title: string;
  effortMinutes: number | null;
  effortBucket: 'quick' | 'medium' | 'long';
  confidence: 'low' | 'medium' | 'high';
  source: 'heuristic' | 'ai';
  rationale: string;
  dueHint?: string;
  category?: string;
}

function extractHeuristicSuggestions(
  subject: string, 
  cleanedText: string
): SuggestedAction[]
```

**Heuristic Rules**:

| Pattern | Detection | Suggested Title | Confidence |
|---------|-----------|-----------------|------------|
| Action verbs | Lines with "send", "share", "schedule", "follow up", "intro", "review", "update", "draft", "attach", "confirm", "call", "meet" | Extract line as task | medium |
| Numbered lists | `1.`, `2.`, etc. at line start | Each item as separate task | high |
| Bullet points | `- `, `* `, `• ` at line start | Each item as separate task | medium |
| Questions | Lines ending with `?` requiring action | "Respond to: [question]" | medium |
| Deadlines | "by [date]", "before [date]", "deadline" | Extract with due hint | high |
| Default | No matches found | "Follow up on: [subject]" | low |

**Effort Estimation**:
- Quick (5 min): Single-line items, confirmations
- Medium (15 min): Multi-step items, reviews
- Long (30+ min): Calls, meetings, document creation

**Update: `src/components/inbox/InboxActionRail.tsx`**

- Replace placeholder `suggestions` array with `useMemo` calling `extractHeuristicSuggestions`
- Wire "Approve" button to `onCreateTask` with prefilled content
- Wire "Edit" button to open task dialog with editable prefill
- Add "Generate with AI" button (disabled until Phase B)

---

### Phase 3B: Suggested Actions (AI via Edge Function)

**Create: `supabase/functions/inbox-suggest/index.ts`**

Edge function using OpenAI with structured JSON output:

```typescript
// Input: { inbox_item_id } or { subject, cleanedText, sender }
// Output: { suggested_tasks: SuggestedAction[] }

const systemPrompt = `You are analyzing an email to extract actionable tasks.
Return a JSON object with suggested_tasks array. Each task has:
- title: clear, actionable task title (imperative verb)
- effort_minutes: estimated time (5, 15, 30, 60)
- due_hint: relative date hint if deadline mentioned ("tomorrow", "this week", "by Friday")
- category: optional category ("follow-up", "meeting", "review", "send", "call")
- confidence: "low" | "medium" | "high"
- rationale: brief explanation of why this is a task

Be conservative - only suggest genuine actionable items, not FYIs.
Return maximum 5 suggestions. If no tasks needed, return empty array.`;

// Use OpenAI with OPENAI_API_KEY (already configured)
// Response format enforcement with JSON mode
```

**Database Migration: Optional caching table**

```sql
CREATE TABLE public.inbox_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inbox_item_id uuid NOT NULL REFERENCES public.inbox_items(id) ON DELETE CASCADE,
  suggestions jsonb NOT NULL,
  generated_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'ai',
  UNIQUE(inbox_item_id)
);

ALTER TABLE public.inbox_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view suggestions for their items"
  ON public.inbox_suggestions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.inbox_items 
    WHERE id = inbox_suggestions.inbox_item_id AND created_by = auth.uid()
  ));
```

**Create: `src/hooks/useInboxSuggestions.ts`**

```typescript
function useInboxSuggestions(inboxItemId: string) {
  // 1. Check cache in inbox_suggestions table
  // 2. If no cache or stale, return heuristic suggestions
  // 3. Provide generateAISuggestions() mutation
  return { 
    suggestions, 
    isLoading, 
    isAI, 
    generateAISuggestions,
    refreshSuggestions 
  };
}
```

**Update: `src/components/inbox/InboxActionRail.tsx`**

- Replace local heuristic call with `useInboxSuggestions` hook
- Show AI badge on suggestions from AI source
- "Generate with AI" button calls `generateAISuggestions()`
- Loading state while generating
- Show "Powered by AI" indicator when applicable

---

### Phase 4: Task Linking and Activity Feedback

**Database Migration: Add `source_inbox_item_id` to tasks**

```sql
ALTER TABLE public.tasks 
ADD COLUMN source_inbox_item_id uuid REFERENCES public.inbox_items(id) ON DELETE SET NULL;
```

**Update: `src/pages/Inbox.tsx`**

Modify `handleCreateTask` to include inbox item link:

```typescript
const handleCreateTask = async (item: InboxItem, suggestionTitle?: string) => {
  setTaskPrefill({
    content: suggestionTitle || item.subject,
    description: item.preview || undefined,
    companyName: item.relatedCompanyName,
    sourceInboxItemId: item.id, // New field
  });
  setIsTaskDialogOpen(true);
};
```

**Update: `src/hooks/useTasks.ts`**

- Add `source_inbox_item_id` to transform and create functions
- Track in Task interface

**Activity Trail** (Lightweight for MVP):

For now, derive activity from related data rather than a separate audit log:
- When rendering activity section, query tasks where `source_inbox_item_id = item.id`
- Show "Created task: [title]" entries with timestamps
- Future: full audit table for all actions

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/lib/emailCleaners.ts` | CREATE | Email cleaning utilities |
| `src/lib/inboxSuggestions.ts` | CREATE | Heuristic suggestion extraction |
| `src/hooks/useInboxAttachments.ts` | CREATE | Attachment fetching hook |
| `src/hooks/useInboxSuggestions.ts` | CREATE | Suggestion hook (heuristic + AI) |
| `src/components/inbox/InboxAttachmentsSection.tsx` | CREATE | Attachment list/preview UI |
| `src/components/inbox/InboxContentPane.tsx` | MODIFY | Use cleaners, add attachments section |
| `src/components/inbox/InboxActionRail.tsx` | MODIFY | Wire real suggestions, approve flow |
| `src/pages/Inbox.tsx` | MODIFY | Pass suggestion handlers, task linking |
| `src/types/inbox.ts` | MODIFY | Add attachment types, suggestion types |
| `supabase/functions/email-inbox-ingest/index.ts` | MODIFY | Handle attachment uploads |
| `supabase/functions/inbox-suggest/index.ts` | CREATE | AI suggestion edge function |
| `supabase/config.toml` | MODIFY | Add inbox-suggest function config |

**Migrations Required**:
1. `inbox_attachments` table + RLS
2. `inbox-attachments` storage bucket + RLS
3. `inbox_suggestions` table (optional cache)
4. `tasks.source_inbox_item_id` column

---

## Verification Scenarios

After implementation, these scenarios should work:

| # | Scenario | Expected Result |
|---|----------|-----------------|
| 1 | Email with legal disclaimer | Disclaimer hidden, clean body shown, "View original" shows full |
| 2 | Forwarded email | Original sender displayed, wrapper stripped |
| 3 | Email with PDF attachment | Attachment card shown, download works, PDF preview opens |
| 4 | Email with action items | Heuristic suggestions appear in rail |
| 5 | Click "Approve" on suggestion | Task created, linked to email, appears in Activity |
| 6 | Click "Generate with AI" | AI suggestions load, replace heuristics |
| 7 | Create task from email | Task has `source_inbox_item_id`, shows in Activity section |

---

## Deferred Items

- **Server-side cleaning**: Initially client-side for iteration speed; migrate to Edge Function for consistency if needed
- **Full audit log**: Activity section uses derived data; full audit table is future work
- **Link Company flow**: Placeholder remains; requires company search modal
- **Set Category flow**: Placeholder remains; requires inbox category system

---

## Technical Notes

**Attachment Size Limits** (from existing memory):
- Individual email bodies: 60KB text, 120KB HTML
- Recommended attachment limit: 10MB each (tune based on usage)

**AI Rate Limiting**:
- Cache AI suggestions in `inbox_suggestions` table
- Only re-generate if user explicitly requests
- Consider debounce on rapid inbox item selection

**HTML Sanitization**:
- Continue using `dangerouslySetInnerHTML` with pre-sanitized content
- `sanitizeHtml()` removes scripts, styles, event handlers, data URIs

