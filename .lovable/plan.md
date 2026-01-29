

# Harmonic Company Enrichment Implementation Plan

## Overview

This plan implements on-demand company enrichment using the Harmonic API for the Pipeline Company Detail page's Overview tab. The feature allows users to enrich pipeline companies with background information, funding data, and key people from Harmonic's database.

---

## Part 1: Fix Existing Build Errors

Before implementing new features, the existing TypeScript errors in edge functions must be fixed. These are simple type safety issues where `error` is typed as `unknown`.

### Files to Fix

| File | Issue | Fix |
|------|-------|-----|
| `supabase/functions/fetch-company-logo/index.ts` | `error` is `unknown` | Cast to `(error as Error).message` |
| `supabase/functions/inbox-suggest-v2/index.ts` | Type inference on `.data` returns `never` | Add explicit type annotations for query results |
| `supabase/functions/microsoft-auth/index.ts` | `dbException` is `unknown` | Cast to `(dbException as Error).message` |
| `supabase/functions/sync-outlook-calendar/index.ts` | `error` is `unknown` | Cast to `(error as Error).message` |

---

## Part 2: Database Schema

### New Table: `pipeline_company_enrichments`

A 1:1 relationship with `pipeline_companies` storing normalized Harmonic enrichment data.

```sql
CREATE TABLE pipeline_company_enrichments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_company_id UUID UNIQUE NOT NULL REFERENCES pipeline_companies(id) ON DELETE CASCADE,
  
  -- Harmonic identifiers
  harmonic_company_id TEXT,
  match_method TEXT CHECK (match_method IN ('domain', 'linkedin', 'search')),
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  
  -- Company info
  description_short TEXT,
  description_long TEXT,
  hq_city TEXT,
  hq_region TEXT,
  hq_country TEXT,
  employee_range TEXT,
  founding_year INTEGER,
  
  -- Funding info
  funding_stage TEXT,
  total_funding_usd NUMERIC,
  last_funding_date DATE,
  
  -- Links
  linkedin_url TEXT,
  twitter_url TEXT,
  
  -- Key people (founders, executives)
  key_people JSONB DEFAULT '[]',
  
  -- Full response for debugging
  source_payload JSONB,
  
  -- Timestamps
  enriched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_refreshed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id)
);

-- Index for lookups
CREATE INDEX idx_enrichments_pipeline_company ON pipeline_company_enrichments(pipeline_company_id);

-- Enable RLS
ALTER TABLE pipeline_company_enrichments ENABLE ROW LEVEL SECURITY;

-- RLS policies matching pipeline_companies patterns
CREATE POLICY "Users can view enrichments for their pipeline companies"
ON pipeline_company_enrichments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM pipeline_companies 
  WHERE id = pipeline_company_enrichments.pipeline_company_id 
  AND created_by = auth.uid()
));

CREATE POLICY "Users can create enrichments for their pipeline companies"
ON pipeline_company_enrichments FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM pipeline_companies 
  WHERE id = pipeline_company_enrichments.pipeline_company_id 
  AND created_by = auth.uid()
));

CREATE POLICY "Users can update enrichments for their pipeline companies"
ON pipeline_company_enrichments FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM pipeline_companies 
  WHERE id = pipeline_company_enrichments.pipeline_company_id 
  AND created_by = auth.uid()
));

CREATE POLICY "Users can delete enrichments for their pipeline companies"
ON pipeline_company_enrichments FOR DELETE
USING (EXISTS (
  SELECT 1 FROM pipeline_companies 
  WHERE id = pipeline_company_enrichments.pipeline_company_id 
  AND created_by = auth.uid()
));
```

---

## Part 3: Edge Function

### New Edge Function: `supabase/functions/harmonic-enrich-company/index.ts`

**Purpose**: Keep Harmonic API key server-side and provide a unified integration contract.

