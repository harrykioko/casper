

# Harmonic Enrichment Integration - Implementation Plan

## Summary

This plan fixes the Edge Function to correctly use the Harmonic API (POST for enrichment, typeahead for search), handles async enrichment polling, and enhances the existing Company Context Card to become an information-dense workspace panel after enrichment.

---

## Part 1: Edge Function Fixes

### Current Issues Identified

1. **Enrichment uses GET instead of POST** - Harmonic's `/companies` enrichment endpoint requires POST
2. **Search uses wrong endpoint** - Currently uses `GET /search/companies` which returns 405. Should use `GET /search/typeahead?query=...&search_type=COMPANY`
3. **No async enrichment handling** - Harmonic returns 404 with an enrichment ID when data needs fetching; current code treats this as "not found"
4. **Response parsing mismatch** - The `HarmonicCompany` interface doesn't match Harmonic's actual response structure

### Changes to `supabase/functions/harmonic-enrich-company/index.ts`

**A. Update `HarmonicCompany` interface to match actual API response:**

```text
Based on API docs, structure is:
- id: number (not string)
- name: string
- description: string
- short_description: string
- website: { url: string, domain: string }
- location: { city, region, country, ... }
- socials: { linkedin: { url }, twitter: { url } }
- founding_date: { date: string }
- headcount: number (not string)
- stage: string (e.g., "SEED", "SERIES_A")
- funding: { total_raised_usd, last_funding_round_date, ... }
- people: array of employee objects with full_name, title, socials.linkedin.url
```

**B. Fix enrichment to use POST:**

```typescript
// Change from GET to POST
const response = await fetch(url.toString(), {
  method: "POST",  // <-- Was "GET"
  headers: {
    apikey: apiKey,
    "Content-Type": "application/json",
  },
});
```

**C. Handle async enrichment (201/404 with enrichment_id):**

```typescript
// If 201 or 404 with enrichment URN, poll for completion
if (response.status === 201 || (response.status === 404 && data?.entity_urn?.includes('enrichment'))) {
  const enrichmentUrn = data.entity_urn || data.urn;
  console.log(`Async enrichment triggered: ${enrichmentUrn}`);
  
  // Poll up to 10 times at 1s intervals
  for (let attempt = 0; attempt < 10; attempt++) {
    await new Promise(r => setTimeout(r, 1000));
    
    const statusResponse = await fetch(
      `https://api.harmonic.ai/enrichment_status?urns=${enrichmentUrn}`,
      { headers: { apikey } }
    );
    const statusData = await statusResponse.json();
    
    if (statusData[0]?.status === 'COMPLETE') {
      // Fetch enriched company
      const companyUrn = statusData[0].enriched_entity_urn;
      const companyResponse = await fetch(
        `https://api.harmonic.ai/companies/${companyUrn}`,
        { method: 'GET', headers: { apikey } }
      );
      return { data: await companyResponse.json() };
    }
    
    if (statusData[0]?.status === 'FAILED' || statusData[0]?.status === 'NOT_FOUND') {
      return { data: null, error: 'Enrichment failed or company not found', asyncFailed: true };
    }
  }
  
  // Timeout - return pending state
  return { data: null, error: 'Enrichment still processing', asyncPending: true, enrichmentUrn };
}
```

**D. Fix search to use typeahead endpoint:**

```typescript
// For search mode, use typeahead endpoint (GET, not POST)
if (params.query) {
  const typeaheadUrl = new URL("https://api.harmonic.ai/search/typeahead");
  typeaheadUrl.searchParams.set("query", params.query);
  typeaheadUrl.searchParams.set("search_type", "COMPANY");
  
  const response = await fetch(typeaheadUrl.toString(), {
    method: "GET",
    headers: { apikey: apiKey },
  });
  
  // Response contains results with entity_urn, text (company name), alt_text
  // Then fetch full company details for top N results
}
```

**E. Update `parseHarmonicResponse` to match actual response:**

```typescript
function parseHarmonicResponse(data: HarmonicApiCompany, matchMethod: string) {
  // Extract key people from people array (filter for founders/executives)
  const keyPeople = (data.people || [])
    .filter(p => p.is_current && (
      p.highlights?.some(h => h.category === 'FOUNDER') ||
      /ceo|founder|chief|co-founder|president/i.test(p.title || '')
    ))
    .slice(0, 5)
    .map(p => ({
      name: p.full_name || 'Unknown',
      title: p.title || '',
      linkedin_url: p.socials?.linkedin?.url || null,
    }));

  return {
    harmonic_company_id: String(data.id),
    match_method: matchMethod,
    confidence: 'high' as const,
    description_short: data.short_description || data.description?.slice(0, 300) || null,
    description_long: data.description || null,
    hq_city: data.location?.city || null,
    hq_region: data.location?.region || data.location?.state || null,
    hq_country: data.location?.country || null,
    employee_range: data.headcount ? formatHeadcount(data.headcount) : null,
    founding_year: data.founding_date?.date ? new Date(data.founding_date.date).getFullYear() : null,
    funding_stage: data.stage || null,
    total_funding_usd: data.funding?.total_raised_usd || null,
    last_funding_date: data.funding?.last_funding_round_date || null,
    linkedin_url: data.socials?.linkedin?.url || null,
    twitter_url: data.socials?.twitter?.url || null,
    key_people: keyPeople,
    source_payload: data,
  };
}

