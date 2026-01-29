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

interface HarmonicCompany {
  id?: string;
  name?: string;
  description?: string;
  website?: { url?: string };
  linkedin?: { url?: string };
  twitter?: { url?: string };
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
  headcount?: string;
  founded_year?: number;
  funding?: {
    stage?: string;
    total_funding_usd?: number;
    last_funding_date?: string;
  };
  team?: Array<{
    full_name?: string;
    title?: string;
    linkedin_url?: string;
    is_founder?: boolean;
  }>;
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

function parseHarmonicResponse(data: HarmonicCompany, matchMethod: string) {
  const keyPeople = (data.team || [])
    .filter((p) => p.is_founder || /ceo|founder|chief|co-founder/i.test(p.title || ""))
    .slice(0, 5)
    .map((p) => ({
      name: p.full_name || "Unknown",
      title: p.title || "",
      linkedin_url: p.linkedin_url || null,
    }));

  return {
    harmonic_company_id: data.id || null,
    match_method: matchMethod,
    confidence: "high" as const,
    description_short: data.description?.slice(0, 300) || null,
    description_long: data.description || null,
    hq_city: data.location?.city || null,
    hq_region: data.location?.state || null,
    hq_country: data.location?.country || null,
    employee_range: data.headcount || null,
    founding_year: data.founded_year || null,
    funding_stage: data.funding?.stage || null,
    total_funding_usd: data.funding?.total_funding_usd || null,
    last_funding_date: data.funding?.last_funding_date || null,
    linkedin_url: data.linkedin?.url || null,
    twitter_url: data.twitter?.url || null,
    key_people: keyPeople,
    source_payload: data,
  };
}

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
    // For search mode, use search endpoint
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

  if (response.status === 401 || response.status === 403) {
    return { data: null, error: "Harmonic API key invalid or missing" };
  }

  if (response.status === 429) {
    // Rate limited - wait and retry once
    await new Promise((r) => setTimeout(r, 2000));
    const retryResponse = await fetch(url.toString(), {
      method: "GET",
      headers: {
        apikey: apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!retryResponse.ok) {
      return { data: null, error: `Harmonic API rate limited: ${retryResponse.status}` };
    }
    return { data: await retryResponse.json() };
  }

  if (response.status === 404) {
    return { data: null, error: "No matching company found in Harmonic" };
  }

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Harmonic API error:", response.status, errorText);
    return { data: null, error: `Harmonic API error: ${response.status}` };
  }

  const data = await response.json();
  return { data };
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

    console.log(`Processing enrichment: ${mode} for company ${pipeline_company_id}`);

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

    // Handle different modes
    if (mode === "search_candidates") {
      const searchQuery = query_name || company.company_name;
      const { data, error } = await callHarmonicAPI(HARMONIC_API_KEY, { query: searchQuery });

      if (error) {
        return new Response(JSON.stringify({ error }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const candidates = (Array.isArray(data) ? data : [data]).filter(Boolean).map((c: HarmonicCompany) => ({
        harmonic_id: c.id,
        name: c.name,
        domain: extractDomain(c.website?.url),
        logo_url: null,
        hq: c.location?.city
          ? `${c.location.city}${c.location.state ? ", " + c.location.state : ""}`
          : null,
        employee_range: c.headcount || null,
        description_short: c.description?.slice(0, 200) || null,
        funding_stage: c.funding?.stage || null,
      }));

      return new Response(JSON.stringify({ success: true, candidates }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mode === "refresh") {
      // Check if enrichment exists
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

      // Re-enrich using stored domain or linkedin
      const domain = extractDomain(company.website) || company.primary_domain;
      const { data, error } = domain
        ? await callHarmonicAPI(HARMONIC_API_KEY, { website_domain: domain })
        : existing.linkedin_url
        ? await callHarmonicAPI(HARMONIC_API_KEY, { linkedin_url: existing.linkedin_url })
        : { data: null, error: "No domain or LinkedIn URL available for refresh" };

      if (error || !data) {
        return new Response(JSON.stringify({ error: error || "Failed to refresh enrichment" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const parsed = parseHarmonicResponse(data as HarmonicCompany, existing.match_method || "domain");

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
        return new Response(JSON.stringify({ error: "Failed to update enrichment" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true, enrichment: updated }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    const { data, error } = domain
      ? await callHarmonicAPI(HARMONIC_API_KEY, { website_domain: domain })
      : await callHarmonicAPI(HARMONIC_API_KEY, { linkedin_url: linkedIn! });

    if (error || !data) {
      return new Response(JSON.stringify({ error: error || "No company data returned" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = parseHarmonicResponse(data as HarmonicCompany, matchMethod);

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
      return new Response(JSON.stringify({ error: "Failed to save enrichment" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Enrichment saved for company ${pipeline_company_id}`);

    return new Response(JSON.stringify({ success: true, enrichment }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("harmonic-enrich-company error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
