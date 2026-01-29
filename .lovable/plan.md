
# Inbox Sender + Summary Normalization

## Current State Analysis

The database and edge function **already have most of the required infrastructure** in place:

### Already Implemented
| Field | Exists | Notes |
|-------|--------|-------|
| `is_forwarded` | ✅ | boolean default false |
| `display_from_name` | ✅ | Original sender name (for forwards) |
| `display_from_email` | ✅ | Original sender email (for forwards) |
| `display_subject` | ✅ | Canonicalized subject (Fwd:/Re: stripped) |
| `display_snippet` | ✅ | ~280 char cleaned preview |
| `cleaned_text` | ✅ | Full cleaned body |
| `has_thread/disclaimer/calendar` | ✅ | Signal flags |

### What's Missing
| Field | Purpose |
|-------|---------|
| `forwarded_by_email` | Track who forwarded the email |
| `summary` | Short (~120 char) one-sentence summary |
| `summary_source` | 'heuristic' or 'ai' |
| `summary_updated_at` | When summary was last updated |

### Root Cause of "From Harrison Kioko" Bug
The **UI components are not using the `display_*` fields**. `InboxItemRow.tsx` uses `item.senderName` and `item.subject` instead of `displayFromName` and `displaySubject`.

---

## Solution Overview

### Part 1: Database Schema (Minimal + Additive)

Add 3 new columns to `inbox_items`:

```sql
ALTER TABLE inbox_items
ADD COLUMN forwarded_by_email TEXT,
ADD COLUMN summary TEXT,
ADD COLUMN summary_source TEXT DEFAULT 'heuristic',
ADD COLUMN summary_updated_at TIMESTAMPTZ;
```

### Part 2: Update Edge Function (email-inbox-ingest)

Enhance the ingestion pipeline:

1. **Track forwarded_by_email** - Store the email of the user who forwarded the message
2. **Generate one-sentence summary** - Create a ~120 char heuristic summary synchronously

The `extractBrief` function in `email-cleaner.ts` will be enhanced to:
- Return a new `summary` field (first sentence, max 120 chars)
- The existing cleaned pipeline already handles forward detection and sender extraction

### Part 3: Update TypeScript Types

Update `src/types/inbox.ts`:

```typescript
export interface InboxItem {
  // ... existing fields ...
  
  // NEW fields
  forwardedByEmail?: string | null;
  summary?: string | null;
  summarySource?: 'heuristic' | 'ai' | null;
  summaryUpdatedAt?: string | null;
}
```

### Part 4: Fix InboxItemRow (Critical!)

Update `src/components/inbox/InboxItemRow.tsx` to use display fields:

```tsx
// Current (broken)
{item.senderName}
{item.subject}
{item.preview}

// Fixed
{item.displayFromName || item.senderName}
{item.displaySubject || item.subject}
{item.summary || item.displaySnippet || item.preview}
```

Add subtle badges:
- "Forwarded" badge if `item.isForwarded`
- "Note" badge if sender is the current user (sent from self)

### Part 5: Fix InboxContentPane (Detail Pane)

Currently already correct! It uses `displayFromName`, `displayFromEmail`, `displaySubject`, and shows "Forwarded by" section. No changes needed.

---

## Detailed File Changes

### 1. Database Migration

```sql
-- Add summary and forwarded_by tracking
ALTER TABLE inbox_items
ADD COLUMN IF NOT EXISTS forwarded_by_email TEXT,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS summary_source TEXT DEFAULT 'heuristic',
ADD COLUMN IF NOT EXISTS summary_updated_at TIMESTAMPTZ;
```

### 2. `supabase/functions/_shared/email-cleaner.ts`

Add summary generation to `CleanedEmailResult`:

```typescript
export interface CleanedEmailResult {
  // ... existing ...
  summary: string;  // NEW: ~120 char one-sentence summary
}
```

Update `extractBrief` to generate summary:
- Take first meaningful sentence from cleaned text
- Strip greetings ("Hi [Name]," etc.)
- Truncate to 120 chars
- Return as `summary` field

### 3. `supabase/functions/email-inbox-ingest/index.ts`

