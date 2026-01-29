

# Add Comprehensive Harmonic API Logging for Debugging

## Problem

The edge function currently logs that it's *calling* Harmonic, but not:
- The HTTP status code returned
- The raw response body
- The structure/shape of the parsed JSON

This makes it impossible to determine whether:
- Harmonic returns 200 with JSON (and what shape)
- Harmonic returns 401/403/429/404
- Harmonic returns 200 with an array/wrapper we're not parsing correctly

## Solution

Add detailed logging to `callHarmonicAPI()` to capture response status, raw body preview, and parsed data structure. Also update "not found" scenarios to return HTTP 200 with `{ notFound: true }` instead of HTTP 404 to prevent runtime errors in the frontend.

---

## Implementation Changes

### File: `supabase/functions/harmonic-enrich-company/index.ts`

#### 1. Refactor `callHarmonicAPI()` to log response details

Replace the current fetch + response handling with comprehensive logging:

```typescript
async function callHarmonicAPI(
  apiKey: string,
  params: { website_domain?: string; linkedin_url?: string; query?: string }
): Promise<{ data: HarmonicCompany | HarmonicCompany[] | null; error?: string }> {
  const baseUrl = "https://api.harmonic.ai/companies";
  const url = new URL(baseUrl);

  if (params.website_domain) {
    url.searchParams.set("website_domain", params.website_domain);
  } else if (params.linkedin_url) {
    url.searchParams.set("linkedin_url", params.linkedin_url);
  } else if (params.query) {
    url.pathname = "/search/companies";
    url.searchParams.set("query", params.query);
    url.searchParams.set("limit", "10");
  }

  console.log(`Calling Harmonic API: ${url.toString()}`);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      apikey: apiKey,
      "Content-Type": "application/json",
    },
  });

  // LOG: Status code
  console.log("Harmonic response status:", response.status);

  // Read raw text to log before parsing
  const rawText = await response.text();
  console.log("Harmonic raw response (first 2000 chars):", rawText.slice(0, 2000));

  // Parse JSON safely
  let data: any = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch (e) {
    console.error("Failed to parse Harmonic response as JSON:", e);
    return { data: null, error: `Harmonic returned non-JSON: ${response.status}` };
  }

  // LOG: Data structure info
  console.log("Harmonic response type:", Array.isArray(data) ? "array" : typeof data);
  console.log("Harmonic array length:", Array.isArray(data) ? data.length : "N/A");
  console.log("Harmonic keys:", data && !Array.isArray(data) ? Object.keys(data) : null);
  console.log("Harmonic first item keys:", Array.isArray(data) && data[0] ? Object.keys(data[0]) : null);

  // Handle error status codes
  if (response.status === 401 || response.status === 403) {
    return { data: null, error: "Harmonic API key invalid or missing" };
  }

  if (response.status === 429) {
    // Rate limited - wait and retry once
    console.log("Rate limited, retrying after 2s...");
    await new Promise((r) => setTimeout(r, 2000));
    
    const retryResponse = await fetch(url.toString(), {
      method: "GET",
      headers: { apikey: apiKey, "Content-Type": "application/json" },
    });

    console.log("Retry response status:", retryResponse.status);
    const retryRawText = await retryResponse.text();
    console.log("Retry raw response (first 2000 chars):", retryRawText.slice(0, 2000));

    if (!retryResponse.ok) {
      return { data: null, error: `Harmonic API rate limited: ${retryResponse.status}` };
    }

    try {
      const retryData = retryRawText ? JSON.parse(retryRawText) : null;
      return { data: retryData };
    } catch (e) {
      return { data: null, error: `Harmonic retry returned non-JSON: ${retryResponse.status}` };
    }
  }

  if (response.status === 404) {
    return { data: null, error: "No matching company found in Harmonic" };
  }

  if (!response.ok) {
    console.error("Harmonic API error:", response.status, rawText.slice(0, 500));
    return { data: null, error: `Harmonic API error: ${response.status}` };
  }

  return { data };
}
```

#### 2. Return HTTP 200 with `notFound` flag instead of 404

Update the "no match found" response handling so the frontend doesn't receive a runtime error:

**In the main enrich flow (around line 352):**
```typescript
// Handle array response - Harmonic returns array of companies
const companyData = Array.isArray(data) ? data[0] : data;
if (!companyData) {
  // Return 200 with notFound flag instead of 404
  return new Response(
    JSON.stringify({ success: false, notFound: true, error: "No matching company found in Harmonic" }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

**In the refresh flow (around line 291):**
```typescript
const companyData = Array.isArray(data) ? data[0] : data;
if (!companyData) {
  // Return 200 with notFound flag instead of 404
  return new Response(
    JSON.stringify({ success: false, notFound: true, error: "No matching company found in Harmonic" }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

#### 3. Update frontend hook to handle `notFound` flag

**File: `src/hooks/usePipelineEnrichment.ts`**

Update the check to also look for `data?.notFound`:

```typescript
if (data?.notFound) {
  setError(data.error || 'No matching company found');
  return { enrichment: null, notFound: true };
}
```

---

## Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `supabase/functions/harmonic-enrich-company/index.ts` | Update | Add comprehensive logging to `callHarmonicAPI()`, change 404 responses to 200 with `notFound` flag |
| `src/hooks/usePipelineEnrichment.ts` | Update | Handle `data?.notFound` response from edge function |

---

## What the Logs Will Show

After deploying, the edge function logs will display:

```
Calling Harmonic API: https://api.harmonic.ai/companies?website_domain=wealth.com
Harmonic response status: 200
Harmonic raw response (first 2000 chars): [{"id":"abc123","name":"Wealth.com",...}]
Harmonic response type: array
Harmonic array length: 1
Harmonic keys: null
Harmonic first item keys: ["id","name","website","linkedin","location","headcount",...]
```

This will reveal:
- If Harmonic is returning data or empty array
- The actual field names in the response (to verify our `HarmonicCompany` interface)
- Any wrapper objects we're not accounting for

---

## Testing

1. Deploy the updated edge function
2. Trigger enrichment for a pipeline company (e.g., OatFi)
3. Check edge function logs for the new debug output
4. Based on logged response structure, adjust `parseHarmonicResponse()` if needed

