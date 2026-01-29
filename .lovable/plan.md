
# Fix Email Content Cleaning for Calendar Invite Emails

## Problem Analysis

The screenshot shows the email content is completely wrong - displaying calendar metadata (Location, Guests, Yes/No/Maybe links, Disclaimers) instead of the actual message body.

### Root Cause

Looking at the raw `text_body` from the database, the email structure is:

```
Lines 1-18:    Forwarder's signature (Harrison Kioko)
Line 20:       ---------- Forwarded message ----------  
Lines 21-25:   Forwarded headers (From:/Date:/Subject:/To:)
Lines 26-44:   **ACTUAL MESSAGE BODY** (Hey Harry... Best, Myles)
Lines 46-52:   Myles's signature block (--\nimage\nMyles Patel\n224-655-9835)
Lines 55-58:   Quoted reply (On Tue, Jan 13...wrote:)
Lines 60-67:   Reply headers (From:/Sent:/To:/Subject:/When:/Where:)
Lines 68-99:   Calendar update details (This event has been updated...)
Lines 101-120: Calendar metadata (When/Location/Guests/View all guest info/Yes/No/Maybe/Invitation from Google Calendar...)
Lines 122-124: DUPLICATE DISCLAIMER blocks
```

**The actual desired output is lines 26-44 only.**

The current cleaning is failing because:

1. **`stripSignatures` cuts at `--` (line 46)** - This works but returns too late
2. **The calendar content appears AFTER the signature** - So signature stripping should handle it
3. **BUT: The displayed content shows lines 101+ (calendar metadata)** - This means the cleaning output is wrong

After tracing through, the issue is:
- `stripForwardedWrapper` correctly extracts content after the marker
- `stripCalendarContent` checks each line but the exit logic `inCalendarBlock` exits on "substantive content" - the calendar lines like "Location" and "Google" are short and may not trigger the block
- Calendar patterns like `Location\nGoogle\nView map` don't match the existing patterns which look for `Where:` with a colon

### Solution

The fix needs to be more aggressive:

1. **Strip at `--` signature delimiter FIRST** - This will cut everything after "Best,\nMyles"
2. **Add more calendar metadata patterns** - `Location\n` (without colon), `Guests\n`, `When\n` as line starters
3. **Treat calendar links as hard stops** - Any line with `calendar.google.com/calendar/event?action=` should trigger cutting everything from that point forward
4. **Aggressive "block detection"** - If we see calendar content, cut from earliest match point rather than line-by-line filtering

---

## File Changes

### 1. `src/lib/emailCleaners.ts`

#### A. Add Early Calendar Block Detection

Add aggressive detection that finds the EARLIEST calendar marker and cuts from there:

```typescript
// NEW: Early-cut patterns for calendar blocks - cut from first match
const CALENDAR_BLOCK_STARTERS = [
  "This event has been updated",
  "This event has been changed", 
  "Join with Google Meet",
  "calendar.google.com/calendar/event?action=",
  "View all guest info<https://calendar",
  "Reply for ",
  "Invitation from Google Calendar",
];
```

In `cleanEmailContent()`, add a new step BEFORE existing calendar cleaning:

```typescript
// Step 1.5: Early calendar block cut - find first calendar block starter and cut
for (const starter of CALENDAR_BLOCK_STARTERS) {
  const idx = cleanedText.toLowerCase().indexOf(starter.toLowerCase());
  if (idx !== -1 && idx > 50) {
    cleanedText = cleanedText.substring(0, idx).trim();
    cleaningApplied.push("calendar_block_cut");
    break;
  }
}
```

#### B. Enhance Calendar Metadata Patterns

Update `CALENDAR_METADATA_PATTERNS` to catch headerless variants:

```typescript
const CALENDAR_METADATA_PATTERNS = [
  /^When:\s*.+$/im,
  /^Where:\s*.+$/im,
  /^Guests:\s*.+$/im,
  /^Calendar:\s*.+$/im,
  /^Who:\s*.+$/im,
  /^Video call:\s*.+$/im,
  // NEW: Standalone labels (no colon)
  /^When$/im,
  /^Where$/im,
  /^Location$/im,
  /^Guests$/im,
  /^Description$/im,
];
```