### Inputs (JSON body)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `pipeline_company_id` | string | Yes | UUID of the pipeline company |
| `mode` | string | Yes | One of: `enrich_by_domain`, `enrich_by_linkedin`, `refresh`, `search_candidates` |
| `website_domain` | string | No | Normalized domain (e.g., `palm.com`) |
| `linkedin_url` | string | No | Company LinkedIn URL |
| `query_name` | string | No | For candidate search only |

### Mode Behaviors

**A. `enrich_by_domain`**
```
GET https://api.harmonic.ai/companies?website_domain={domain}
Header: apikey: {HARMONIC_API_KEY}
```
- Parse response, extract normalized fields
- Upsert into `pipeline_company_enrichments`
- Return enrichment data

**B. `enrich_by_linkedin`**
```
GET https://api.harmonic.ai/companies?linkedin_url={linkedin_url}
Header: apikey: {HARMONIC_API_KEY}
```
- Same processing as domain mode

**C. `refresh`**
- Check if enrichment exists
- If exists: re-call Harmonic with stored domain/linkedin
- Update `last_refreshed_at`
- If not exists: return error prompting initial enrichment

**D. `search_candidates`** (for ambiguous matches)
- Use Harmonic company search with `query_name`
- Return array of candidates with minimal fields for picker UI

### Error Handling

| Status | Scenario | Response |
|--------|----------|----------|
| 401 | Missing/invalid Harmonic key | `{ error: "Harmonic API key invalid or missing" }` |
| 429 | Rate limited | Retry with backoff, then error |
| 404 | No company found | `{ error: "No matching company found in Harmonic" }` |
| 500 | API failure | `{ error: "Harmonic API error", details: "..." }` |

### Response Shape (success)

```typescript
{
  success: true,
  enrichment: {
    harmonic_company_id: string,
    confidence: 'high' | 'medium' | 'low',
    description_short: string | null,
    description_long: string | null,
    hq: { city?: string, region?: string, country?: string },
    employee_range: string | null,
    founding_year: number | null,
    funding_stage: string | null,
    total_funding_usd: number | null,
    last_funding_date: string | null,
    linkedin_url: string | null,
    twitter_url: string | null,
    key_people: Array<{ name: string, title: string, linkedin_url?: string }>,
    enriched_at: string,
    last_refreshed_at: string
  }
}
```

---

## Part 4: Frontend Types

### New File: `src/types/enrichment.ts`

```typescript
export interface HarmonicEnrichment {
  id: string;
  pipeline_company_id: string;
  harmonic_company_id?: string | null;
  match_method?: 'domain' | 'linkedin' | 'search' | null;
  confidence?: 'high' | 'medium' | 'low' | null;
  description_short?: string | null;
  description_long?: string | null;
  hq_city?: string | null;
  hq_region?: string | null;
  hq_country?: string | null;
  employee_range?: string | null;
  founding_year?: number | null;
  funding_stage?: string | null;
  total_funding_usd?: number | null;
  last_funding_date?: string | null;
  linkedin_url?: string | null;
  twitter_url?: string | null;
  key_people?: Array<{ name: string; title: string; linkedin_url?: string }>;
  enriched_at: string;
  last_refreshed_at: string;
}

export interface HarmonicCandidate {
  harmonic_id: string;
  name: string;
  domain?: string | null;
  logo_url?: string | null;
  hq?: string | null;
  employee_range?: string | null;
  description_short?: string | null;
  funding_stage?: string | null;
}

export type EnrichmentMode = 'enrich_by_domain' | 'enrich_by_linkedin' | 'refresh' | 'search_candidates';
```

---

## Part 5: Frontend Hook

### New File: `src/hooks/usePipelineEnrichment.ts`

