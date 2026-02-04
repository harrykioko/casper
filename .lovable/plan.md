
# Email Summary Polish + Thread Context Support + Header Cleanup

## Overview

This plan polishes the email summary UI to feel professional and Cabana-like, adds thread-aware extraction to retain context from forwarded email chains, and streamlines the header to reduce visual noise.

---

## Architecture Summary

```text
+-------------------+     +------------------------+     +------------------+
| Email Ingestion   | --> | Thread Parser          | --> | inbox_items      |
| (Forward Email)   |     | (extract up to 5 msgs) |     | (thread_* cols)  |
+-------------------+     +------------------------+     +------------------+
                                   |
                                   v
                          +------------------------+
                          | OpenAI Extraction      |
                          | (v2 prompt, stricter)  |
                          +------------------------+
                                   |
                                   v
                          +------------------------+
                          | Polished UI            |
                          | (StructuredSummaryCard)|
                          +------------------------+
```

---

## Database Changes

### New Columns for Thread Context

Add to `inbox_items`:

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `thread_clean_text` | text | null | Concatenated thread messages (most recent 3-5) |
| `thread_message_count` | integer | null | Number of messages retained in thread |
| `extraction_basis` | text | null | 'latest' or 'thread' - which text was used |

**Migration SQL:**

```sql
ALTER TABLE public.inbox_items
ADD COLUMN IF NOT EXISTS thread_clean_text text,
ADD COLUMN IF NOT EXISTS thread_message_count integer,
ADD COLUMN IF NOT EXISTS extraction_basis text;

COMMENT ON COLUMN public.inbox_items.thread_clean_text IS 'Concatenated thread messages for context-aware extraction';
COMMENT ON COLUMN public.inbox_items.thread_message_count IS 'Number of messages in thread_clean_text';
COMMENT ON COLUMN public.inbox_items.extraction_basis IS 'latest or thread - indicates which text was used for extraction';
```

---

## Backend Changes

### 1. Thread Parser (New Helper)

**File: `supabase/functions/_shared/thread-parser.ts`**

Creates a new module to parse email threads:

```typescript
interface ThreadMessage {
  index: number;
  content: string;
  sender?: string;
  date?: string;
}

interface ParsedThread {
  messages: ThreadMessage[];
  latestCleanText: string;
  threadCleanText: string | null;
  messageCount: number;
}
```

**Logic:**
- Detect thread markers: "On ... wrote:", "From:", "-----Original Message-----"
- Split into message blocks
- Keep most recent 3-5 blocks
- Truncate each block to 1500 chars max
- Concatenate with separators: `--- Message 1 (most recent) ---`
- Cap total output at 6000 chars

**Thread Markers:**
```typescript
const THREAD_MARKERS = [
  /^On .{10,100} wrote:\s*$/im,
  /^On .{10,100} <.+?> wrote:\s*$/im,
  /^-{3,}\s*Original Message\s*-{3,}/im,
  /^From:\s*.+\nSent:\s*.+\nTo:\s*.+\nSubject:/im,
  /^_{20,}$/m,
];
```

### 2. Update Email Cleaner

**File: `supabase/functions/_shared/email-cleaner.ts`**

Modify `extractBrief()` to:
1. Call thread parser before other cleaning
2. Return `threadCleanText` and `threadMessageCount` in result
3. Keep `cleanedText` as the "latest" message only

**Updated Return Type:**
```typescript
export interface CleanedEmailResult {
  cleanedText: string;         // Latest message only
  threadCleanText: string | null;  // Full thread context
  threadMessageCount: number;  // How many messages in thread
  snippet: string;
  summary: string;
  displaySubject: string;
  displayFromEmail: string | null;
  displayFromName: string | null;
  signals: { ... };
}
```

### 3. Update Email Extraction

**File: `supabase/functions/_shared/email-extraction.ts`**

Changes:
1. Accept optional `threadCleanText` in context
2. Choose extraction basis: if `threadMessageCount >= 2`, use thread text
3. Update prompt to be stricter about next_step consistency
4. Return `extractionBasis` field

**Updated Context Interface:**
```typescript
export interface EmailContext {
  subject: string;
  fromName: string;
  fromEmail: string;
  toEmail: string | null;
  receivedAt: string;
  cleanedText: string;
  threadCleanText?: string | null;
  threadMessageCount?: number;
}
```

**Stricter Prompt Rules (v2):**
```text
STRICT RULES:
- If next_step.is_action_required is FALSE, next_step.label MUST be exactly "No action required"
- If the email implies ANY of the following, is_action_required MUST be TRUE:
  - Follow-up requested
  - Meeting scheduling or confirmation needed
  - Review or approval requested
  - Reply expected
  - Deliverable or action item mentioned
- Key points: 3-6 bullets, factual, concise (max 12 words each)
- Never imply commitments in summary if is_action_required is false

When thread context is provided:
- Summarize the full conversation, not just the latest message
- Note key decisions or context from earlier messages
- The "next step" should reflect the current state of the conversation
```

