
# Fix: Harmonic Enrichment Data Not Displaying

## Root Cause Analysis

There are two bugs preventing enrichment data from displaying:

### Bug 1: Backend - Array Response Not Handled

The Harmonic API returns an **array** of companies, not a single object. Looking at the saved `source_payload: []`, the current code:

```typescript
// Line 341 in edge function
const parsed = parseHarmonicResponse(data as HarmonicCompany, matchMethod);
```

When `data` is `[]` or `[{...company...}]`:
- Empty array `[]` has no properties, so all fields parse as `null`
- Single-element array `[{...}]` also has no direct properties

**Fix:** Extract the first element from the array before parsing:
```typescript
const companyData = Array.isArray(data) ? data[0] : data;
if (!companyData) {
  return { error: "No matching company found in Harmonic" };
}
const parsed = parseHarmonicResponse(companyData, matchMethod);
```

### Bug 2: Frontend - Duplicate Hook State

The page and `OverviewTab` each create their own `usePipelineEnrichment` hook instance:

```text
PipelineCompanyDetail.tsx
  └── usePipelineEnrichment(companyId) → enrichment (passed to rail)
  └── OverviewTab
        └── usePipelineEnrichment(company.id) → enrichment (used internally)
```

When `OverviewTab` calls `enrichCompany()`:
1. Its local hook updates with new data
2. The page-level hook remains stale
3. Rail shows "Not connected" because it receives the stale data

**Fix:** Lift enrichment logic to the page level and pass it down to OverviewTab as props.

---

## Implementation Changes

### 1. Edge Function Fix

**File:** `supabase/functions/harmonic-enrich-company/index.ts`

**Change:** Handle array responses from Harmonic API

```typescript
// After callHarmonicAPI returns, before parseHarmonicResponse
// Around line 334-341

// Current:
if (error || !data) {
  return ...
}
const parsed = parseHarmonicResponse(data as HarmonicCompany, matchMethod);

// Fixed:
if (error) {
  return Response with error
}

// Handle array response - Harmonic returns array
const companyData = Array.isArray(data) ? data[0] : data;
if (!companyData) {
  return Response with "No matching company found in Harmonic"
}

const parsed = parseHarmonicResponse(companyData as HarmonicCompany, matchMethod);
```

Apply the same fix to the `refresh` mode block (around line 289).

### 2. Lift Enrichment State to Page Level

**File:** `src/pages/PipelineCompanyDetail.tsx`

**Change:** Pass enrichment actions to OverviewTab instead of letting it create its own hook

```typescript
// Current (line 35):
const { enrichment } = usePipelineEnrichment(companyId);

// Changed to:
const {
  enrichment,
  loading: enrichmentLoading,
  enriching,
  enrichCompany,
  searchCandidates,
  refreshEnrichment,
} = usePipelineEnrichment(companyId);

// Pass to OverviewTab:
<OverviewTab
  company={company}
  tasks={tasks}
  enrichment={enrichment}
  enrichmentLoading={enrichmentLoading}
  enriching={enriching}
  onEnrich={enrichCompany}
  onSearchCandidates={searchCandidates}
  onRefreshEnrichment={refreshEnrichment}
  // ... other props
/>
```

### 3. Update OverviewTab Props

**File:** `src/components/pipeline-detail/tabs/OverviewTab.tsx`

**Change:** Remove internal hook, receive enrichment as props

```typescript
interface OverviewTabProps {
  // ... existing props ...
  
  // Add enrichment props:
  enrichment: HarmonicEnrichment | null;
  enrichmentLoading: boolean;
  enriching: boolean;
  onEnrich: (mode: EnrichmentMode, options?: EnrichOptions) => Promise<HarmonicEnrichment | null>;
  onSearchCandidates: (queryName: string) => Promise<HarmonicCandidate[]>;
  onRefreshEnrichment: () => Promise<HarmonicEnrichment | null>;
}

export function OverviewTab({
  company,
  tasks,
  enrichment,           // Receive from parent
  enrichmentLoading,    // Receive from parent
  enriching,            // Receive from parent
  onEnrich,             // Receive from parent
  onSearchCandidates,   // Receive from parent
  onRefreshEnrichment,  // Receive from parent
  // ...
}: OverviewTabProps) {
  // Remove: const { enrichment, ... } = usePipelineEnrichment(company.id);
  
  // Update handlers to use props:
  const handleEnrich = () => {
    const domain = ...;
    if (domain) {
      onEnrich('enrich_by_domain', { website_domain: domain });
    } else {
      setMatchModalOpen(true);
    }
  };
  
  // ... rest of component
}
```

---

## Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `supabase/functions/harmonic-enrich-company/index.ts` | Fix | Handle array response from Harmonic API in both enrich and refresh modes |
| `src/pages/PipelineCompanyDetail.tsx` | Update | Expand usePipelineEnrichment destructuring, pass enrichment props to OverviewTab |
| `src/components/pipeline-detail/tabs/OverviewTab.tsx` | Update | Remove internal hook, receive enrichment state and actions as props |

---

## Testing Steps

1. Delete the existing (empty) enrichment record for OatFi
2. Click "Enrich with Harmonic" button
3. Verify the company description, metadata chips, and key people appear
4. Verify the right rail shows "Harmonic: Connected" with refresh time
5. Test the Refresh button to ensure data updates
6. Test the Change Match flow to verify candidate selection works

---

## Technical Notes

- The Harmonic API `GET /companies?website_domain=` endpoint returns an array, not a single object
- The enrichment row with empty data needs to be refreshed or deleted to re-test
- Both bugs must be fixed together - fixing only one won't resolve the UI issue
