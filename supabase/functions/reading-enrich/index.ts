// reading-enrich: AI enrichment specifically for reading items
// Generates one_liner, topics, actionability, entities, and content_type suggestions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const TOPIC_TAXONOMY = [
  "B2B Sales", "Vibe Coding", "Venture Trends", "Fintech",
  "SaaS Metrics", "AI/ML", "Developer Tools", "Product Strategy",
  "Go-to-Market", "Fundraising", "LP Relations", "Portfolio Ops",
  "Market Maps", "Regulatory/Compliance", "Infrastructure",
  "Growth/PLG", "Enterprise Sales", "Data & Analytics",
  "Payments", "Banking-as-a-Service",
];

interface ReadingEnrichRequest {
  reading_item_id: string;
  url: string;
  title: string;
  description?: string | null;
  hostname?: string | null;
  content_type?: string | null;
}

interface ReadingEnrichOutput {
  one_liner: string;
  topics: string[];
  actionability: "none" | "idea" | "follow_up" | "diligence";
  content_type_suggestion: string;
  entities: Array<{ name: string; type: string }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as ReadingEnrichRequest;
    const { reading_item_id, url, title, description, hostname, content_type } = body;

    if (!reading_item_id || !url) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: reading_item_id, url" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call AI for enrichment
    const enrichment = await callReadingEnrichment({
      url,
      title,
      description: description || "",
      hostname: hostname || "",
      content_type: content_type || "unknown",
    });

    if (!enrichment) {
      return new Response(
        JSON.stringify({ error: "AI enrichment failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Persist results to reading_items
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const updateData: Record<string, any> = {
      one_liner: enrichment.one_liner,
      topics: enrichment.topics,
      actionability: enrichment.actionability,
      entities: enrichment.entities,
    };

    // Only override content_type if deterministic classifier didn't already set it
    // or if it was the generic "article" default
    if (!content_type || content_type === "article") {
      const suggestion = enrichment.content_type_suggestion;
      if (["x_post", "article", "blog_post", "newsletter", "tool"].includes(suggestion)) {
        updateData.content_type = suggestion;
      }
    }

    const { error: updateError } = await supabase
      .from("reading_items")
      .update(updateData)
      .eq("id", reading_item_id);

    if (updateError) {
      console.error("Error updating reading_items:", updateError);
    }

    // Also persist to item_extracts for consistency with focus-enrich
    const { data: existingUser } = await supabase
      .from("reading_items")
      .select("created_by")
      .eq("id", reading_item_id)
      .single();

    if (existingUser?.created_by) {
      await supabase.from("item_extracts").upsert(
        {
          created_by: existingUser.created_by,
          source_type: "reading",
          source_id: reading_item_id,
          extract_type: "summary",
          content: {
            one_liner: enrichment.one_liner,
            topics: enrichment.topics,
            actionability: enrichment.actionability,
            entities: enrichment.entities,
          },
        },
        { onConflict: "created_by,source_type,source_id,extract_type" }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        one_liner: enrichment.one_liner,
        topics: enrichment.topics,
        actionability: enrichment.actionability,
        content_type_suggestion: enrichment.content_type_suggestion,
        entities_count: enrichment.entities.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("reading-enrich error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function callReadingEnrichment(source: {
  url: string;
  title: string;
  description: string;
  hostname: string;
  content_type: string;
}): Promise<ReadingEnrichOutput | null> {
  const systemPrompt = `You are classifying a saved web link for a fintech/SaaS VC's reading library.

Return a JSON object with exactly these fields:
- one_liner (string, max 120 chars): A concise reason why this is worth reading or saving. Focus on the insight, not a generic summary.
- topics (array of 3-6 strings): Select from the taxonomy below, but you may generate new topics if clearly warranted.
- actionability (string, one of: "none", "idea", "follow_up", "diligence"): How actionable is this content?
  - "none": Informational only
  - "idea": Sparks a new idea worth exploring
  - "follow_up": Requires a follow-up action (outreach, meeting, etc.)
  - "diligence": Relevant to active deal/company evaluation
- content_type_suggestion (string, one of: "article", "x_post", "blog_post", "newsletter", "tool"): What type of content is this?
- entities (array of {name: string, type: "company"|"person"|"product"}, max 5): Key entities mentioned.

Topic taxonomy (prefer these, but generate new ones sparingly):
${TOPIC_TAXONOMY.join(", ")}

Do NOT generate long summaries. Be concise and precise.`;

  const userPrompt = `URL: ${source.url}
Title: ${source.title}
Description: ${source.description.substring(0, 1000)}
Hostname: ${source.hostname}
Detected content type: ${source.content_type}`;

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
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);

    return {
      one_liner: (parsed.one_liner || "").substring(0, 120),
      topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 6) : [],
      actionability: ["none", "idea", "follow_up", "diligence"].includes(parsed.actionability)
        ? parsed.actionability
        : "none",
      content_type_suggestion: parsed.content_type_suggestion || "article",
      entities: Array.isArray(parsed.entities) ? parsed.entities.slice(0, 5) : [],
    };
  } catch (err) {
    console.error("AI enrichment call failed:", err);
    return null;
  }
}
