

# Fix: Fallback to Manual Match When Automatic Enrichment Fails

## Problem

When a user clicks "Enrich with Harmonic" and the Harmonic API returns a 404 (no company found by domain), the frontend currently:
1. Shows an error toast "No matching company found in Harmonic"
2. Leaves the user stuck with no way forward

The user needs to be automatically redirected to the manual match flow.

---

## Solution

Add logic to detect the specific "not found" error and automatically open the HarmonicMatchModal with a helpful message.

---

## Implementation Changes

### 1. Update Hook Return Type

**File:** `src/hooks/usePipelineEnrichment.ts`

Add a new return value to distinguish between "error" and "not found" states:

```typescript
// Add to return type
lastErrorType: 'not_found' | 'api_error' | null;

// In enrichCompany function, detect specific error:
if (data?.error === "No matching company found in Harmonic" || 
    invokeError?.message?.includes("404")) {
  setLastErrorType('not_found');
  // Don't show toast here - let parent handle the fallback UX
  return null;
}
```

### 2. Update OverviewTab to Handle Fallback

**File:** `src/components/pipeline-detail/tabs/OverviewTab.tsx`

Modify the `handleEnrich` function to detect the "not found" scenario and automatically open the modal:

```typescript
const handleEnrich = async () => {
  const domain = company.primary_domain || extractDomainFromWebsite(company.website);
  
  if (domain) {
    const result = await onEnrich('enrich_by_domain', { website_domain: domain });
    
    // If enrichment returned null and error was "not found", open manual match
    if (!result && lastErrorType === 'not_found') {
      toast.info('No automatic match found. Search for the company manually.');
      setMatchModalOpen(true);
    }
  } else {
    // No domain available - go straight to manual match
    setMatchModalOpen(true);
  }
};
```

### 3. Pass Error Type to OverviewTab

**File:** `src/pages/PipelineCompanyDetail.tsx`

Include the error type in the props passed down:

```typescript
const {
  enrichment,
  loading: enrichmentLoading,
  enriching,
  enrichCompany,
  searchCandidates,
  refreshEnrichment,
  lastErrorType, // Add this
} = usePipelineEnrichment(companyId);

// Pass to OverviewTab
<OverviewTab
  ...
  lastErrorType={lastErrorType}
/>
```

### 4. Update OverviewTab Props Interface

**File:** `src/components/pipeline-detail/tabs/OverviewTab.tsx`

```typescript
interface OverviewTabProps {
  // ... existing props ...
  lastErrorType?: 'not_found' | 'api_error' | null;
}
```

---

## Alternative Simpler Approach

Instead of modifying multiple files, we can simplify by:

1. **Modify only `usePipelineEnrichment.ts`** to return a result object that includes whether it was a "not found" error
2. **Modify only `OverviewTab.tsx`** to check the result and open the modal

This approach contains all changes to fewer files:

### Hook Change

```typescript
// enrichCompany returns { success: false, notFound: true } on 404
const enrichCompany = async (mode, options): Promise<{ 
  enrichment: HarmonicEnrichment | null; 
  notFound: boolean 
}> => {
  // ... existing logic ...
  
  if (data?.error === "No matching company found in Harmonic") {
    return { enrichment: null, notFound: true };
  }
  
  if (data?.enrichment) {
    // ... success handling ...
    return { enrichment: typedEnrichment, notFound: false };
  }
  
  return { enrichment: null, notFound: false };
};
```

### OverviewTab Change

```typescript
const handleEnrich = async () => {
  const domain = ...;
  if (domain) {
    const result = await onEnrich('enrich_by_domain', { website_domain: domain });
    
    if (result.notFound) {
      toast.info('No automatic match found. Search for the company manually.');
      setMatchModalOpen(true);
    }
  } else {
    setMatchModalOpen(true);
  }
};
```

---

## Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `src/hooks/usePipelineEnrichment.ts` | Update | Modify `enrichCompany` to return structured result with `notFound` flag |
| `src/components/pipeline-detail/tabs/OverviewTab.tsx` | Update | Handle `notFound` result by opening the manual match modal |
| `src/pages/PipelineCompanyDetail.tsx` | Update | Update prop types to match new hook signature |

---

## User Experience Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ User clicks "Enrich with Harmonic"                              │
│                                                                 │
│         ↓                                                       │
│ Edge function tries domain lookup (e.g., "oatfi.com")          │
│                                                                 │
│    ┌──────────────────┐        ┌────────────────────────────┐  │
│    │  Match found     │        │  404: No match found       │  │
│    └────────┬─────────┘        └──────────────┬─────────────┘  │
│             │                                  │                │
│             ↓                                  ↓                │
│    Show enrichment data          Show info toast:              │
│    in CompanyContextCard         "No automatic match found."   │
│                                                │                │
│                                                ↓                │
│                                  Auto-open HarmonicMatchModal   │
│                                  pre-filled with company name   │
│                                                │                │
│                                                ↓                │
│                                  User searches & selects match  │
│                                                │                │
│                                                ↓                │
│                                  Enrichment saved & displayed   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Testing Steps

1. Go to a pipeline company page (like OatFi)
2. Delete any existing enrichment record if present
3. Click "Enrich with Harmonic"
4. If 404 returned, verify:
   - Info toast appears: "No automatic match found. Search for the company manually."
   - HarmonicMatchModal opens automatically
   - Search field is pre-filled with company name
5. Search for the company manually
6. Select a candidate and verify enrichment is saved and displayed

