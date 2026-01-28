
# Fix Email Disclaimer and Signature Cleaning

## Problem Summary

The current email cleaning logic has several bugs causing disclaimers, signatures, and forwarded wrappers to display in the cleaned view:

1. **HTML body bypasses text cleaning** - When rendering HTML, the cleaner only sanitizes scripts/styles but doesn't strip disclaimers
2. **Missing disclaimer patterns** - "CONFIDENTIALITY NOTE" is not in the pattern list
3. **Forwarder's signature retained** - Content BEFORE the forwarded marker (forwarder's signature) is kept
4. **Phone pattern incomplete** - "Direct Line:" not matched
5. **Inline quote pattern not handled** - Gmail-style "On [date] [person] wrote:" not detected

## Solution

### Phase 1: Fix emailCleaners.ts

**Add missing patterns:**

```text
DISCLAIMER_PATTERNS additions:
- "CONFIDENTIALITY NOTE"
- "CONFIDENTIALITY NOTE:"

PHONE_PATTERN update:
- Add "Direct Line" to the pattern: /(?:Tel|Phone|Mobile|Cell|Fax|Direct Line):/i
```

**Fix forwarded wrapper stripping:**

Currently the function keeps everything AFTER the forwarded marker. We need to:
1. Strip content BEFORE the forwarded marker (forwarder's signature)
2. Then strip the header block after the marker
3. Keep only the actual forwarded content

**Add inline quote detection:**

Detect patterns like:
- "On [date] [name] <email> wrote:"
- "On [date], [name] wrote:"

Strip content from this point onwards (it's quoted reply content).

**Apply cleaning to HTML body:**

Create a new function `cleanHtmlContent()` that:
1. Converts HTML to text for pattern detection
2. Identifies where disclaimers/signatures start in the text
3. Removes corresponding HTML elements or truncates at the right point
4. Falls back to rendering only the text portion if HTML cleaning is too complex

### Phase 2: Update InboxContentPane.tsx

**Prefer cleaned text when HTML cleaning fails:**

If the HTML body contains disclaimers that can't be cleanly stripped, fall back to displaying cleaned text instead of raw HTML with disclaimers.

**Add visual indicator for cleaning applied:**

Show what was cleaned in the "View original email" toggle label.

## Files to Modify

| File | Changes |
|------|---------|
| `src/lib/emailCleaners.ts` | Add patterns, fix forwarded stripping, add HTML cleaning |
| `src/components/inbox/InboxContentPane.tsx` | Prefer cleaned text over raw HTML with disclaimers |

## Implementation Details

### emailCleaners.ts Changes

**1. Add missing disclaimer patterns:**

```typescript
const DISCLAIMER_PATTERNS = [
  // ... existing patterns ...
  "CONFIDENTIALITY NOTE",
  "CONFIDENTIALITY NOTE:",
];
```

**2. Fix phone pattern:**

```typescript
const PHONE_PATTERN = /(?:Tel|Phone|Mobile|Cell|Fax|Direct Line|Direct):\s*[\d\s\-\+\(\)\.]+/i;
```

**3. Add inline quote pattern:**

```typescript
const INLINE_QUOTE_PATTERNS = [
  /On .+wrote:\s*$/im,
  /On .+, .+ <.+@.+> wrote:/im,
];
```

**4. Fix stripForwardedWrapper logic:**

```typescript
export function stripForwardedWrapper(text: string): {
  body: string;
  meta: ForwardedMeta | null;
  contentBeforeMarker: string | null;
} {
  // Find forwarded marker
  // If found:
  //   1. contentBeforeMarker = text before marker (forwarder's sig - discard)
  //   2. Parse header block after marker
  //   3. Return only the actual forwarded body content
}
```

**5. Add cleanHtmlContent function:**

For HTML bodies, we'll detect disclaimer positions in the text and try to find corresponding break points in HTML. If that's too complex, we render cleaned text instead.

### InboxContentPane.tsx Changes

**Smart rendering decision:**

```typescript
// If HTML exists but cleaning wasn't effective (disclaimers still present)
// prefer showing cleaned text
const shouldUseCleanedText = !hasHtmlBody || 
  (cleanedEmail.cleaningApplied.includes("disclaimers") && hasHtmlBody);
```

## Expected Outcome

After these fixes:
- Forwarder's signature (Harrison Kioko/Canapi) will be stripped
- "CONFIDENTIALITY NOTE" block will be stripped
- "DISCLAIMER:" block will be stripped
- Original sender's signature will be stripped
- Inline quoted content ("On [date] wrote:") will be stripped
- "View original email" will still show the complete raw content

## Testing Scenarios

1. Email with CONFIDENTIALITY NOTE - should be hidden
2. Email with DISCLAIMER: block - should be hidden
3. Forwarded email - forwarder's signature should be hidden
4. Email with "Direct Line:" phone - should trigger signature detection
5. Email with inline quoted reply - quoted portion should be hidden
