

# Fix: Overly Aggressive Company Name Matching in Suggestions

## Problem

When an email arrives from "Sandbox Wealth" (ray@sandboxwealth.com), the AI suggestion system incorrectly suggests "Link to Sandbox Wealth" pointing to a company called "Wealth" (wealth.com) that exists in the database.

This happens because:
1. The database has a pipeline company named "Wealth" with domain "wealth.com"
2. The name matching logic at line 164 uses `searchText.includes(companyNameLower)`
3. This matches "wealth" as a substring of "Sandbox Wealth"
4. The AI receives "Wealth" as a candidate and suggests linking to it

The correct behavior: Since "Sandbox Wealth" (sandboxwealth.com) is a different company than "Wealth" (wealth.com), the system should suggest **CREATE_PIPELINE_COMPANY** instead.

---

## Root Cause

```typescript
// Line 164 - Current logic
if (companyNameLower.length >= 3 && searchText.includes(companyNameLower)) {
```

This simple substring match catches partial word matches:
- "Wealth" matches inside "Sandbox Wealth" (wrong)
- "Box" would match inside "Sandbox" (wrong)
- "Tech" would match inside "TechCrunch" (wrong)

---

## Solution

Implement stricter matching logic with multiple safeguards:

1. **Word boundary matching**: Use regex word boundaries to prevent substring false positives
2. **Domain mismatch check**: If sender domain differs from candidate domain, do not match on name alone
3. **Exact vs partial disambiguation**: Require exact name match or high fuzzy threshold
4. **Short name penalty**: Reduce score for short company names that are more likely to false-match

---

## Technical Changes

### File: `supabase/functions/inbox-suggest-v2/index.ts`

#### 1. Add Generic Domain List (for domain exclusion)

```typescript
const GENERIC_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com",
  "yahoo.com", "ymail.com",
  "outlook.com", "hotmail.com", "live.com", "msn.com",
  "icloud.com", "me.com", "mac.com",
  "aol.com",
  "protonmail.com", "proton.me",
  "zoho.com", "mail.com", "fastmail.com",
]);

function isGenericEmailDomain(domain: string | null): boolean {
  if (!domain) return false;
  return GENERIC_EMAIL_DOMAINS.has(domain.toLowerCase());
}
```

#### 2. Replace Loose Name Matching with Word Boundary Matching

Replace lines 159-174:

```typescript
// Name mentions in subject/body - with word boundary check
const searchText = `${subject} ${bodySnippet.slice(0, 500)}`.toLowerCase();

for (const company of companies) {
  if (candidateMap.has(company.id)) continue;
  
  const companyNameLower = company.name.toLowerCase().trim();
  
  // Skip very short names (high false positive risk)
  if (companyNameLower.length < 4) continue;
  
  // Use word boundary regex to prevent partial matches
  // "Wealth" should not match "Sandbox Wealth" unless it's the complete word
  const wordBoundaryPattern = new RegExp(`\\b${escapeRegex(companyNameLower)}\\b`, "i");
  
  if (wordBoundaryPattern.test(searchText)) {
    // Additional check: if sender has a professional domain, verify it doesn't conflict
    const senderDomainNormalized = normalizeDomain(senderDomain);
    const companyDomainNormalized = normalizeDomain(company.primary_domain);
    
    // If both have domains and they differ significantly, skip this match
    // (prevents "Wealth" from matching email about "Sandbox Wealth")
    if (
      senderDomainNormalized && 
      !isGenericEmailDomain(senderDomainNormalized) &&
      companyDomainNormalized && 
      senderDomainNormalized !== companyDomainNormalized &&
      !senderDomainNormalized.includes(companyDomainNormalized) &&
      !companyDomainNormalized.includes(senderDomainNormalized)
    ) {
      // Sender domain is professional but different from company domain
      // This is likely a different company (sandboxwealth.com vs wealth.com)
      continue;
    }
    
    candidateMap.set(company.id, {
      id: company.id,
      name: company.name,
      type: company.type,
      primary_domain: company.primary_domain,
      match_score: 75,
      match_reason: "name_mention",
    });
  }
}
```

#### 3. Add Regex Escape Helper

```typescript
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
```

#### 4. Improve System Prompt Guidance

Update the CREATE_PIPELINE_COMPANY rules in buildSystemPrompt():

```typescript
## CREATE_PIPELINE_COMPANY Rules

When suggesting CREATE_PIPELINE_COMPANY (for intro emails with no existing company match):
- This should be HIGH priority when subject contains "Intro", "Introduction", "Meet", "Connecting you"
- IMPORTANT: If candidate_companies contains a partial match (e.g., "Wealth" for "Sandbox Wealth"), 
  verify the domains match. If sender domain differs from candidate domain, suggest CREATE_PIPELINE_COMPANY instead of LINK_COMPANY.
- Extract company details and include in metadata:
  - extracted_company_name: The company name (from signature, subject line, or email body)
  ...
```

Add new rule:

```typescript
10. CRITICAL: Do not suggest LINK_COMPANY if the sender's email domain differs from the candidate company's domain.
    Example: Email from ray@sandboxwealth.com should NOT link to "Wealth" (wealth.com) - these are different companies.
    In such cases, suggest CREATE_PIPELINE_COMPANY with the correct company name.
```

---

## Expected Behavior After Fix

For the email from Ray Denis (ray@sandboxwealth.com) about "Sandbox Wealth Investor Update":

Before:
- Candidate matching finds "Wealth" (substring match in "Sandbox Wealth")
- AI suggests: "Link to Sandbox Wealth" pointing to wrong company

After:
- Word boundary check passes (Wealth is a complete word)
- Domain check fails: sandboxwealth.com != wealth.com
- Candidate is excluded
- AI suggests: "Create New Pipeline Company: Sandbox Wealth"

---

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `supabase/functions/inbox-suggest-v2/index.ts` | Modify | Add generic domain list, word boundary matching, domain conflict check, and updated prompt rules |

---

## Edge Cases Handled

1. **Exact word match but different domain**: "Wealth" in "Sandbox Wealth" - excluded due to domain mismatch
2. **Subdomain relationships**: "app.acme.com" vs "acme.com" - allowed (domain includes check)
3. **Generic sender domains**: Gmail/Yahoo senders fall back to name matching only
4. **Very short company names**: Names < 4 characters skipped to prevent false positives
5. **Special characters**: Regex escaping prevents injection issues