```typescript
export function usePipelineEnrichment(companyId: string | undefined) {
  // State
  const [enrichment, setEnrichment] = useState<HarmonicEnrichment | null>(null);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing enrichment from database
  const fetchEnrichment = useCallback(async () => { ... });

  // Trigger enrichment via edge function
  const enrichCompany = async (
    mode: EnrichmentMode,
    options?: { website_domain?: string; linkedin_url?: string; query_name?: string }
  ) => { ... };

  // Search for candidates (when domain/linkedin missing)
  const searchCandidates = async (queryName: string): Promise<HarmonicCandidate[]> => { ... };

  // Refresh existing enrichment
  const refreshEnrichment = async () => { ... };

  return {
    enrichment,
    loading,
    enriching,
    error,
    enrichCompany,
    searchCandidates,
    refreshEnrichment,
    refetch: fetchEnrichment
  };
}
```

---

## Part 6: UI Components

### A. Company Context Card (Main Overview)

**New File: `src/components/pipeline-detail/overview/CompanyContextCard.tsx`**

Displays below MomentumPanel in OverviewTab.

**Empty State (no enrichment)**
```
┌─────────────────────────────────────────────────────┐
│ Company context                                      │
│                                                      │
│ Add Harmonic enrichment for background + key people. │
│                                                      │
│ [🔗 Enrich with Harmonic]  or  [🔍 Find match]      │
└─────────────────────────────────────────────────────┘
```

- Show "Enrich with Harmonic" if company has `primary_domain` or `website`
- Show "Find match" if neither exists (opens candidate picker modal)

**Enriched State**
```
┌─────────────────────────────────────────────────────┐
│ Company context                            [⟳] [✎]  │
│                                                      │
│ Short description here, clamped to 2 lines...       │
│ [Read more]                                          │
│                                                      │
│ [📍 SF, CA] [👥 51-200] [🎂 2019] [💰 Series A]     │
│                                                      │
│ Last refreshed: 3 days ago   Confidence: High ●      │
└─────────────────────────────────────────────────────┘
```

Chips only render if value exists and NOT already shown in hero header:
- HQ (city, region/country)
- Employee range
- Founded year
- Funding stage (only if different from `current_round` in header)

**Actions:**
- Refresh (⟳): calls `refreshEnrichment()`
- Change match (✎): opens candidate picker modal

### B. Key People Card

**New File: `src/components/pipeline-detail/overview/KeyPeopleCard.tsx`**

Only renders if `key_people` array has entries.

```
┌─────────────────────────────────────────────────────┐
│ Key people                                           │
│                                                      │
│ 👤 Alex Johnson • CEO                       [in] [+] │
│ 👤 Sarah Chen • Co-Founder & CTO            [in] [+] │
│                                                      │
└─────────────────────────────────────────────────────┘
```

- LinkedIn icon links to their profile
- [+] triggers "Add relationship note" → opens existing Add Note flow

### C. Match Company Modal

**New File: `src/components/pipeline-detail/overview/HarmonicMatchModal.tsx`**

Opens when user clicks "Find match" or "Change match".

```
┌─────────────────────────────────────────────────────┐
│ Match company in Harmonic                        [×] │
│                                                      │
│ Search: [Company name...     ] [Search]              │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🏢 Palm Inc.  •  palm.com  •  SF, CA            │ │
│ │ AI-powered payroll platform • 51-200 • Series B │ │
│ │                                    [Select →]    │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 🏢 Palm Technologies  •  palmtech.io            │ │
│ │ Enterprise software • 11-50 • Seed              │ │
│ │                                    [Select →]    │ │
│ └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

- Pre-fills search with company name
- Calls edge function `mode='search_candidates'`
- Selecting a candidate calls `enrich_by_domain` or `enrich_by_linkedin`

---

## Part 7: Update OverviewTab

**File: `src/components/pipeline-detail/tabs/OverviewTab.tsx`**

Add CompanyContextCard and KeyPeopleCard between MomentumPanel and DealSignals:

```tsx
export function OverviewTab({ company, ... }: OverviewTabProps) {
  const { enrichment, loading: enrichmentLoading, ... } = usePipelineEnrichment(company.id);

  return (
    <div className="space-y-6">
      <MomentumPanel ... />
      
      {/* NEW: Company context from Harmonic */}
      <CompanyContextCard
        company={company}
        enrichment={enrichment}
        loading={enrichmentLoading}
        onEnrich={...}
        onRefresh={...}
        onChangeMatch={...}
      />
      
      {/* NEW: Key people (only if enriched) */}
      {enrichment?.key_people?.length > 0 && (
        <KeyPeopleCard
          people={enrichment.key_people}
          companyId={company.id}
        />
      )}
      
      <DealSignals ... />
    </div>
  );
}
```

---

## Part 8: Right Rail Update

**File: `src/components/pipeline-detail/overview/StatusSnapshot.tsx`**

Add one line showing Harmonic connection status:

```tsx
// Add to StatusSnapshot props
enrichment?: HarmonicEnrichment | null;

