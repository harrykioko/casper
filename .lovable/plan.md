
# Server-Side Email Cleaning Pipeline

## Overview

This plan moves email content cleaning from the client (React `cleanEmailContent`) to the server (`email-inbox-ingest` edge function). The cleaned output is stored in the database, making it the single source of truth for all UI views and AI features.

## Why This Change?

The current client-side cleaning has fundamental issues:

1. **Inconsistent results** - Different views may clean differently
2. **Pattern failures** - Complex forwarded emails (like the Myles Patel calendar invite) aren't being cleaned properly because the frontend logic runs too late
3. **AI sees raw content** - The inbox suggestions edge function receives unprocessed bodies
4. **Performance** - Cleaning runs on every render instead of once at ingestion

Moving to server-side cleaning solves all of these by processing once at ingestion time.

## Database Schema Changes

Add new columns to `inbox_items` to store cleaned content and signals:

```text
inbox_items (existing + new columns)
├── text_body           (raw, keep for audit)
├── html_body           (raw, keep for audit)
├── cleaned_text        ← NEW: cleaned plain text for UI
├── display_snippet     ← NEW: cleaned snippet (280 chars)
├── display_subject     ← NEW: canonicalized subject (no Re:/Fwd:)
├── display_from_email  ← NEW: original sender (for forwards)
├── display_from_name   ← NEW: original sender name
├── is_forwarded        ← NEW: boolean signal
├── has_thread          ← NEW: boolean (quoted reply detected)
├── has_disclaimer      ← NEW: boolean (legal disclaimer detected)
└── has_calendar        ← NEW: boolean (calendar invite detected)
```

## Edge Function Changes

### File: `supabase/functions/email-inbox-ingest/index.ts`

The edge function will be updated to:

1. **Clean content at ingestion** using a new `extract-inbox-brief` helper module
2. **Store both raw and cleaned** in the database
3. **Set display fields** for canonicalized subject, original sender, etc.

### New Helper: `supabase/functions/_shared/email-cleaner.ts`

Create a shared module with the cleaning logic:

```text
email-cleaner.ts
├── stripHtml()           - HTML to plain text
├── detectForwarded()     - Find forwarded marker, extract original sender
├── canonicalizeSubject() - Remove Re:/Fwd:/FW:/AW: prefixes
├── stripQuotedReplies()  - Remove "On X wrote:" and following content
├── stripSignatures()     - Remove -- markers, mobile signatures
├── stripDisclaimers()    - Remove legal blocks
├── stripCalendarContent() - Remove Google Calendar metadata
├── normalizeWhitespace() - Collapse blank lines
├── capLength()           - Limit to ~4000 chars
└── extractBrief()        - Main pipeline (calls all above)
```

### Processing Pipeline

The cleaning order matters:

```text
1. HTML → Plain text (if no text_body)
2. Detect forwarded message + extract original sender
3. Canonicalize subject
4. Strip calendar blocks (aggressive cut)
5. Strip at signature delimiter (--)
6. Strip quoted reply threads
7. Strip disclaimers
8. Normalize whitespace
9. Cap length at ~4000 chars
10. Generate snippet (first 280 chars of cleaned text)
```

### Key Pattern Additions

These patterns are critical for the Myles Patel-style email:

**Calendar Block Indicators** (cut from first match):
- "Join with Google Meet"
- "This event has been updated"
- "action=RESPOND&eid="
- "Invitation from Google Calendar"
- Standalone "When" / "Location" / "Guests" lines

**Forwarded Wrapper** - Strip everything BEFORE the marker:
- If content before `---------- Forwarded message ----------` is < 300 chars or looks like a signature, discard it

**Quoted Replies**:
- `On [Day], [Month] [Date], [Year] at [Time] [Name] <email> wrote:`
- Horizontal rule + `From:` header block

**Signature Delimiters**:
- Standard RFC `--` on its own line
- Mobile: "Sent from my iPhone/iPad"
- Outlook: Name | Title patterns

## Frontend Changes

### File: `src/components/inbox/InboxContentPane.tsx`

Update to use the pre-cleaned fields:

```text
// Old: clean on render
const cleanedEmail = useMemo(() => {
  return cleanEmailContent(bodyContent, item.htmlBody);
}, [bodyContent, item.htmlBody]);

// New: use pre-cleaned fields from DB
const displayBody = item.cleanedText || item.body || item.preview || "";
const isForwarded = item.isForwarded || false;
const originalSender = item.displayFromEmail || item.senderEmail;
```

### File: `src/types/inbox.ts`

Extend the InboxItem interface:

```typescript
export interface InboxItem {
  // ...existing fields...
  cleanedText?: string | null;
  displaySnippet?: string | null;
  displaySubject?: string | null;
  displayFromEmail?: string | null;
  displayFromName?: string | null;
  isForwarded?: boolean;
  hasThread?: boolean;
  hasDisclaimer?: boolean;
  hasCalendar?: boolean;
}
```

