import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type EnrichmentMode = "enrich_by_domain" | "enrich_by_linkedin" | "refresh" | "search_candidates";

interface RequestBody {
  pipeline_company_id: string;
  mode: EnrichmentMode;
  website_domain?: string;
  linkedin_url?: string;
  query_name?: string;
}

// Harmonic API company response structure
interface HarmonicApiCompany {
  id?: number;
  entity_urn?: string;
  name?: string;
  description?: string;
  short_description?: string;
  website?: { url?: string; domain?: string };
  socials?: {
    linkedin?: { url?: string };
    twitter?: { url?: string };
  };
  location?: {
    city?: string;
    state?: string;
    region?: string;
    country?: string;
  };
  headcount?: number;
  founding_date?: { date?: string };
  stage?: string;
  funding?: {
    total_raised_usd?: number;
    last_funding_round_date?: string;
  };
  people?: Array<{
    full_name?: string;
    title?: string;
    is_current?: boolean;
    socials?: { linkedin?: { url?: string } };
    highlights?: Array<{ category?: string }>;
  }>;
}

// Typeahead search result structure
interface TypeaheadResult {
  entity_urn: string;
  text: string;
  alt_text?: string;
  logo_url?: string;
}

function extractDomain(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];
  }
}

function formatHeadcount(count: number): string {
  if (count < 10) return "1-10";
  if (count < 50) return "11-50";
  if (count < 200) return "51-200";
  if (count < 500) return "201-500";
  if (count < 1000) return "501-1000";
  return "1000+";
}

