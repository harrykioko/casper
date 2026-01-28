

# Fix Email Signature Detection for Outlook-Style Signatures

## Problem Analysis

The current signature detection fails for your Outlook signature because:

1. **Position-based detection fails**: The logic only looks for phone patterns in the "last 10 lines" and only strips if the signature is in the "latter 50%" of the email. Your emails are short, so the signature isn't "at the end" percentage-wise
2. **Pattern matching is incomplete**: Outlook-style signatures have specific patterns like:
   - `Name | Title` format (pipe separator)
   - `C:` prefix for cell phone
   - `mailto:` links in email addresses
   - Bracketed company taglines like `[Canapi Ventures...]`
3. **No name-based detection**: We don't check if the sender's name appears as the start of a signature block

## Solution

Enhance the signature detection with Outlook-specific patterns:

### Pattern Updates for `emailCleaners.ts`

**1. Add Outlook-style signature markers:**
```typescript
const OUTLOOK_SIGNATURE_PATTERNS = [
  // Name | Title format (with pipe separator)
  /^[A-Z][a-z]+\s+[A-Z][a-z]+\s*\|\s*.+$/m,
  // C: or M: phone prefix (Outlook mobile format)
  /^[CM]:\s*\(?\d{3}\)?[\s\-]?\d{3}[\s\-]?\d{4}/m,
  // Email with mailto: link embedded
  /<mailto:[^>]+>/,
  // Bracketed company taglines
  /\[[A-Z][^]]{10,}\]/,
];
```

**2. Add sender-name based detection:**
When we know the sender's name (e.g., "Harrison Kioko"), look for a line starting with that name followed by `|` or a title-like word.

**3. Lower the position threshold:**
For short emails (under 500 characters of content), be more aggressive about signature detection since the signature-to-content ratio is higher.

**4. Add combined pattern detection:**
If 2+ signature indicators appear within 5 lines of each other, treat that block as a signature even if it's early in the email.

### Implementation Changes

| File | Changes |
|------|---------|
| `src/lib/emailCleaners.ts` | Add Outlook patterns, improve `stripSignatures()` with combined detection |
| `src/components/inbox/InboxContentPane.tsx` | Pass sender name to cleaner for name-based matching |

### Specific Code Changes

**Enhanced `stripSignatures` function:**

```typescript
export function stripSignatures(text: string, senderName?: string): string {
  let result = text;
  
  // 1. Check existing signature markers (unchanged)
  
  // 2. NEW: Check for Outlook-style "Name | Title" pattern
  if (senderName) {
    // Look for sender's name at start of a line followed by | or a role keyword
    const namePattern = new RegExp(
      `^${escapeRegex(senderName)}\\s*[|]`,
      "im"
    );
    const nameMatch = result.match(namePattern);
    if (nameMatch && nameMatch.index !== undefined) {
      // Found sender's name - this is likely signature start
      // Only strip if it's not too early (keep at least first 30 chars)
      if (nameMatch.index > 30) {
        result = result.substring(0, nameMatch.index).trim();
        return result;
      }
    }
  }
  
  // 3. NEW: Check for C:/M: phone pattern anywhere
  const cellPattern = /^[CM]:\s*\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}/m;
  const cellMatch = result.match(cellPattern);
  if (cellMatch && cellMatch.index !== undefined) {
    // Look back for the signature start (name line)
    const beforeCell = result.substring(0, cellMatch.index);
    const lines = beforeCell.split(/\r?\n/);
    // Check last 3 lines for name-like pattern
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 3); i--) {
      const line = lines[i].trim();
      // Name | Title pattern or short name-only line
      if (/^[A-Z][a-z]+\s+[A-Z][a-z]+\s*[|]/.test(line) || 
          (line.length > 5 && line.length < 50 && /^[A-Z]/.test(line))) {
        const cutIndex = result.indexOf(lines[i]);
        if (cutIndex > 30) {
          result = result.substring(0, cutIndex).trim();
          return result;
        }
      }
    }
    // If no name found, cut at cell line if not too early
    if (cellMatch.index > 50) {
      result = result.substring(0, cellMatch.index).trim();
      return result;
    }
  }
  
  // 4. Existing phone pattern check (unchanged but with lower threshold)
  // ... existing code with adjusted thresholds for short emails
  
  return result;
}
```

**Update `cleanEmailContent` to accept sender name:**

```typescript
export function cleanEmailContent(
  textBody: string | null,
  htmlBody: string | null,
  senderName?: string  // NEW optional parameter
): CleanedEmail {
  // ... existing code ...
  
  // Step 4: Strip signatures (pass sender name)
  const signatureResult = stripSignatures(cleanedText, senderName);
  // ... rest unchanged
}
```

**Update `InboxContentPane.tsx`:**

```typescript
const cleanedEmail = useMemo(() => {
  return cleanEmailContent(bodyContent, item.htmlBody, item.senderName);
}, [bodyContent, item.htmlBody, item.senderName]);
```

**Update `useInboxSuggestions.ts`:**

```typescript
const { cleanedText } = useMemo(() => {
  return cleanEmailContent(textBody, htmlBody);  // No sender name needed for suggestions
}, [textBody, htmlBody]);
```

## Expected Outcome

After these changes:
- Emails from yourself with `Harrison Kioko | Principal` will have signature stripped
- The `C: (917)...` phone pattern will trigger signature detection
- Short emails won't accidentally keep signatures due to percentage thresholds
- "View original email" still shows the full content

## Test Cases

| Email Type | Before | After |
|------------|--------|-------|
| Self-sent with Outlook sig | Shows full signature | Shows only body content |
| Forwarded email | Shows forwarder's sig | Strips both sigs, shows original content |
| Email with DISCLAIMER | Shows disclaimer | Strips at DISCLAIMER |
| Very short email (1 line + sig) | Might keep sig | Strips sig correctly |

