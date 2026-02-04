
## What’s happening (root cause)

The “Sandbox Wealth” email in the drawer is a forwarded email:

- `from_email` / `from_name` in `inbox_items` are the forwarder (you / Harrison).
- The real sender is stored in the cleaned “display” fields: `display_from_email = ray@sandboxwealth.com`, `display_from_name = Ray Denis`.
- The UI correctly shows “Ray Denis … via Harrison” by using `display_*` fields.

However, the **`inbox-suggest-v2` edge function currently uses `from_email`**, so it thinks the sender domain is `canapi.com`. That causes two bad downstream effects:
1) Candidate matching uses the forwarder’s domain + history and surfaces unrelated “existing companies” (like “Wealth”).
2) The model then confidently outputs LINK_COMPANY and even describes it as “portfolio” in the rationale, because the whole context is skewed.

There is also a second issue: even when the real sender domain is used, the current domain-conflict logic uses `includes()` checks that incorrectly treat `sandboxwealth.com` as “related” to `wealth.com` (because `"sandboxwealth.com".includes("wealth.com") === true`). This allows false matches like “Wealth” when the email is actually about “Sandbox Wealth”.

## Goals for the fix

1) Candidate matching and intent classification should use the **effective sender** (`display_from_email` when present).
2) Name-mention matching must **not** treat `sandboxwealth.com` as a subdomain of `wealth.com`.
3) When the model chooses a `company_id`, we should **normalize** `company_name` and `company_type` to the candidate record to prevent incorrect labeling.

## Implementation plan

### A) Use “effective” email fields in `inbox-suggest-v2` (forward-aware)

**File:** `supabase/functions/inbox-suggest-v2/index.ts`

1) Update the inbox item fetch to include display/cleaned fields:
- `display_from_email`, `display_from_name`
- `display_subject`, `cleaned_text`
- (optional) `thread_clean_text` if you want better context

2) Compute “effective” values:
- `effectiveFromEmail = item.display_from_email ?? item.from_email`
- `effectiveFromName = item.display_from_name ?? item.from_name`
- `effectiveSubject = item.display_subject ?? item.subject`
- `effectiveBody = item.thread_clean_text ?? item.cleaned_text ?? item.text_body ?? ""`

3) Pass these effective values into:
- `fetchCandidateCompanies(supabase, effectiveFromEmail, effectiveSubject, effectiveBody)`
- `callOpenAI(effectiveSubject, effectiveBody, effectiveFromEmail, effectiveFromName, candidates)`

This ensures forwarded emails behave like “normal” emails for suggestion logic.

### B) Fix domain “relatedness” logic (replace `includes` with real subdomain checks)

**File:** `supabase/functions/inbox-suggest-v2/index.ts`

1) Add a small helper:
- `domainsAreSameOrSubdomain(a, b)` returns true only if:
  - `a === b`, OR
  - `a.endsWith("." + b)`, OR
  - `b.endsWith("." + a)`

2) Update the name-mention domain conflict guard:
- Today it uses `includes()` which is too permissive.
- Replace it with `domainsAreSameOrSubdomain(senderDomainNormalized, companyDomainNormalized)`.

Result: `sandboxwealth.com` will correctly be treated as NOT related to `wealth.com`.

### C) Improve domain matching to support true subdomains (optional but recommended)

**File:** `supabase/functions/inbox-suggest-v2/index.ts`

Currently, domain matches only fire when company domain exactly equals sender domain.

Update the “domain match” block so that if:
- `senderDomainNormalized === companyDomainNormalized` OR
- `senderDomainNormalized.endsWith("." + companyDomainNormalized)`
then it counts as a domain match (high score).

This helps real-world cases like `mail.acme.com` matching `acme.com`, without introducing the `includes()` bug.

### D) Make prior-link history forwarded-aware (avoid “forwarder history” pollution)

**File:** `supabase/functions/inbox-suggest-v2/index.ts`

In the “Prior links from same sender” query and comparisons:
1) Select `display_from_email` in addition to `from_email`.
2) When comparing sender identity/domain for history, use:
- `priorEffectiveFromEmail = prior.display_from_email ?? prior.from_email`
- compare to `effectiveFromEmail` and its domain

This prevents the forwarder email (`canapi.com`) from becoming the “sender history” key.

### E) Normalize `company_name` and `company_type` based on candidates (prevents “portfolio” mislabel)

**File:** `supabase/functions/inbox-suggest-v2/index.ts`

Enhance `validateCompanyReferences()`:

- Build a `Map<candidateId, candidate>` from `candidates`.
- For each suggestion with `company_id`:
  - If candidate exists:
    - Force `suggestion.company_name = candidate.name`
    - Force `suggestion.company_type = candidate.type`
  - If candidate does not exist:
    - Clear `company_id`, `company_name`, `company_type` (existing behavior)

This ensures the UI never reflects a hallucinated “portfolio vs pipeline” type for a known candidate.

### F) (Small) Give the model better candidate context

**File:** `supabase/functions/inbox-suggest-v2/index.ts`

Update the `candidateList` text to include:
- `Domain: ${c.primary_domain ?? "null"}`
- `Match: ${c.match_reason} (${c.match_score})`

This helps the model understand why a candidate is present and reduces “confident but wrong” narrative in rationale.

## How we’ll verify the fix (end-to-end)

1) In `/triage`, open the “Sandbox Wealth Investor Update” email again.
2) Click **Regenerate** (force) to bypass the 1-hour cache.
3) Confirm in Suggested Actions:
   - “Link to Sandbox Wealth” to “Wealth” no longer appears.
   - A “Create New Pipeline Company: Sandbox Wealth” suggestion appears (or at minimum, “Add to Pipeline” becomes the top relevant recommendation).
4) Confirm the intent badge is no longer incorrectly anchored on the forwarder’s context (it should not be “Portfolio Update” solely due to forwarder history).
5) (Dev verification) Check edge logs for `inbox-suggest-v2`:
   - It should log the effective sender as `ray@sandboxwealth.com`.
   - Candidate companies should no longer be dominated by `canapi.com` sender-history matches.

## Files to change

- `supabase/functions/inbox-suggest-v2/index.ts`
  - Use `display_*`/`cleaned_*` fields for effective sender/subject/body
  - Fix domain relationship logic (no `includes()` for domain comparisons)
  - Make prior-link history forwarded-aware
  - Normalize AI outputs (`company_name`, `company_type`) from candidates
  - Improve candidate context sent to OpenAI

## Risks / edge cases and mitigations

- Risk: Some forwarded emails may not have `display_from_email` populated.
  - Mitigation: Always fallback to raw `from_email`.
- Risk: Tightening domain conflict checks could hide legitimate matches for true subdomains.
  - Mitigation: Use `endsWith("." + domain)` subdomain logic, not strict inequality.
- Risk: After changes, existing cached suggestions may still show until TTL expires.
  - Mitigation: Use the existing “Regenerate” button (force) to immediately refresh for the affected email(s).