#### C. Add Calendar Link Detection in `stripCalendarContent`

Add pattern matching for long calendar URLs:

```typescript
// In stripCalendarContent, add to isCalendarLine check:
const isCalendarLine = 
  // ...existing checks...
  /action=RESPOND&eid=/i.test(lineTrimmed) ||
  /action=VIEW&eid=/i.test(lineTrimmed) ||
  /^Reply for /i.test(lineTrimmed) ||
  /^View map</i.test(lineTrimmed) ||
  /^View all guest info</i.test(lineTrimmed) ||
  /^More phone numbers</i.test(lineTrimmed) ||
  /^Join by phone/i.test(lineTrimmed) ||
  /^Meeting link/i.test(lineTrimmed) ||
  /^PIN:/i.test(lineTrimmed);
```

#### D. Add Aggressive Calendar Block Cutting

Add a new function that finds calendar blocks and cuts everything from first occurrence:

```typescript
function cutAtCalendarBlock(text: string): string {
  // Find the earliest calendar block indicator
  const calendarIndicators = [
    "This event has been updated",
    "This event has been changed",
    "Join with Google Meet<",
    "View all guest info<https://calendar",
    "Invitation from Google Calendar",
    "Reply for ",
    "\nWhen\n",  // Standalone "When" line
    "\nLocation\n", // Standalone "Location" line
    "\nGuests\n", // Standalone "Guests" line
    "Yes<https://calendar.google.com",
    "No<https://calendar.google.com", 
    "Maybe<https://calendar.google.com",
    "More options<https://calendar.google.com",
    "action=RESPOND&eid=",
    "action=VIEW&eid=",
  ];
  
  let earliestIndex = text.length;
  for (const indicator of calendarIndicators) {
    const idx = text.toLowerCase().indexOf(indicator.toLowerCase());
    if (idx !== -1 && idx > 50 && idx < earliestIndex) {
      earliestIndex = idx;
    }
  }
  
  if (earliestIndex < text.length) {
    return text.substring(0, earliestIndex).trim();
  }
  return text;
}
```

Call this function EARLY in the cleaning pipeline (after forwarded wrapper but before other cleaning).

#### E. Fix Processing Order

Update `cleanEmailContent()` to use this order:

```typescript
// Step 1: Extract and strip forwarded wrapper
// Step 2: Cut at calendar block (NEW - aggressive early cut)
// Step 3: Strip at signature delimiter (--)
// Step 4: Strip after sign-off (Best,\nName)
// Step 5: Strip inline quotes  
// Step 6: Strip disclaimers
// Step 7: Strip remaining signatures
```

This ensures we cut calendar content BEFORE signature stripping, so the `--` cut happens on the main body, not after calendar junk.

---

## Expected Result

After these changes, the Myles Patel email should display:

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

Everything after "Best,\nMyles" (signature block, quoted replies, calendar update, disclaimers) will be stripped.

---

## Technical Implementation

### Changes to `src/lib/emailCleaners.ts`

1. Add `CALENDAR_BLOCK_STARTERS` constant (hard-cut triggers)
2. Add `cutAtCalendarBlock()` function
3. Update `CALENDAR_METADATA_PATTERNS` with standalone labels
4. Update `stripCalendarContent()` with more URL patterns
5. Reorder steps in `cleanEmailContent()`:
   - Move calendar block cutting to happen immediately after forwarded wrapper extraction
   - Move signature stripping (`--`) before inline quote stripping

### No changes needed to:
- `InboxContentPane.tsx` - display logic already prefers cleaned text when cleaning was applied
- Edge function - attachment handling is working correctly

---

## Acceptance Criteria

1. The Myles Patel "30 Min Meeting" email displays only the core message body
2. No calendar metadata (Location, Guests, Yes/No/Maybe, View all guest info) appears
3. No disclaimer blocks appear  
4. No quoted reply threads appear
5. Myles's signature block after `--` is stripped
6. All existing emails continue to clean correctly (no regression)