function formatHeadcount(count: number): string {
  if (count < 10) return '1-10';
  if (count < 50) return '11-50';
  if (count < 200) return '51-200';
  if (count < 500) return '201-500';
  if (count < 1000) return '501-1000';
  return '1000+';
}
```

**F. Add comprehensive debug response:**

```typescript
// Success response
return new Response(JSON.stringify({ 
  success: true, 
  enrichment,
  harmonic_debug: {
    triggered_async: wasAsync,
    enrichment_id: enrichmentUrn || null,
    response_status: responseStatus,
    match_method: matchMethod,
  }
}), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Error response
return new Response(JSON.stringify({ 
  error: message,
  harmonic_debug: {
    status: response.status,
    body_snippet: rawText.slice(0, 500),
  }
}), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
```

---

## Part 2: Frontend Component Updates

### A. Enhanced CompanyContextCard

The existing card already has empty, loading, and enriched states. Updates:

**Enriching state (skeleton):**
- Show 2-3 skeleton text lines
- Show skeleton chips for HQ, Employees, Founded

**Enriched state (dense layout within same card):**

```text
+--------------------------------------------------+
| [Sparkles] Company context          [Refresh][Edit] |
+--------------------------------------------------+
| [Description 2-3 lines, clamped]                    |
| "Read more" inline toggle                           |
|                                                     |
| [HQ: City, Region] [Employees: 51-200] [Founded: 2019] |
| [Funding: Series A - $12M - 2023-05]                |
|                                                     |
| ---- Key People ----                                |
| [Avatar] Jane Doe          CEO           [LinkedIn] |
| [Avatar] John Smith        CTO           [LinkedIn] |
| [Avatar] Alice Chen        CFO           [LinkedIn] |
| (If empty: "No key people available from Harmonic") |
|                                                     |
| [View raw JSON] (collapsed toggle)                  |
|                                                     |
| Footer: "Refreshed 2h ago"     [Confidence: High]   |
+--------------------------------------------------+
```

**Key changes to CompanyContextCard.tsx:**

1. **Merge KeyPeopleCard into this card** - Move key people rendering inline (not a separate card)
2. **Add funding info row** - Show formatted `total_funding_usd` + `last_funding_date`
3. **Add "View raw" collapsible** - JSON viewer for `source_payload` with copy button
4. **Better enriching state** - Show skeleton with chips layout

### B. Update OverviewTab

Remove the separate `<KeyPeopleCard>` component since it will be integrated into `CompanyContextCard`.

### C. HarmonicMatchModal Updates

Add support for linkedin_url-based enrichment when domain is not available:

```typescript
const handleSelectCandidate = async (candidate: HarmonicCandidate) => {
  if (candidate.domain) {
    await onEnrich('enrich_by_domain', { website_domain: candidate.domain });
  } else if (candidate.linkedin_url) {
    await onEnrich('enrich_by_linkedin', { linkedin_url: candidate.linkedin_url });
  } else {
    toast.error('Selected company has no domain or LinkedIn URL');
  }
};
```

### D. Update HarmonicCandidate Type

Add `linkedin_url` field:

```typescript
export interface HarmonicCandidate {
  harmonic_id: string;
  name: string;
  domain?: string | null;
  linkedin_url?: string | null;  // Add this
  logo_url?: string | null;
  hq?: string | null;
  employee_range?: string | null;
  description_short?: string | null;
  funding_stage?: string | null;
}
```

---

## Part 3: State Management Updates

### Hook Updates (`usePipelineEnrichment.ts`)

1. **Handle async pending state:**

```typescript
const [asyncPending, setAsyncPending] = useState(false);
const [asyncEnrichmentUrn, setAsyncEnrichmentUrn] = useState<string | null>(null);

// In enrichCompany:
if (data?.asyncPending) {
  setAsyncPending(true);
  setAsyncEnrichmentUrn(data.enrichmentUrn);
  toast.info('Enrichment processing. Data will be available shortly.');
  return { enrichment: null, notFound: false, pending: true };
}
```

2. **Add polling for pending enrichments** (optional, for future):

```typescript
// Could add a polling mechanism to check async status
// For MVP, user can manually refresh
```

---

## Files to Modify

| File | Change |
|------|--------|
| `supabase/functions/harmonic-enrich-company/index.ts` | Fix API calls (POST, typeahead), add async polling, update response parsing, add debug info |
| `src/components/pipeline-detail/overview/CompanyContextCard.tsx` | Merge key people inline, add funding row, add raw JSON viewer, improve skeleton state |
| `src/components/pipeline-detail/tabs/OverviewTab.tsx` | Remove separate KeyPeopleCard render |
| `src/components/pipeline-detail/overview/HarmonicMatchModal.tsx` | Support linkedin_url selection fallback |
| `src/types/enrichment.ts` | Add `linkedin_url` to `HarmonicCandidate` |
| `src/hooks/usePipelineEnrichment.ts` | Minor cleanup, optional async pending state |

---

## Visual Summary

```text
Before:
+-------------------+
| Company context   |
| [Empty CTA]       |
+-------------------+
| Key People (sep)  |  <-- Separate card
+-------------------+

After:
+-------------------------------------------+
| Company context             [Refresh][Edit]|
+-------------------------------------------+
| Description text, 2-3 lines clamped...     |
| "Read more"                                |
|                                            |
| [HQ chip] [Employees chip] [Founded chip]  |
| [Funding: Series A - $12M]                 |
|                                            |
| -- Key People --                           |
| Jane Doe, CEO                   [LinkedIn] |
| John Smith, CTO                 [LinkedIn] |
|                                            |
| [View raw JSON] (collapsed)                |
|                                            |
| Refreshed 2h ago         Confidence: High  |
+-------------------------------------------+
```

---

## Testing Steps

1. Test enrichment with a known company (e.g., stripe.com)
   - Verify POST request is sent
   - Verify data is parsed and persisted correctly
2. Test enrichment with unknown company
   - Verify async polling (if triggered)
   - Verify fallback to manual match modal
3. Test manual search in modal
   - Verify typeahead endpoint works
   - Verify selecting a candidate triggers enrichment
4. Test refresh functionality
5. Verify all UI states render correctly (loading, empty, enriched)
6. Verify raw JSON viewer works with copy button