### File: `src/hooks/useInboxItems.ts`

Update the row transformer to include new fields.

### File: `src/lib/emailCleaners.ts`

Keep as a **fallback only** for existing items that don't have `cleaned_text` populated. The file remains but is no longer the primary cleaner.

## Data Migration

Existing inbox items won't have cleaned fields. Two options:

1. **Lazy migration** - If `cleaned_text` is null, fall back to client-side cleaning (already works)
2. **Backfill script** - Optional: run a one-time query to update existing items

The lazy approach requires no migration and handles the transition gracefully.

## Files Changed Summary

| File | Action |
|------|--------|
| `supabase/migrations/XXXXXX_inbox_cleaned_fields.sql` | Add 8 new columns |
| `supabase/functions/_shared/email-cleaner.ts` | NEW: Server-side cleaning logic |
| `supabase/functions/email-inbox-ingest/index.ts` | Import cleaner, store cleaned fields |
| `src/types/inbox.ts` | Extend InboxItem interface |
| `src/hooks/useInboxItems.ts` | Map new DB columns |
| `src/components/inbox/InboxContentPane.tsx` | Use pre-cleaned fields |
| `src/components/dashboard/InboxDetailDrawer.tsx` | Use pre-cleaned fields |
| `src/lib/emailCleaners.ts` | Keep as fallback |

## Technical Details

### New Database Columns

```sql
ALTER TABLE inbox_items
  ADD COLUMN cleaned_text text,
  ADD COLUMN display_snippet text,
  ADD COLUMN display_subject text,
  ADD COLUMN display_from_email text,
  ADD COLUMN display_from_name text,
  ADD COLUMN is_forwarded boolean NOT NULL DEFAULT false,
  ADD COLUMN has_thread boolean NOT NULL DEFAULT false,
  ADD COLUMN has_disclaimer boolean NOT NULL DEFAULT false,
  ADD COLUMN has_calendar boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN inbox_items.cleaned_text IS 'Cleaned email body for UI display';
COMMENT ON COLUMN inbox_items.display_subject IS 'Canonicalized subject without Re:/Fwd: prefixes';
COMMENT ON COLUMN inbox_items.display_from_email IS 'Original sender email (extracted from forwards)';
```

### Cleaning Function Interface

```typescript
interface CleanedEmailResult {
  cleanedText: string;
  snippet: string;
  displaySubject: string;
  displayFromEmail: string | null;
  displayFromName: string | null;
  signals: {
    isForwarded: boolean;
    hasThread: boolean;
    hasDisclaimer: boolean;
    hasCalendar: boolean;
  };
}

function extractBrief(
  textBody: string,
  htmlBody: string | null,
  subject: string,
  fromEmail: string,
  fromName: string | null
): CleanedEmailResult;
```

### Edge Function Flow

```text
Webhook Payload
     │
     ▼
┌────────────────────────────────┐
│  1. Parse email fields         │
│  2. Call extractBrief()        │
│     - Clean text               │
│     - Detect forwards          │
│     - Canonicalize subject     │
│  3. Insert into inbox_items    │
│     - Raw: text_body, html_body│
│     - Cleaned: cleaned_text    │
│     - Display: display_*       │
│     - Signals: is_forwarded... │
│  4. Process attachments        │
└────────────────────────────────┘
```

## Expected Result

For the Myles Patel email, the `cleaned_text` column will contain:

```
Hey Harry,

No worries, we figured when your screen froze. Sorry for the delay in getting back - Wanted to get some stuff on the calendar before giving you availability. We should have time tomorrow. Feel free to use https://cal.com/myles-patel to make things easier and grab some time that works for you.

I've gone ahead and attached our deck and some demos. Let me know if you have any questions as you dig through.

Platform Overview: https://www.loom.com/share/...
PE Modeling: https://www.loom.com/share/...
VC Scenario Modeling: https://drive.google.com/...
PE IT Due Diligence: https://www.loom.com/share/...

Thanks, and talk soon!

Best,
Myles
```

With signals:
- `is_forwarded: true`
- `has_calendar: true`
- `has_thread: true`
- `has_disclaimer: true`
- `display_from_email: myles@pathlit.ai`
- `display_subject: 30 Min Meeting between Myles Patel and Harry Kioko`

## Acceptance Criteria

1. New forwarded emails display only the core message body
2. Calendar metadata, disclaimers, signatures, and quoted threads are stripped
3. Existing inbox items continue to work (fallback to client-side cleaning)
4. Attachments continue to be processed correctly
5. AI suggestions receive cleaned content for better analysis
6. "View original email" still shows the raw content

## Implementation Order

1. Database migration (add columns)
2. Create `_shared/email-cleaner.ts` module
3. Update `email-inbox-ingest/index.ts` to use cleaner
4. Update frontend types and hooks
5. Update UI components to prefer cleaned fields
6. Deploy and test with a new forwarded email
