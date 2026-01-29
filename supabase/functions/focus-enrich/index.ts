// focus-enrich: AI enrichment for work queue items
// Extracts summaries, highlights, entities, and suggested actions from source content

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

interface EnrichRequest {
  source_type: string;
  source_id: string;
  user_id: string;
}

interface EnrichmentOutput {
  one_liner: string;
  summary: string;
  entities: Array<{ name: string; type: string; confidence: number }>;
  highlights: string[];
  decisions: string[];
  followups: string[];
  suggested_actions: Array<{ type: string; description: string; priority: string }>;
  confidence_overall: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { source_type, source_id, user_id } = (await req.json()) as EnrichRequest;

    if (!source_type || !source_id || !user_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: source_type, source_id, user_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch source content
    const sourceContent = await fetchSourceContent(supabase, source_type, source_id);
    if (!sourceContent) {
      return new Response(
        JSON.stringify({ error: "Source content not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch candidate companies for entity matching
    const candidates = await fetchCandidateCompanies(supabase);

    // Call AI for enrichment
    const enrichment = await callAIEnrichment(sourceContent, source_type, candidates);

    if (!enrichment) {
      return new Response(
        JSON.stringify({ error: "AI enrichment failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Persist extracts
    const extractRows = [];

    if (enrichment.one_liner || enrichment.summary) {
      extractRows.push({
        created_by: user_id,
        source_type,
        source_id,
        extract_type: "summary",
        content: { one_liner: enrichment.one_liner, summary: enrichment.summary },
      });
    }

    if (enrichment.highlights.length > 0) {
      extractRows.push({
        created_by: user_id,
        source_type,
        source_id,
        extract_type: "highlights",
        content: { items: enrichment.highlights },
      });
    }

    if (enrichment.decisions.length > 0) {
      extractRows.push({
        created_by: user_id,
        source_type,
        source_id,
        extract_type: "decisions",
        content: { items: enrichment.decisions },
      });
    }

    if (enrichment.followups.length > 0) {
      extractRows.push({
        created_by: user_id,
        source_type,
        source_id,
        extract_type: "followups",
        content: { items: enrichment.followups },
      });
    }

    if (enrichment.entities.length > 0) {
      extractRows.push({
        created_by: user_id,
        source_type,
        source_id,
        extract_type: "key_entities",
        content: { items: enrichment.entities },
      });
    }

    if (enrichment.suggested_actions.length > 0) {
      extractRows.push({
        created_by: user_id,
        source_type,
        source_id,
        extract_type: "tasks_suggested",
        content: { items: enrichment.suggested_actions },
      });
    }

    if (extractRows.length > 0) {
      const { error: extractError } = await supabase
        .from("item_extracts")
        .upsert(extractRows, { onConflict: "created_by,source_type,source_id" });

      if (extractError) {
        console.error("Error persisting extracts:", extractError);
        // Insert individually as fallback
        for (const row of extractRows) {
          await supabase.from("item_extracts").insert(row);
        }
      }
    }

    // Persist AI-suggested entity links
    const CONFIDENCE_THRESHOLD = 0.65;
    const suggestedLinks = enrichment.entities
      .filter((e) => e.confidence >= CONFIDENCE_THRESHOLD)
      .map((entity) => {
        const match = candidates.find(
          (c) => c.name.toLowerCase() === entity.name.toLowerCase()
        );
        if (!match) return null;
        return {
          created_by: user_id,
          source_type,
          source_id,
          target_type: "company" as const,
          target_id: match.id,
          link_reason: "ai_match",
          confidence: entity.confidence,
        };
      })
      .filter(Boolean);

    if (suggestedLinks.length > 0) {
      await supabase
        .from("entity_links")
        .upsert(suggestedLinks as any[], {
          onConflict: "source_type,source_id,target_type,target_id,created_by",
        });
    }

    // Update work item status
    const reasonCodes: string[] = [];
    if (suggestedLinks.length === 0) {
      // Check if there are existing manual links
      const { data: existingLinks } = await supabase
        .from("entity_links")
        .select("id")
        .eq("source_type", source_type)
        .eq("source_id", source_id)
        .eq("created_by", user_id)
        .limit(1);

      if (!existingLinks || existingLinks.length === 0) {
        reasonCodes.push("unlinked_company");
      }
    }

    if (enrichment.followups.length === 0 && enrichment.suggested_actions.length === 0) {
      reasonCodes.push("no_next_action");
    }

    await supabase
      .from("work_items")
      .update({
        status: "needs_review",
        reason_codes: reasonCodes,
        updated_at: new Date().toISOString(),
      })
      .eq("source_type", source_type)
      .eq("source_id", source_id)
      .eq("created_by", user_id);

    return new Response(
      JSON.stringify({
        success: true,
        extracts_count: extractRows.length,
        suggested_links: suggestedLinks.length,
        reason_codes: reasonCodes,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("focus-enrich error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function fetchSourceContent(
  supabase: ReturnType<typeof createClient>,
  sourceType: string,
  sourceId: string
): Promise<{ title: string; body: string; metadata: Record<string, any> } | null> {
  switch (sourceType) {
    case "email": {
      const { data } = await supabase
        .from("inbox_items")
        .select("subject, from_email, from_name, to_email, text_body, cleaned_text, snippet, display_subject")
        .eq("id", sourceId)
        .single();
      if (!data) return null;
      return {
        title: data.display_subject || data.subject || "",
        body: data.cleaned_text || data.text_body || data.snippet || "",
        metadata: {
          from_email: data.from_email,
          from_name: data.from_name,
          to_email: data.to_email,
        },
      };
    }
    case "calendar_event": {
      const { data } = await supabase
        .from("calendar_events")
        .select("subject, body_preview, attendees, start_time, end_time, location")
        .eq("id", sourceId)
        .single();
      if (!data) return null;
      return {
        title: data.subject || "",
        body: data.body_preview || "",
        metadata: {
          attendees: data.attendees,
          start_time: data.start_time,
          end_time: data.end_time,
          location: data.location,
        },
      };
    }
    case "task": {
      const { data } = await supabase
        .from("tasks")
        .select("content, priority, status, scheduled_for")
        .eq("id", sourceId)
        .single();
      if (!data) return null;
      return {
        title: data.content || "",
        body: "",
        metadata: { priority: data.priority, status: data.status, scheduled_for: data.scheduled_for },
      };
    }
    case "note": {
      const { data } = await supabase
        .from("project_notes")
        .select("title, content")
        .eq("id", sourceId)
        .single();
      if (!data) return null;
      return {
        title: data.title || "",
        body: data.content || "",
        metadata: {},
      };
    }
    case "reading": {
      const { data } = await supabase
        .from("reading_items")
        .select("title, url, description")
        .eq("id", sourceId)
        .single();
      if (!data) return null;
      return {
        title: data.title || "",
        body: data.description || "",
        metadata: { url: data.url },
      };
    }
    default:
      return null;
  }
}

async function fetchCandidateCompanies(
  supabase: ReturnType<typeof createClient>
): Promise<Array<{ id: string; name: string; type: string; primary_domain: string | null }>> {
  const [portfolioResult, pipelineResult] = await Promise.all([
    supabase.from("companies").select("id, name, primary_domain"),
    supabase.from("pipeline_companies").select("id, company_name, primary_domain"),
  ]);

  const companies: Array<{ id: string; name: string; type: string; primary_domain: string | null }> = [];

  if (portfolioResult.data) {
    for (const c of portfolioResult.data) {
      companies.push({ id: c.id, name: c.name, primary_domain: c.primary_domain, type: "portfolio" });
    }
  }

  if (pipelineResult.data) {
    for (const c of pipelineResult.data) {
      companies.push({ id: c.id, name: c.company_name, primary_domain: c.primary_domain, type: "pipeline" });
    }
  }

  return companies;
}

async function callAIEnrichment(
  source: { title: string; body: string; metadata: Record<string, any> },
  sourceType: string,
  candidates: Array<{ id: string; name: string; type: string }>
): Promise<EnrichmentOutput | null> {
  if (!OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY not set");
    return null;
  }

  const companyNames = candidates.map((c) => `${c.name} (${c.type})`).slice(0, 100);

  const systemPrompt = `You are an AI assistant for a VC fund operator. Analyze the following ${sourceType} content and extract structured information.

Known companies in the system: ${companyNames.join(", ")}

Return a JSON object with these fields:
- one_liner: A single sentence summary (max 80 chars)
- summary: 2-3 sentence summary
- entities: Array of { name, type: "company"|"person"|"organization", confidence: 0-1 }
- highlights: Array of key points (strings)
- decisions: Array of decisions mentioned (strings, can be empty)
- followups: Array of follow-up actions needed (strings)
- suggested_actions: Array of { type: "task"|"link"|"note", description, priority: "low"|"medium"|"high" }
- confidence_overall: 0-1 confidence in the analysis quality`;

  const userPrompt = `Title: ${source.title}
Content: ${source.body.substring(0, 3000)}
Metadata: ${JSON.stringify(source.metadata)}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as EnrichmentOutput;

    // Ensure arrays
    return {
      one_liner: parsed.one_liner || "",
      summary: parsed.summary || "",
      entities: Array.isArray(parsed.entities) ? parsed.entities : [],
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
      followups: Array.isArray(parsed.followups) ? parsed.followups : [],
      suggested_actions: Array.isArray(parsed.suggested_actions) ? parsed.suggested_actions : [],
      confidence_overall: typeof parsed.confidence_overall === "number" ? parsed.confidence_overall : 0.5,
    };
  } catch (err) {
    console.error("AI enrichment call failed:", err);
    return null;
  }
}