function parseHarmonicResponse(data: HarmonicApiCompany, matchMethod: string) {
  // Extract key people from people array (filter for founders/executives)
  const keyPeople = (data.people || [])
    .filter((p) => 
      p.is_current && (
        p.highlights?.some(h => h.category === "FOUNDER") ||
        /ceo|founder|chief|co-founder|president|cto|cfo/i.test(p.title || "")
      )
    )
    .slice(0, 5)
    .map((p) => ({
      name: p.full_name || "Unknown",
      title: p.title || "",
      linkedin_url: p.socials?.linkedin?.url || null,
    }));

  // Use short_description preferentially, fallback to truncated description
  const shortDesc = data.short_description || data.description?.slice(0, 300) || null;
  const longDesc = data.description || null;

  return {
    harmonic_company_id: data.id ? String(data.id) : data.entity_urn || null,
    match_method: matchMethod,
    confidence: "high" as const,
    description_short: shortDesc,
    description_long: longDesc,
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

interface HarmonicCallResult {
  data: HarmonicApiCompany | null;
  error?: string;
  asyncPending?: boolean;
  asyncFailed?: boolean;
  enrichmentUrn?: string;
  debug: {
    status: number;
    bodySnippet: string;
    triggeredAsync: boolean;
    enrichmentId: string | null;
  };
}

async function callHarmonicEnrichment(
  apiKey: string,
  params: { website_domain?: string; linkedin_url?: string }
): Promise<HarmonicCallResult> {
  const url = new URL("https://api.harmonic.ai/companies");
  
  if (params.website_domain) {
    url.searchParams.set("website_domain", params.website_domain);
  } else if (params.linkedin_url) {
    url.searchParams.set("linkedin_url", params.linkedin_url);
  }

  console.log(`Calling Harmonic enrichment (POST): ${url.toString()}`);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      apikey: apiKey,
      "Content-Type": "application/json",
    },
  });

  console.log("Harmonic enrichment response status:", response.status);

  const rawText = await response.text();
  console.log("Harmonic raw response (first 2000 chars):", rawText.slice(0, 2000));

  let data: any = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch (e) {
    console.error("Failed to parse Harmonic response as JSON:", e);
    return {
      data: null,
      error: `Harmonic returned non-JSON: ${response.status}`,
      debug: { status: response.status, bodySnippet: rawText.slice(0, 500), triggeredAsync: false, enrichmentId: null },
    };
  }

  console.log("Harmonic response type:", Array.isArray(data) ? "array" : typeof data);
  console.log("Harmonic keys:", data && !Array.isArray(data) ? Object.keys(data) : null);

  // Handle auth errors
  if (response.status === 401 || response.status === 403) {
    return {
      data: null,
      error: "Harmonic API key invalid or missing",
      debug: { status: response.status, bodySnippet: rawText.slice(0, 500), triggeredAsync: false, enrichmentId: null },
    };
  }

  // Handle rate limiting
  if (response.status === 429) {
    console.log("Rate limited, retrying after 2s...");
    await new Promise((r) => setTimeout(r, 2000));
    
    const retryResponse = await fetch(url.toString(), {
      method: "POST",
      headers: { apikey: apiKey, "Content-Type": "application/json" },
    });

    console.log("Retry response status:", retryResponse.status);
    const retryRawText = await retryResponse.text();

    if (!retryResponse.ok) {
      return {
        data: null,
        error: `Harmonic API rate limited: ${retryResponse.status}`,
        debug: { status: retryResponse.status, bodySnippet: retryRawText.slice(0, 500), triggeredAsync: false, enrichmentId: null },
      };
    }

    try {
      const retryData = retryRawText ? JSON.parse(retryRawText) : null;
      return {
        data: Array.isArray(retryData) ? retryData[0] : retryData,
        debug: { status: retryResponse.status, bodySnippet: retryRawText.slice(0, 500), triggeredAsync: false, enrichmentId: null },
      };
    } catch (e) {
      return {
        data: null,
        error: `Harmonic retry returned non-JSON: ${retryResponse.status}`,
        debug: { status: retryResponse.status, bodySnippet: retryRawText.slice(0, 500), triggeredAsync: false, enrichmentId: null },
      };
    }
  }

  // Handle async enrichment (201 or 404 with entity_urn containing enrichment)
  const isAsyncTrigger = response.status === 201 || 
    (response.status === 404 && data?.entity_urn?.includes("enrichment"));
  
  if (isAsyncTrigger) {
    const enrichmentUrn = data?.entity_urn || data?.urn;
    console.log(`Async enrichment triggered: ${enrichmentUrn}`);

    if (enrichmentUrn) {
      // Poll up to 10 times at 1s intervals
      for (let attempt = 0; attempt < 10; attempt++) {
        console.log(`Polling enrichment status, attempt ${attempt + 1}/10...`);
        await new Promise(r => setTimeout(r, 1000));
        
        const statusUrl = `https://api.harmonic.ai/enrichment_status?urns=${encodeURIComponent(enrichmentUrn)}`;
        const statusResponse = await fetch(statusUrl, {
          headers: { apikey: apiKey },
        });

        const statusRaw = await statusResponse.text();
        console.log(`Enrichment status response (attempt ${attempt + 1}):`, statusRaw.slice(0, 500));

        let statusData: any[] = [];
        try {
          statusData = statusRaw ? JSON.parse(statusRaw) : [];
        } catch {
          continue;
        }

        const enrichmentStatus = statusData[0];
        
        if (enrichmentStatus?.status === "COMPLETE") {
          const companyUrn = enrichmentStatus.enriched_entity_urn;
          console.log(`Enrichment complete, fetching company: ${companyUrn}`);
          
          // Fetch the enriched company
          const companyResponse = await fetch(
            `https://api.harmonic.ai/companies/${encodeURIComponent(companyUrn)}`,
            { method: "GET", headers: { apikey: apiKey } }
          );
          
          const companyRaw = await companyResponse.text();
          console.log("Enriched company response:", companyRaw.slice(0, 1000));
          
          try {
            const companyData = JSON.parse(companyRaw);
            return {
              data: companyData,
              debug: { status: companyResponse.status, bodySnippet: companyRaw.slice(0, 500), triggeredAsync: true, enrichmentId: enrichmentUrn },
            };
          } catch {
            return {
              data: null,
              error: "Failed to parse enriched company data",
              debug: { status: companyResponse.status, bodySnippet: companyRaw.slice(0, 500), triggeredAsync: true, enrichmentId: enrichmentUrn },
            };
          }
        }
        
        if (enrichmentStatus?.status === "FAILED" || enrichmentStatus?.status === "NOT_FOUND") {
          console.log(`Enrichment failed with status: ${enrichmentStatus.status}`);
          return {
            data: null,
            error: "Enrichment failed or company not found in Harmonic",
            asyncFailed: true,
            debug: { status: response.status, bodySnippet: rawText.slice(0, 500), triggeredAsync: true, enrichmentId: enrichmentUrn },
          };
        }
      }

      // Polling timeout
      console.log("Enrichment polling timeout, returning pending state");
      return {
        data: null,
        error: "Enrichment still processing",
        asyncPending: true,
        enrichmentUrn,
        debug: { status: response.status, bodySnippet: rawText.slice(0, 500), triggeredAsync: true, enrichmentId: enrichmentUrn },
      };
    }
  }

  // Standard 404 - not found
  if (response.status === 404) {
    return {
      data: null,
      error: "No matching company found in Harmonic",
      debug: { status: response.status, bodySnippet: rawText.slice(0, 500), triggeredAsync: false, enrichmentId: null },
    };
  }

  // Other errors
  if (!response.ok) {
    console.error("Harmonic API error:", response.status, rawText.slice(0, 500));
    return {
      data: null,
      error: `Harmonic API error: ${response.status}`,
      debug: { status: response.status, bodySnippet: rawText.slice(0, 500), triggeredAsync: false, enrichmentId: null },
    };
  }

  // Success - handle array or single response
  const companyData = Array.isArray(data) ? data[0] : data;
  return {
    data: companyData || null,
    debug: { status: response.status, bodySnippet: rawText.slice(0, 500), triggeredAsync: false, enrichmentId: null },
  };
}