### 4. Update Ingestion Flow

**File: `supabase/functions/email-inbox-ingest/index.ts`**

Changes:
1. Store `thread_clean_text` and `thread_message_count` from cleaner
2. Pass thread context to extraction
3. Store `extraction_basis` and set `extraction_version: "v2"`

**Updated Insert:**
```typescript
const inboxItemData = {
  // ... existing fields
  thread_clean_text: cleanedResult.threadCleanText,
  thread_message_count: cleanedResult.threadMessageCount,
};

// ... after extraction
.update({
  // ... existing extraction fields
  extraction_basis: threadMessageCount >= 2 ? 'thread' : 'latest',
  extraction_version: "v2",
})
```

---

## Frontend Changes

### 1. Update Types

**File: `src/types/inbox.ts`**

Add fields:
```typescript
// Thread context
threadCleanText?: string | null;
threadMessageCount?: number | null;
extractionBasis?: 'latest' | 'thread' | null;
```

### 2. Update Hook

**File: `src/hooks/useInboxItems.ts`**

Add to `InboxItemRow`:
```typescript
thread_clean_text?: string | null;
thread_message_count?: number | null;
extraction_basis?: string | null;
```

Update `transformRow()` to map these fields.

### 3. Polish StructuredSummaryCard

**File: `src/components/inbox/StructuredSummaryCard.tsx`**

**Key Changes:**

**A. Fix Bullet Alignment:**
```tsx
// Before: custom bullet with manual positioning
<span className="text-muted-foreground mt-1.5 text-[8px]">●</span>

// After: proper list styling
<ul className="space-y-2 pl-4">
  {keyPoints.map((point, index) => (
    <li key={index} className="text-sm text-foreground leading-relaxed list-disc marker:text-muted-foreground">
      {point}
    </li>
  ))}
</ul>
```

**B. Reduce Visual Noise:**
- Remove individual borders on Overview, Key Points, Next Step
- Use a single container with internal dividers
- Lighter border colors: `border-border/50`
- More consistent padding: `p-3` instead of `p-4`

**C. Simplify Categories + Metadata Display:**
```tsx
// Combined footer row with categories and entity counts
<div className="flex items-center flex-wrap gap-2 pt-3 border-t border-border/30">
  {/* Category badges first */}
  {categories.map((category) => (
    <Badge key={category} ...>{category}</Badge>
  ))}
  
  {/* Subtle entity/people count chips */}
  {hasMetadata && (
    <Collapsible>
      <CollapsibleTrigger className="...">
        {hasEntities && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <Building2 className="h-3 w-3" />
            {entities.length}
          </span>
        )}
        {hasPeople && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <User className="h-3 w-3" />
            {people.length}
          </span>
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        {/* Entity and people chips */}
      </CollapsibleContent>
    </Collapsible>
  )}
</div>
```

**D. Unified Card Layout:**
```tsx
<div className="rounded-lg border border-border/50 bg-card/30 divide-y divide-border/30">
  {/* Overview Section */}
  <div className="p-3">
    <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-1.5">
      Overview
    </h3>
    <p className="text-sm text-foreground leading-relaxed">{summary}</p>
  </div>

  {/* Key Points Section */}
  {keyPoints.length > 0 && (
    <div className="p-3">
      <h3 className="...">Key Points</h3>
      <ul className="space-y-1.5 pl-4">
        {keyPoints.map(...)}
      </ul>
    </div>
  )}

  {/* Next Step Section */}
  <div className="p-3">
    <h3 className="...">Next Step</h3>
    <div className="flex items-center gap-2">
      {nextStep.isActionRequired ? (
        <Circle className="h-3.5 w-3.5 text-amber-500" />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
      )}
      <p className="text-sm text-foreground">{nextStep.label}</p>
    </div>
  </div>

  {/* Footer: Categories + Metadata */}
  {(categories.length > 0 || hasMetadata) && (
    <div className="p-3 flex items-center flex-wrap gap-2">
      {/* categories and metadata */}
    </div>
  )}
</div>
```

### 4. Polish InboxContentPane Header

**File: `src/components/inbox/InboxContentPane.tsx`**

**A. Simplify Forwarding Info:**

Replace the prominent block:
```tsx
// Before: Large card with heading
<div className="mb-4 p-2.5 rounded-lg bg-muted/30 border border-border">
  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">
    Forwarded by
  </p>
  <p className="text-xs font-medium text-foreground">{item.senderName}</p>
  <p className="text-[10px] text-muted-foreground">{item.senderEmail}</p>
</div>
```

