
# Fix Inbox Email Cleaning and Add Attachment Ingestion

## Problem Summary

Two issues have been identified in the inbox system based on the Myles Patel email:

### Issue 1: Email Content Not Being Cleaned Properly
The displayed email shows:
- Harrison Kioko's signature (the forwarder) at the TOP instead of being stripped
- Google Calendar event metadata, RSVP buttons, and invite details
- Duplicate DISCLAIMER blocks at the bottom
- Quoted reply threads ("On Tue, Jan 13, 2026...wrote:")

**Root Cause**: The email cleaning logic in `src/lib/emailCleaners.ts`:
1. Strips content AFTER the forwarded marker but doesn't fully remove content BEFORE it (the forwarder's signature)
2. Lacks patterns for Google Calendar content blocks
3. Doesn't detect and strip quoted reply threads early enough
4. Isn't aggressive enough with disclaimer removal for duplicated blocks

### Issue 2: No Attachments Being Stored
The email says "I've gone ahead and attached our deck and some demos" but no attachments appear because:
- The `email-inbox-ingest` edge function has NO attachment handling code
- It doesn't parse the `attachments` array from the webhook payload
- It doesn't upload files to the `inbox-attachments` Supabase Storage bucket
- It doesn't create records in the `inbox_attachments` table

**Root Cause**: Attachment processing was never implemented in the edge function.

---

## Solution Architecture

```text
Forward Email Webhook
        │
        ▼
┌───────────────────────────────────────┐
│   email-inbox-ingest (Edge Function)  │
│   ─────────────────────────────────── │
│   1. Parse email fields               │
│   2. Parse attachments array   ← NEW  │
│   3. Upload to Storage bucket  ← NEW  │
│   4. Insert inbox_items record        │
│   5. Insert inbox_attachments  ← NEW  │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│   Frontend (InboxContentPane.tsx)     │
│   ─────────────────────────────────── │
│   1. Call cleanEmailContent()         │
│   2. Enhanced cleaning rules   ← FIX  │
│   3. Display cleaned content          │
│   4. InboxAttachmentsSection renders  │
└───────────────────────────────────────┘
```

---

## Phase 1: Enhance Email Content Cleaning

### File: `src/lib/emailCleaners.ts`

#### 1.1 Add Google Calendar Content Patterns

Add new patterns to detect and strip Google Calendar content:

```typescript
const CALENDAR_PATTERNS = [
  "Invitation from Google Calendar",
  "You are receiving this email because you are an attendee",
  "Forwarding this invitation could allow any recipient",
  "Join with Google Meet",
  "View all guest info",
  "Reply for ",
  "More options<https://calendar.google.com",
  "Yes<https://calendar.google.com/calendar/event?action=RESPOND",
  "No<https://calendar.google.com/calendar/event?action=RESPOND",
  "Maybe<https://calendar.google.com/calendar/event?action=RESPOND",
];
```

#### 1.2 Enhance Forwarded Wrapper Stripping

