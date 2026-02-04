
# Structured Email Extraction and Summary View Implementation

## Overview

This plan replaces the noisy raw email display with a Cabana-style structured summary view featuring AI-extracted content: overview, key points, next step indicator, and entity/people metadata. The original email remains accessible via a collapsed section.

---

## Database Changes

### Add Extraction Columns to `inbox_items`

**Migration: `supabase/migrations/[timestamp]_add_email_extraction_columns.sql`**

```sql
ALTER TABLE public.inbox_items
ADD COLUMN IF NOT EXISTS extracted_summary text,
ADD COLUMN IF NOT EXISTS extracted_key_points jsonb,
ADD COLUMN IF NOT EXISTS extracted_next_step jsonb,
ADD COLUMN IF NOT EXISTS extracted_entities jsonb,
ADD COLUMN IF NOT EXISTS extracted_people jsonb,
ADD COLUMN IF NOT EXISTS extracted_categories text[],
ADD COLUMN IF NOT EXISTS extraction_version text DEFAULT 'v1',
ADD COLUMN IF NOT EXISTS extracted_at timestamptz;
```

| Column | Type | Description |
|--------|------|-------------|
| `extracted_summary` | text | 1-2 sentence overview |
| `extracted_key_points` | jsonb | Array of 3-7 bullet strings |
| `extracted_next_step` | jsonb | `{label, is_action_required}` |
| `extracted_entities` | jsonb | `[{name, type, confidence}]` |
| `extracted_people` | jsonb | `[{name, email, confidence}]` |
| `extracted_categories` | text[] | update, request, intro, scheduling, follow_up, finance, other |
| `extraction_version` | text | Prompt version (default 'v1') |
| `extracted_at` | timestamptz | When extraction completed |

---

## Backend Implementation

### New Edge Function: `email-extract-structured`

**File: `supabase/functions/email-extract-structured/index.ts`**

**Flow:**
1. Authenticate user via JWT
2. Fetch inbox item (verify ownership)
3. Prepare cleaned text with URL collapsing
4. Call OpenAI gpt-4o-mini with tool calling for strict JSON schema
5. Validate and normalize response
6. Persist to inbox_items table
7. Return extraction for immediate UI update

**Key Features:**

- **URL Collapsing**: Replace long URLs (40+ chars) with `[link: domain]`
- **Tool Calling**: Use OpenAI function calling for guaranteed JSON structure
- **Validation**: Ensure 3-7 key points, clamp confidence values 0-1
- **Retry Logic**: On invalid JSON, retry with stricter instructions

**OpenAI Tool Schema:**
```typescript
{
  name: "extract_structured_summary",
  parameters: {
    summary: { type: "string" },
    key_points: { type: "array", items: { type: "string" } },
    next_step: { 
      type: "object",
      properties: {
        label: { type: "string" },
        is_action_required: { type: "boolean" }
      }
    },
    categories: { type: "array", items: { enum: ["update","request",...] } },
    entities: { type: "array", items: { name, type, confidence } },
    people: { type: "array", items: { name, email?, confidence } }
  }
}
```

**Config Update: `supabase/config.toml`**
```toml
[functions.email-extract-structured]
verify_jwt = false
```

---

## Frontend Implementation

### Type Updates

**File: `src/types/inbox.ts`**

Add to InboxItem interface:
```typescript
// Structured extraction (AI-generated)
extractedSummary?: string | null;
extractedKeyPoints?: string[] | null;
extractedNextStep?: { label: string; isActionRequired: boolean } | null;
extractedEntities?: Array<{ name: string; type: string; confidence: number }> | null;
extractedPeople?: Array<{ name: string; email?: string | null; confidence: number }> | null;
extractedCategories?: string[] | null;
extractionVersion?: string | null;
extractedAt?: string | null;
```

### Hook Updates

**File: `src/hooks/useInboxItems.ts`**

Update `InboxItemRow` interface:
```typescript
// Add after existing fields
extracted_summary?: string | null;
extracted_key_points?: unknown[] | null;
extracted_next_step?: { label: string; is_action_required: boolean } | null;
extracted_entities?: unknown[] | null;
extracted_people?: unknown[] | null;
extracted_categories?: string[] | null;
extraction_version?: string | null;
extracted_at?: string | null;
```

Update `transformRow()` function to map snake_case to camelCase.

### New Hook: `useEmailExtraction`

**File: `src/hooks/useEmailExtraction.ts`**

```typescript
export function useEmailExtraction() {
  const queryClient = useQueryClient();

  const extractMutation = useMutation({
    mutationFn: async (inboxItemId: string) => {
      const { data, error } = await supabase.functions.invoke("email-extract-structured", {
        body: { inbox_item_id: inboxItemId },
      });
      if (error) throw error;
      return data.extraction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox_items"] });
      toast.success("Summary generated");
    },
    onError: () => {
      toast.error("Failed to generate summary. Try again.");
    },
  });

  return {
    extract: extractMutation.mutate,
    extractAsync: extractMutation.mutateAsync,
    isExtracting: extractMutation.isPending,
    error: extractMutation.error,
    lastResult: extractMutation.data,
  };
}
```

### New Component: `StructuredSummaryCard`

**File: `src/components/inbox/StructuredSummaryCard.tsx`**

**Layout Sections:**
1. **Overview** - 1-2 sentence summary in a card
2. **Key Points** - Bulleted list (3-7 items)
3. **Next Step** - Checkbox icon with action indicator
4. **Categories** - Muted badge chips
5. **Footer Metadata** - Entities and People with type-based colors