Update to store new fields:

```typescript
const inboxItemData = {
  // ... existing ...
  forwarded_by_email: cleanedResult.signals.isForwarded ? senderEmail : null,
  summary: cleanedResult.summary,
  summary_source: 'heuristic',
  summary_updated_at: new Date().toISOString(),
};
```

### 4. `src/types/inbox.ts`

Add new type fields:

```typescript
export interface InboxItem {
  // ... existing ...
  forwardedByEmail?: string | null;
  summary?: string | null;
  summarySource?: 'heuristic' | 'ai' | null;
  summaryUpdatedAt?: string | null;
}
```

### 5. `src/hooks/useInboxItems.ts`

Update `InboxItemRow` interface and `transformRow`:

```typescript
interface InboxItemRow {
  // ... existing ...
  forwarded_by_email?: string | null;
  summary?: string | null;
  summary_source?: string | null;
  summary_updated_at?: string | null;
}

function transformRow(row: InboxItemRow): InboxItem {
  return {
    // ... existing ...
    forwardedByEmail: row.forwarded_by_email,
    summary: row.summary,
    summarySource: row.summary_source as 'heuristic' | 'ai' | null,
    summaryUpdatedAt: row.summary_updated_at,
  };
}
```

### 6. `src/components/inbox/InboxItemRow.tsx` (Critical Fix!)

Replace raw sender/subject with display fields:

```tsx
export function InboxItemRow({ item, ... }) {
  // Use display fields with fallbacks
  const displayName = item.displayFromName || item.senderName;
  const displaySubject = item.displaySubject || item.subject;
  const displayPreview = item.summary || item.displaySnippet || item.preview;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div ...>
      {/* Avatar */}
      <div className="w-10 h-10 ...">
        <span className="...">{initial}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={cn("text-sm truncate", ...)}>
            {displayName}
          </span>
          {/* NEW: Forwarded badge */}
          {item.isForwarded && (
            <Badge variant="outline" className="text-[9px] h-4 px-1.5">
              Fwd
            </Badge>
          )}
          {/* ... rest unchanged ... */}
        </div>
        <p className={cn("text-sm truncate", ...)}>
          {displaySubject}
        </p>
        {displayPreview && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {displayPreview}
          </p>
        )}
      </div>
      {/* ... actions unchanged ... */}
    </div>
  );
}
```

---

## Visual Before/After

```text
BEFORE (broken):
┌─────────────────────────────────────────────────────────┐
│ [H] Harrison Kioko                           2 hours ago│
│     Fwd: Intro - Alex Chen <> ComplyCo                  │
│     ---------- Forwarded message ---------- From: Al... │
└─────────────────────────────────────────────────────────┘

AFTER (fixed):
┌─────────────────────────────────────────────────────────┐
│ [A] Alex Chen                 [Fwd]          2 hours ago│
│     Intro - ComplyCo                                    │
│     Would love to connect regarding the partnership...  │
└─────────────────────────────────────────────────────────┘
```

---

## Files Changed Summary

| File | Change |
|------|--------|
| `supabase/migrations/xxx_add_inbox_summary.sql` | Add 4 columns |
| `supabase/functions/_shared/email-cleaner.ts` | Add summary generation |
| `supabase/functions/email-inbox-ingest/index.ts` | Store new fields |
| `src/types/inbox.ts` | Add 4 new type fields |
| `src/hooks/useInboxItems.ts` | Transform new fields |
| `src/components/inbox/InboxItemRow.tsx` | Use display_* fields, add badges |

---

## Non-Goals (Explicitly Excluded)

- No changes to auth, routing, or permissions
- No changes to inbox architecture
- No new inbox actions
- No AI summary (async) - future enhancement
- No styling changes outside inbox components
- No broad refactors

---

## Success Criteria

1. Inbox rows show original sender (not "Harrison Kioko") for forwarded emails
2. Subject line is clean (no "Fwd:" prefix)
3. Preview shows one-sentence summary instead of raw forwarded headers
4. "Fwd" badge indicates forwarded emails
5. Detail pane continues to work correctly (already does)
6. System is correct when additional users are added
