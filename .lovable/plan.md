

# Fix Inbox Email Cleaning and Attachment Processing

## Problem Summary

Based on the screenshots and investigation, there are two distinct issues:

### Issue 1: Attachment Processing Fails
The edge function logs show:
```
TypeError: base64.includes is not a function
  at base64ToUint8Array
```

**Root Cause**: The `att.content` field from Forward Email is NOT a base64 string - it's a Buffer object (e.g., `{type: "Buffer", data: [72, 101, 108, 108, 111, ...]}`). The current code tries to call `.includes()` on this object, which fails.

### Issue 2: Email Content Not Cleaned
The displayed email still shows:
- Myles Patel's signature block after "Best, Myles"
- Quoted reply "On Tue, Jan 13, 2026 at 11:05 AM..."
- Reply header block (From:/Sent:/To:/Subject:/When:/Where:)
- Google Meet calendar content

**Root Cause**: The cleaning patterns exist but aren't aggressive enough. Specifically:
1. The `--` signature marker detection works but the signature content AFTER it isn't being cut
2. The inline quote pattern `On Tue, Jan 13...wrote:` should match but may not be matching the exact format
3. The calendar content after "Where: Google; https://meet.google.com" isn't being stripped

---

## Solution

### Part 1: Fix Attachment Buffer Handling

**File: `supabase/functions/email-inbox-ingest/index.ts`**

The `base64ToUint8Array` function must handle multiple input formats:

```typescript
function base64ToUint8Array(content: unknown): Uint8Array {
  // If already Uint8Array
  if (content instanceof Uint8Array) {
    return content;
  }
  
  // If it's a Buffer-like object with data array
  if (typeof content === 'object' && content !== null) {
    const obj = content as Record<string, unknown>;
    
    // Handle {type: "Buffer", data: [...]} format
    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return new Uint8Array(obj.data as number[]);
    }
    
    // Handle plain array
    if (Array.isArray(content)) {
      return new Uint8Array(content as number[]);
    }
  }
  
  // If it's a base64 string
  if (typeof content === 'string') {
    let cleanBase64 = content;
    // Handle data URIs
    if (content.includes(',')) {
      cleanBase64 = content.split(',')[1];
    }
    cleanBase64 = cleanBase64.replace(/\s/g, '');
    
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
  
  throw new Error(`Unsupported content format: ${typeof content}`);
}
```

Also update the attachment processing to log the content type for debugging:

```typescript
if (att.content) {
  console.log("Processing attachment content", {
    filename,
    contentType: typeof att.content,
    isBuffer: typeof att.content === 'object' && att.content?.type === 'Buffer',
  });
  // ...
}
```

### Part 2: Fix Email Cleaning Patterns

**File: `src/lib/emailCleaners.ts`**

#### 2.1 Enhanced Signature Detection

The `--` signature marker is found but content after isn't being cut. Strengthen the `stripSignatures` function:

```typescript
// In SIGNATURE_MARKERS array - ensure we catch standalone --
const SIGNATURE_MARKERS = [
  "\n--\n",      // Standalone
  "\n-- \n",     // With trailing space
  "\n\n--\n",    // With preceding blank
  // ...existing
];

// Also add: After finding --, cut AGGRESSIVELY
// Current code continues looking for patterns after --, but should cut there
```

#### 2.2 More Aggressive Quote Stripping

The current pattern may not match "On Tue, Jan 13, 2026 at 11:05 AM Harrison Kioko...wrote:". Add explicit patterns:

```typescript
const INLINE_QUOTE_PATTERNS = [
  // Existing patterns...
  // Add: Gmail's common format
  /On \w{3}, \w{3} \d{1,2}, \d{4} at \d{1,2}:\d{2}\s*[AP]M\s+[^<]+<[^>]+>\s*wrote:/im,
];
```

#### 2.3 Strip After "Best," or Sign-off

Add detection for common sign-offs that indicate end of meaningful content:

```typescript
const SIGNOFF_PATTERNS = [
  /^Best,?\s*$/im,
  /^Thanks,?\s*$/im,
  /^Regards,?\s*$/im,
  /^Cheers,?\s*$/im,
  /^Best regards,?\s*$/im,
];

// In cleanEmailContent after signature stripping:
// Look for signoff followed by short name, then cut after that
```