async function searchHarmonicTypeahead(
  apiKey: string,
  query: string
): Promise<{ candidates: any[]; error?: string }> {
  const url = new URL("https://api.harmonic.ai/search/typeahead");
  url.searchParams.set("query", query);
  url.searchParams.set("search_type", "COMPANY");

  console.log(`Searching Harmonic typeahead: ${url.toString()}`);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      apikey: apiKey,
      "Content-Type": "application/json",
    },
  });

  console.log("Harmonic typeahead response status:", response.status);

  const rawText = await response.text();
  console.log("Harmonic typeahead raw (first 2000 chars):", rawText.slice(0, 2000));

  if (!response.ok) {
    console.error("Harmonic typeahead error:", response.status, rawText.slice(0, 500));
    return { candidates: [], error: `Typeahead search failed: ${response.status}` };
  }

  let results: TypeaheadResult[] = [];
  try {
    const parsed = rawText ? JSON.parse(rawText) : [];
    // Results might be in a 'results' array or directly as array
    results = Array.isArray(parsed) ? parsed : (parsed.results || []);
  } catch (e) {
    console.error("Failed to parse typeahead response:", e);
    return { candidates: [], error: "Failed to parse search results" };
  }

  console.log(`Found ${results.length} typeahead results`);

  // Fetch company details for top 5 results to get full info
  const candidates = [];
  for (const result of results.slice(0, 5)) {
    if (!result.entity_urn) continue;
    
    try {
      const companyUrl = `https://api.harmonic.ai/companies/${encodeURIComponent(result.entity_urn)}`;
      const companyResponse = await fetch(companyUrl, {
        method: "GET",
        headers: { apikey: apiKey },
      });

      if (companyResponse.ok) {
        const companyData: HarmonicApiCompany = await companyResponse.json();
        candidates.push({
          harmonic_id: result.entity_urn,
          name: companyData.name || result.text,
          domain: extractDomain(companyData.website?.domain || companyData.website?.url),
          linkedin_url: companyData.socials?.linkedin?.url || null,
          logo_url: result.logo_url || null,
          hq: companyData.location?.city
            ? `${companyData.location.city}${companyData.location.state ? ", " + companyData.location.state : ""}`
            : null,
          employee_range: companyData.headcount ? formatHeadcount(companyData.headcount) : null,
          description_short: companyData.short_description || companyData.description?.slice(0, 200) || null,
          funding_stage: companyData.stage || null,
        });
      } else {
        // Fallback to basic typeahead info
        candidates.push({
          harmonic_id: result.entity_urn,
          name: result.text,
          domain: null,
          linkedin_url: null,
          logo_url: result.logo_url || null,
          hq: null,
          employee_range: null,
          description_short: result.alt_text || null,
          funding_stage: null,
        });
      }
    } catch (e) {
      console.error(`Failed to fetch company details for ${result.entity_urn}:`, e);
      // Still add with basic info
      candidates.push({
        harmonic_id: result.entity_urn,
        name: result.text,
        domain: null,
        linkedin_url: null,
        logo_url: result.logo_url || null,
        hq: null,
        employee_range: null,
        description_short: result.alt_text || null,
        funding_stage: null,
      });
    }
  }

  return { candidates };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const HARMONIC_API_KEY = Deno.env.get("HARMONIC_API_KEY");
    if (!HARMONIC_API_KEY) {
      console.error("HARMONIC_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Harmonic API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authData.user.id;
    const body: RequestBody = await req.json();
    const { pipeline_company_id, mode, website_domain, linkedin_url, query_name } = body;

    if (!pipeline_company_id) {
      return new Response(JSON.stringify({ error: "pipeline_company_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!mode) {
      return new Response(JSON.stringify({ error: "mode is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing enrichment: mode=${mode}, company_id=${pipeline_company_id}`);

    // Fetch the pipeline company
    const { data: company, error: companyError } = await supabase
      .from("pipeline_companies")
      .select("id, company_name, primary_domain, website, created_by")
      .eq("id", pipeline_company_id)
      .single();

    if (companyError || !company) {
      return new Response(JSON.stringify({ error: "Pipeline company not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user owns the company
    if (company.created_by !== userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle search_candidates mode
    if (mode === "search_candidates") {
      const searchQuery = query_name || company.company_name;
      console.log(`Searching candidates for: ${searchQuery}`);
      
      const { candidates, error } = await searchHarmonicTypeahead(HARMONIC_API_KEY, searchQuery);

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error, candidates: [] }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ success: true, candidates }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle refresh mode
    if (mode === "refresh") {
      const { data: existing } = await supabase
        .from("pipeline_company_enrichments")
        .select("*")
        .eq("pipeline_company_id", pipeline_company_id)
        .single();

      if (!existing) {
        return new Response(
          JSON.stringify({ error: "No existing enrichment found. Please enrich the company first." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const domain = extractDomain(company.website) || company.primary_domain;
      console.log(`Refreshing enrichment using domain: ${domain} or linkedin: ${existing.linkedin_url}`);

      const result = domain
        ? await callHarmonicEnrichment(HARMONIC_API_KEY, { website_domain: domain })
        : existing.linkedin_url
        ? await callHarmonicEnrichment(HARMONIC_API_KEY, { linkedin_url: existing.linkedin_url })
        : { data: null, error: "No domain or LinkedIn URL available for refresh", debug: { status: 0, bodySnippet: "", triggeredAsync: false, enrichmentId: null } };

      if (result.asyncPending) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            asyncPending: true, 
            enrichmentUrn: result.enrichmentUrn,
            message: "Enrichment still processing. Please try again in a moment.",
            harmonic_debug: result.debug,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (result.error || !result.data) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            notFound: result.asyncFailed || result.error?.includes("not found"),
            error: result.error || "Failed to refresh enrichment",
            harmonic_debug: result.debug,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const parsed = parseHarmonicResponse(result.data, existing.match_method || "domain");

      const { data: updated, error: updateError } = await supabase
        .from("pipeline_company_enrichments")
        .update({
          ...parsed,
          last_refreshed_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating enrichment:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update enrichment", harmonic_debug: result.debug }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          enrichment: updated,
          harmonic_debug: result.debug,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // enrich_by_domain or enrich_by_linkedin
    let domain = website_domain;
    let linkedIn = linkedin_url;
    const matchMethod = mode === "enrich_by_domain" ? "domain" : "linkedin";

    if (mode === "enrich_by_domain" && !domain) {
      domain = extractDomain(company.website) || company.primary_domain || undefined;
    }

    if (!domain && !linkedIn) {
      return new Response(
        JSON.stringify({ error: "No website domain or LinkedIn URL available for enrichment" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Enriching with: domain=${domain}, linkedin=${linkedIn}, method=${matchMethod}`);

    const result = domain
      ? await callHarmonicEnrichment(HARMONIC_API_KEY, { website_domain: domain })
      : await callHarmonicEnrichment(HARMONIC_API_KEY, { linkedin_url: linkedIn! });

    if (result.asyncPending) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          asyncPending: true, 
          enrichmentUrn: result.enrichmentUrn,
          message: "Enrichment processing. Data will be available shortly.",
          harmonic_debug: result.debug,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (result.error || !result.data) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          notFound: result.asyncFailed || result.error?.includes("not found"),
          error: result.error || "No company data returned",
          harmonic_debug: result.debug,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = parseHarmonicResponse(result.data, matchMethod);

    // Upsert enrichment
    const { data: enrichment, error: upsertError } = await supabase
      .from("pipeline_company_enrichments")
      .upsert(
        {
          pipeline_company_id,
          created_by: userId,
          enriched_at: new Date().toISOString(),
          last_refreshed_at: new Date().toISOString(),
          ...parsed,
        },
        { onConflict: "pipeline_company_id" }
      )
      .select()
      .single();

    if (upsertError) {
      console.error("Error upserting enrichment:", upsertError);
      return new Response(
        JSON.stringify({ error: "Failed to save enrichment", harmonic_debug: result.debug }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Enrichment saved for company ${pipeline_company_id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        enrichment,
        harmonic_debug: result.debug,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("harmonic-enrich-company error:", error);
    return new Response(
      JSON.stringify({ 
        error: (error as Error).message || "Unknown error",
        harmonic_debug: { status: 0, bodySnippet: String(error), triggeredAsync: false, enrichmentId: null },
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