With a subtle inline indicator:
```tsx
// After: Inline with sender info
<div className="flex items-center gap-3 mb-3">
  {/* Avatar */}
  <div className="w-9 h-9 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
    <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">{initial}</span>
  </div>
  
  {/* Sender info */}
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2">
      <span className="font-medium text-sm text-foreground">{displayFromName}</span>
      {getStatusBadge()}
    </div>
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="truncate">{displayFromEmail}</span>
      {/* Subtle forwarded indicator */}
      {showForwardingInfo && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/70">
              <Forward className="h-2.5 w-2.5" />
              via {item.senderName?.split(' ')[0]}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Forwarded by {item.senderName}</p>
            <p className="text-muted-foreground">{item.senderEmail}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  </div>
  
  {/* Timestamp */}
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="text-xs text-muted-foreground flex-shrink-0">{relativeTime}</span>
    </TooltipTrigger>
    <TooltipContent side="left"><p>{absoluteTime}</p></TooltipContent>
  </Tooltip>
</div>
```

**B. Reduce Header Padding:**
```tsx
// Before
<div className="flex-shrink-0 p-5 border-b border-border">

// After
<div className="flex-shrink-0 px-5 py-4 border-b border-border/50">
```

**C. Move Signal Badges to Footer Metadata:**

Remove the signal badges from the header area and incorporate them subtly into the "View original email" trigger:
```tsx
// In the collapsible trigger
<CollapsibleTrigger className="...">
  <ChevronDown className="..." />
  <span>View original email</span>
  {item.isForwarded && <Forward className="h-3 w-3 text-muted-foreground/50" />}
  {item.hasThread && <MessageSquareQuote className="h-3 w-3 text-muted-foreground/50" />}
</CollapsibleTrigger>
```

**D. Smaller Subject:**
```tsx
// Before
<h1 className="text-lg font-semibold text-foreground leading-tight mb-3">

// After: slightly smaller, tighter
<h1 className="text-base font-semibold text-foreground leading-snug mb-2">
```

---

## Files Changed Summary

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/[timestamp]_thread_context_columns.sql` | Create | Add thread_* columns |
| `supabase/functions/_shared/thread-parser.ts` | Create | Thread parsing logic |
| `supabase/functions/_shared/email-cleaner.ts` | Modify | Integrate thread parser, return thread context |
| `supabase/functions/_shared/email-extraction.ts` | Modify | v2 prompt, thread-aware extraction |
| `supabase/functions/email-inbox-ingest/index.ts` | Modify | Store thread fields, use v2 extraction |
| `supabase/functions/email-extract-structured/index.ts` | Modify | Use v2 prompt for manual re-extraction |
| `src/types/inbox.ts` | Modify | Add thread context fields |
| `src/hooks/useInboxItems.ts` | Modify | Map thread context fields |
| `src/components/inbox/StructuredSummaryCard.tsx` | Modify | Polish layout, fix bullets, unify design |
| `src/components/inbox/InboxContentPane.tsx` | Modify | Simplify header, subtle forwarding indicator |

---

## Visual Before/After

### Header (Before)
```text
[Avatar] Sender Name    [New]
         sender@email.com
                          2h ago

+----------------------------------+
| FORWARDED BY                     |
| Forwarder Name                   |
| forwarder@email.com              |
+----------------------------------+

Re: Fwd: Subject Line Here

[Fwd] [Thread] [Disclaimer]
```

### Header (After)
```text
[Avatar] Sender Name    [New]      2h ago
         sender@email.com  via John

Subject Line Here
```

### Summary Card (Before)
```text
+----------------------------------+
| OVERVIEW                         |
| Summary text here...             |
+----------------------------------+
+----------------------------------+
| KEY POINTS                       |
| ● Point one                      |
| ● Point two                      |
+----------------------------------+
+----------------------------------+
| NEXT STEP                        |
| [O] Action label                 |
|     Action required              |
+----------------------------------+

[Update] [Scheduling]

> 3 entities / 2 people
```

### Summary Card (After)
```text
+----------------------------------+
| OVERVIEW                         |
| Summary text here...             |
|----------------------------------|
| KEY POINTS                       |
|   - Point one                    |
|   - Point two                    |
|----------------------------------|
| NEXT STEP                        |
| [O] Action label                 |
|----------------------------------|
| [Update] [Scheduling] [3] [2]    |
+----------------------------------+
```

---

## Implementation Order

1. Database migration (thread context columns)
2. Thread parser module (new file)
3. Update email-cleaner.ts to integrate thread parser
4. Update email-extraction.ts with v2 prompt
5. Update email-inbox-ingest to store thread fields
6. Update frontend types and hooks
7. Polish StructuredSummaryCard
8. Polish InboxContentPane header
9. Update email-extract-structured for manual re-extraction
10. Deploy edge functions

---

## Testing Checklist

- Forward a multi-message email thread; verify thread context is captured
- Check extraction uses thread context for conversations with 2+ messages
- Verify next_step.label is exactly "No action required" when is_action_required is false
- Confirm bullet points align properly in Key Points section
- Verify "Forwarded by" shows as subtle tooltip, not prominent block
- Check signal badges appear only in "View original email" trigger
- Verify all existing functionality (link company, attachments, actions) still works