Currently the function strips content AFTER the forwarded marker. However, content BEFORE the marker (forwarder's signature) also needs to be stripped.

**Current behavior**: Keeps content before "---------- Forwarded message ----------"
**Needed behavior**: Discard content before the marker entirely

Update `stripForwardedWrapper()` to:
1. Find the forwarded marker
2. Look at content BEFORE the marker
3. If the content before is less than ~200 chars OR matches signature patterns, discard it completely

#### 1.3 Add Quoted Reply Thread Stripping

The `stripInlineQuotes` function exists but needs additional patterns for:
- `On [date], [name] <email> wrote:` patterns
- Horizontal rule blocks (`________________________________`)
- Nested reply chains with `From:` / `Sent:` / `To:` headers

#### 1.4 More Aggressive Disclaimer Removal

The current logic stops at the FIRST disclaimer. For emails with DUPLICATE disclaimers:
1. Find ALL disclaimer occurrences
2. Strip from the EARLIEST one that appears after meaningful content

#### 1.5 Strip Calendar Event Blocks

Add a new function `stripCalendarContent()` that removes:
- Lines starting with `Yes<`, `No<`, `Maybe<` (calendar RSVP links)
- `When:` / `Where:` / `Guests:` metadata blocks
- `This event has been updated` / `Changed:` lines
- Content between "Join with Google Meet" and end of calendar block

---

## Phase 2: Add Attachment Handling to Edge Function

### File: `supabase/functions/email-inbox-ingest/index.ts`

#### 2.1 Parse Attachments from Webhook Payload

Forward Email webhooks include attachments in the payload. Common structures:

```typescript
// Option A: Base64 embedded
payload.attachments = [
  {
    filename: "deck.pdf",
    contentType: "application/pdf",
    content: "base64-encoded-string...",
    size: 12345
  }
]

// Option B: URL references
payload.attachments = [
  {
    filename: "deck.pdf",
    contentType: "application/pdf",
    url: "https://...",
    size: 12345
  }
]
```

#### 2.2 Upload Attachments to Supabase Storage

For each attachment:
1. Generate a unique path: `{user_id}/{inbox_item_id}/{uuid}.{ext}`
2. Decode base64 content (or fetch from URL)
3. Upload to `inbox-attachments` bucket
4. Create `inbox_attachments` record

```typescript
// Pseudocode for attachment handling
const attachments = payload.attachments || [];

for (const att of attachments) {
  // Validate size (max 10MB)
  if (att.size > 10 * 1024 * 1024) {
    console.warn("Skipping large attachment", att.filename);
    continue;
  }

  // Decode content
  let fileBuffer: Uint8Array;
  if (att.content) {
    // Base64 encoded
    fileBuffer = base64Decode(att.content);
  } else if (att.url) {
    // Fetch from URL
    const response = await fetch(att.url);
    fileBuffer = new Uint8Array(await response.arrayBuffer());
  } else {
    continue;
  }

  // Generate storage path
  const ext = att.filename.split('.').pop() || '';
  const storagePath = `${user.id}/${inboxItemId}/${crypto.randomUUID()}${ext ? `.${ext}` : ''}`;

  // Upload to bucket
  const { error: uploadError } = await supabaseClient.storage
    .from("inbox-attachments")
    .upload(storagePath, fileBuffer, {
      contentType: att.contentType || "application/octet-stream",
    });

  if (uploadError) {
    console.error("Attachment upload failed", uploadError);
    continue;
  }

  // Create database record
  await supabaseClient.from("inbox_attachments").insert({
    inbox_item_id: inboxItemId,
    filename: att.filename,
    mime_type: att.contentType,
    size_bytes: att.size,
    storage_path: storagePath,
    created_by: user.id,
  });
}
```

#### 2.3 Return Inbox Item ID from Insert

Currently the function doesn't capture the inserted inbox item's ID. Update to use `.select().single()` to get the ID for attachment linking:

```typescript
const { data: inboxItem, error: insertError } = await supabaseClient
  .from("inbox_items")
  .insert(inboxItemData)
  .select("id")
  .single();
```

---

## Phase 3: Update InboxContentPane Display Logic

### File: `src/components/inbox/InboxContentPane.tsx`

#### 3.1 Prefer Cleaned Text Over HTML When Heavily Cleaned

If the cleaning process removed significant content (signatures, disclaimers, calendar blocks), prefer showing the cleaned plain text instead of trying to clean HTML which may still contain styled versions of the removed content.

```typescript
// Current logic is complex - simplify to:
// If significant cleaning was done, prefer cleaned text
const shouldUseText = cleanedEmail.cleaningApplied.length >= 2;
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/lib/emailCleaners.ts` | Modify | Add calendar patterns, enhance forwarder signature stripping, improve quote detection |
| `supabase/functions/email-inbox-ingest/index.ts` | Modify | Add attachment parsing, upload to storage, create inbox_attachments records |
| `src/components/inbox/InboxContentPane.tsx` | Modify | Simplify display logic to prefer cleaned text when significant cleaning occurred |

---

## Technical Details

### Email Cleaning Enhancement Details

**New Pattern Categories:**

1. **Calendar Content** (strip entire blocks):
   - `Invitation from Google Calendar`
   - RSVP lines: `Yes<https://`, `No<https://`, `Maybe<https://`
   - `View all guest info`, `More options`
   - Event metadata: `When:`, `Where:`, `Guests:`

2. **Forwarder Signature** (strip before marker):
   - If content before `---------- Forwarded message ----------` is < 300 chars
   - OR contains signature patterns (phone numbers, email addresses, company logos)
   - Discard it entirely

3. **Quoted Replies** (more patterns):
   - `On [weekday], [month] [day], [year] at [time] [name] <email> wrote:`
   - Horizontal lines: `________________________________`
   - Reply headers: `From:` / `Sent:` / `To:` / `Subject:` blocks after main content

### Attachment Handling Requirements

1. **Size Limits**: Skip attachments > 10MB
2. **Supported Types**: All types (PDF, images, documents, etc.)
3. **Storage Path**: `{user_id}/{inbox_item_id}/{uuid}.{ext}`
4. **Error Handling**: Continue processing other attachments if one fails
5. **Logging**: Log successful uploads and failures

### Forward Email Webhook Payload

The webhook payload likely includes:
```json
{
  "from": { "address": "...", "name": "..." },
  "to": { "address": "...", "name": "..." },
  "subject": "...",
  "text": "...",
  "html": "...",
  "attachments": [
    {
      "filename": "deck.pdf",
      "contentType": "application/pdf",
      "content": "base64...",
      "size": 12345
    }
  ]
}
```

If attachments come as URLs instead of base64, fetch them inline.

---

## Implementation Order

1. **Phase 1**: Email cleaning enhancements (frontend, immediate impact)
   - Add calendar content patterns
   - Improve forwarder signature stripping
   - Enhance quoted reply detection
   - More aggressive disclaimer removal

2. **Phase 2**: Attachment ingestion (backend)
   - Update edge function to parse attachments
   - Upload to Supabase Storage
   - Create inbox_attachments records
   - Deploy and test with a real email

3. **Phase 3**: Display logic cleanup
   - Simplify InboxContentPane text vs HTML decision

---

## Acceptance Criteria

1. **Email Content**: The Myles Patel email displays only the main message body ("Hey Harry..." through "Thanks, and talk soon!") without:
   - Harrison Kioko's signature at the top
   - Google Calendar event details
   - Quoted reply thread
   - DISCLAIMER blocks

2. **Attachments**: When an email with attachments arrives, they:
   - Are uploaded to `inbox-attachments` storage bucket
   - Have records created in `inbox_attachments` table
   - Display in InboxAttachmentsSection
   - Can be downloaded/previewed

3. **Existing Functionality**: All existing inbox features continue working:
   - Create Task (with attachment linking)
   - Link Company
   - Save to Company
   - Archive/Complete/Snooze