**Placeholder Component for Missing Extraction:**
```tsx
export function GenerateSummaryPlaceholder({ onGenerate, isGenerating, error }) {
  return (
    <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-6 text-center">
      <Wand2 className="h-5 w-5 mx-auto text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground mb-1">Generate a structured summary</p>
      <p className="text-xs text-muted-foreground/70 mb-3">
        Creates an overview, key points, and extracts entities for action workflows.
      </p>
      <Button size="sm" onClick={onGenerate} disabled={isGenerating}>
        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Generate summary
      </Button>
    </div>
  );
}
```

### Updated Component: `InboxContentPane`

**File: `src/components/inbox/InboxContentPane.tsx`**

**Changes:**

1. Import new components and hook:
```typescript
import { StructuredSummaryCard, GenerateSummaryPlaceholder } from "./StructuredSummaryCard";
import { useEmailExtraction } from "@/hooks/useEmailExtraction";
```

2. Add extraction hook and local state for immediate updates:
```typescript
const { extract, isExtracting, error: extractionError, lastResult } = useEmailExtraction();
const [localExtraction, setLocalExtraction] = useState<ExtractionResult | null>(null);
```

3. Replace email body section with conditional rendering:
```tsx
{/* Scrollable Body */}
<div className="flex-1 overflow-y-auto p-5">
  {/* Structured Summary (when available) */}
  {item.extractedAt || localExtraction ? (
    <StructuredSummaryCard
      summary={localExtraction?.summary || item.extractedSummary!}
      keyPoints={localExtraction?.keyPoints || item.extractedKeyPoints!}
      nextStep={localExtraction?.nextStep || item.extractedNextStep!}
      categories={localExtraction?.categories || item.extractedCategories || []}
      entities={localExtraction?.entities || item.extractedEntities || []}
      people={localExtraction?.people || item.extractedPeople || []}
    />
  ) : (
    <GenerateSummaryPlaceholder
      onGenerate={async () => {
        const result = await extractAsync(item.id);
        setLocalExtraction(result);
      }}
      isGenerating={isExtracting}
      error={extractionError}
    />
  )}

  {/* Attachments Section */}
  <div className="mt-6">
    <InboxAttachmentsSection ... />
  </div>

  {/* Linked Entities Section */}
  {item.relatedCompanyId && ( ... )}

  {/* View Original Email (collapsed) */}
  <Collapsible open={isRawOpen} onOpenChange={setIsRawOpen} className="mt-6">
    <CollapsibleTrigger className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isRawOpen ? 'rotate-180' : ''}`} />
      View original email
    </CollapsibleTrigger>
    <CollapsibleContent className="mt-3">
      <div className="border-l-2 border-muted pl-4 py-2">
        <pre className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground font-mono overflow-x-auto">
          {bodyContent}
        </pre>
      </div>
    </CollapsibleContent>
  </Collapsible>
</div>
```

---

## Files Changed Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/[timestamp]_add_email_extraction_columns.sql` | Create | Add 8 new columns for extraction data |
| `supabase/functions/email-extract-structured/index.ts` | Create | Edge function for AI extraction |
| `supabase/config.toml` | Modify | Add function config entry |
| `src/types/inbox.ts` | Modify | Add extraction fields to InboxItem |
| `src/hooks/useInboxItems.ts` | Modify | Update InboxItemRow and transformRow |
| `src/hooks/useEmailExtraction.ts` | Create | Hook for triggering extraction |
| `src/components/inbox/StructuredSummaryCard.tsx` | Create | Structured summary display + placeholder |
| `src/components/inbox/InboxContentPane.tsx` | Modify | Integrate summary card, rearrange sections |

---

## Visual Design

**Structured Summary Card:**
```text
+--------------------------------------------------+
| OVERVIEW                                         |
| Discussing meetings with Fulton and UMB at AOBA  |
| for FISPAN outreach.                             |
+--------------------------------------------------+
| KEY POINTS                                       |
| - Meetings with Fulton and UMB at AOBA confirmed |
| - Elizabeth Cronenweth (UMB) has retired         |
| - Fulton is a greenfield prospect for intros     |
+--------------------------------------------------+
| NEXT STEP                                        |
| [o] Bring up FISPAN in meetings with UMB/Fulton  |
|     Action required                              |
+--------------------------------------------------+
| Update | Scheduling                               |
+--------------------------------------------------+
| [Building] Fulton - UMB                          |
| [Person] Eric Schwartz - Elizabeth Cronenweth    |
+--------------------------------------------------+
```

**Styling Details:**
- Section headers: `text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground`
- Cards: `rounded-lg border border-border bg-card/50 p-4`
- Entity colors by type: company=blue, bank=emerald, fund=purple, product=orange
- Action required: amber accent, No action: emerald checkmark

---

## Error Handling

**Edge Function:**
- Invalid JSON from OpenAI: retry once with stricter prompt
- Retry failure: return error, do not persist partial data
- All errors logged with full context

**UI:**
- Show inline error with "Try again" button
- Never block access to original email
- Loading state: disable button, show spinner

---

## Cost and Performance

- **On-demand only**: No automatic extraction on drawer open
- **Cached in DB**: No re-extraction on subsequent opens
- **Model**: gpt-4o-mini (~$0.0002 per extraction)
- **Versioning**: extraction_version allows future prompt updates