#### 2.4 Fix Processing Order

The current order is:
1. Strip forwarded wrapper ✓
2. Strip calendar content - patterns not matching
3. Strip inline quotes - patterns not matching
4. Strip disclaimers ✓
5. Strip signatures - `--` found but not cutting

**Recommended changes**:
- Strip signatures BEFORE inline quotes (the `--` marks a clear boundary)
- When `--` is found, cut EVERYTHING after it (don't look for more patterns)
- Add "Best,\nName" as a signature anchor

---

## Implementation Details

### Edge Function Changes

```typescript
// Line ~290 - Replace base64ToUint8Array function
function base64ToUint8Array(content: unknown): Uint8Array {
  // 1. Already Uint8Array
  if (content instanceof Uint8Array) {
    return content;
  }
  
  // 2. Buffer object: {type: "Buffer", data: [...]}
  if (typeof content === 'object' && content !== null) {
    const obj = content as Record<string, unknown>;
    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return new Uint8Array(obj.data as number[]);
    }
    if (Array.isArray(content)) {
      return new Uint8Array(content as number[]);
    }
  }
  
  // 3. Base64 string
  if (typeof content === 'string') {
    let cleanBase64 = content;
    if (content.includes(',')) {
      cleanBase64 = content.split(',')[1];
    }
    cleanBase64 = cleanBase64.replace(/\s/g, '');
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
  
  throw new Error(`Unsupported content type: ${typeof content}`);
}
```

### Email Cleaner Changes

**Enhanced stripSignatures function** - When `--` is found (double dash on its own line), cut everything after it including the line itself:

```typescript
// Find standalone -- or --\n pattern and cut there
const dashDashPattern = /\n--\s*\n/;
const dashMatch = result.match(dashDashPattern);
if (dashMatch && dashMatch.index !== undefined && dashMatch.index > 50) {
  result = result.substring(0, dashMatch.index).trim();
  return result; // Early return - nothing useful after --
}
```

**Enhanced stripInlineQuotes function** - Add the exact Gmail format pattern:

```typescript
// Add to INLINE_QUOTE_PATTERNS
/On \w{3}, \w{3} \d{1,2}, \d{4} at \d{1,2}:\d{2}\s*(?:AM|PM)\s+.+?wrote:/im,

// Also detect horizontal rule + From: pattern
const horizRuleFromPattern = /\n_{20,}\n+From:/im;
```

**New sign-off anchor detection**:

```typescript
// After all other cleaning, look for sign-off patterns
const signOffPattern = /\n\s*(Best|Thanks|Regards|Cheers),?\s*\n\s*([A-Z][a-z]+)/m;
const signOffMatch = result.match(signOffPattern);
if (signOffMatch && signOffMatch.index !== undefined) {
  // Keep content through "Best,\nMyles" but nothing after
  const afterSignOff = signOffMatch.index + signOffMatch[0].length;
  // Check if there's junk after the name (signature block)
  const remainingContent = result.substring(afterSignOff);
  if (remainingContent.trim().startsWith('--') || 
      remainingContent.trim().startsWith('[http') ||
      /^\s*\n\s*\n/.test(remainingContent)) {
    result = result.substring(0, afterSignOff).trim();
  }
}
```

---

## File Changes Summary

| File | Change |
|------|--------|
| `supabase/functions/email-inbox-ingest/index.ts` | Fix `base64ToUint8Array` to handle Buffer objects, add logging |
| `src/lib/emailCleaners.ts` | Enhance signature stripping (cut at `--`), add Gmail quote pattern, add sign-off detection |

---

## Testing

After implementation:
1. Forward a new test email to trigger edge function with attachment
2. Verify `inbox_attachments` table has a record
3. Verify the InboxAttachmentsSection shows the file
4. Verify cleaned email shows only core content

---

## Expected Cleaned Output

For the Myles Patel email, the cleaned text should be:

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

Everything after "Best,\nMyles" (the signature block, quoted replies, calendar content, disclaimers) should be stripped.