// Add to render (after existing metrics)
<div className="flex items-center gap-2 text-sm">
  <Sparkles className="w-4 h-4" />
  <span className="text-muted-foreground">
    {enrichment ? (
      <>Harmonic: Connected <span className="text-xs">• {formatDistanceToNow(new Date(enrichment.last_refreshed_at))} ago</span></>
    ) : (
      'Harmonic: Not connected'
    )}
  </span>
</div>
```

---

## Part 9: Secret Management

Before the edge function can work, the Harmonic API key must be added:

**Required Secret: `HARMONIC_API_KEY`**

This will be added via the Supabase secrets UI and accessed in the edge function via `Deno.env.get("HARMONIC_API_KEY")`.

---

## Files Changed Summary

| File | Change Type | Description |
|------|-------------|-------------|
| `supabase/functions/fetch-company-logo/index.ts` | Fix | Type cast for `error` |
| `supabase/functions/inbox-suggest-v2/index.ts` | Fix | Type annotations for query results |
| `supabase/functions/microsoft-auth/index.ts` | Fix | Type cast for `dbException` |
| `supabase/functions/sync-outlook-calendar/index.ts` | Fix | Type cast for `error` |
| `supabase/migrations/xxx_add_enrichments.sql` | New | Create enrichments table with RLS |
| `supabase/functions/harmonic-enrich-company/index.ts` | New | Edge function for Harmonic API |
| `supabase/config.toml` | Update | Add harmonic-enrich-company function config |
| `src/types/enrichment.ts` | New | TypeScript types for enrichment |
| `src/hooks/usePipelineEnrichment.ts` | New | Hook for fetching/triggering enrichment |
| `src/components/pipeline-detail/overview/CompanyContextCard.tsx` | New | Main enrichment display card |
| `src/components/pipeline-detail/overview/KeyPeopleCard.tsx` | New | Key people display |
| `src/components/pipeline-detail/overview/HarmonicMatchModal.tsx` | New | Candidate picker modal |
| `src/components/pipeline-detail/tabs/OverviewTab.tsx` | Update | Add enrichment components |
| `src/components/pipeline-detail/overview/StatusSnapshot.tsx` | Update | Add Harmonic status line |
| `src/components/pipeline-detail/overview/index.ts` | Update | Export new components |

---

## Implementation Order

1. **Fix build errors** in existing edge functions
2. **Add secret** for HARMONIC_API_KEY
3. **Run migration** for enrichments table
4. **Create edge function** for Harmonic API
5. **Create types** for enrichment data
6. **Create hook** usePipelineEnrichment
7. **Create UI components** (CompanyContextCard, KeyPeopleCard, HarmonicMatchModal)
8. **Update OverviewTab** to integrate components
9. **Update StatusSnapshot** for rail indicator
10. **Test end-to-end** with a real pipeline company

---

## Non-Goals (Confirmed Not Changing)

- Left-side tab navigation remains unchanged
- Hero header is not redesigned
- Tasks/Notes/Files tabs are not modified
- No automatic background enrichment
- No AI suggestions for enrichment
- No new routes added

