import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Collapse long URLs to [link: domain]
function collapseUrls(text: string): string {
  return text.replace(/https?:\/\/[^\s]{40,}/gi, (url) => {
    try {
      const domain = new URL(url).hostname.replace("www.", "");
      return `[link: ${domain}]`;
    } catch {
      return "[link]";
    }
  });
}

// Clean email text for extraction
function cleanEmailForExtraction(text: string): string {
  let cleaned = text;
  
  // Collapse long URLs
  cleaned = collapseUrls(cleaned);
  
  // Remove excessive whitespace
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  cleaned = cleaned.replace(/[ \t]+/g, " ");
  
  // Trim
  cleaned = cleaned.trim();
  
  return cleaned;
}

// Validate and normalize extraction result
function validateExtraction(result: unknown): {
  summary: string;
  key_points: string[];
  next_step: { label: string; is_action_required: boolean };
  categories: string[];
  entities: Array<{ name: string; type: string; confidence: number }>;
  people: Array<{ name: string; email: string | null; confidence: number }>;
} {
  const r = result as Record<string, unknown>;
  
  // Validate summary
  const summary = typeof r.summary === "string" ? r.summary : "";
  
  // Validate key_points (3-7 items)
  let keyPoints = Array.isArray(r.key_points) 
    ? r.key_points.filter((p): p is string => typeof p === "string")
    : [];
  if (keyPoints.length < 3) keyPoints = keyPoints.concat(Array(3 - keyPoints.length).fill(""));
  if (keyPoints.length > 7) keyPoints = keyPoints.slice(0, 7);
  keyPoints = keyPoints.filter(p => p.trim().length > 0);
  
  // Validate next_step
  const nextStep = r.next_step as Record<string, unknown> | undefined;
  const validNextStep = {
    label: typeof nextStep?.label === "string" ? nextStep.label : "No action required",
    is_action_required: typeof nextStep?.is_action_required === "boolean" ? nextStep.is_action_required : false,
  };
  
  // Validate categories
  const validCategories = ["update", "request", "intro", "scheduling", "follow_up", "finance", "other"];
  const categories = Array.isArray(r.categories)
    ? r.categories.filter((c): c is string => typeof c === "string" && validCategories.includes(c))
    : [];
  
  // Validate entities
  const validEntityTypes = ["company", "bank", "fund", "product", "tool", "person", "other"];
  const entities = Array.isArray(r.entities)
    ? r.entities.map((e: unknown) => {
        const entity = e as Record<string, unknown>;
        return {
          name: typeof entity.name === "string" ? entity.name : "",
          type: typeof entity.type === "string" && validEntityTypes.includes(entity.type) ? entity.type : "other",
          confidence: typeof entity.confidence === "number" ? Math.max(0, Math.min(1, entity.confidence)) : 0.5,
        };
      }).filter(e => e.name.trim().length > 0)
    : [];
  
  // Validate people
  const people = Array.isArray(r.people)
    ? r.people.map((p: unknown) => {
        const person = p as Record<string, unknown>;
        return {
          name: typeof person.name === "string" ? person.name : "",
          email: typeof person.email === "string" ? person.email : null,
          confidence: typeof person.confidence === "number" ? Math.max(0, Math.min(1, person.confidence)) : 0.5,
        };
      }).filter(p => p.name.trim().length > 0)
    : [];
  
  return {
    summary,
    key_points: keyPoints,
    next_step: validNextStep,
    categories,
    entities,
    people,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      console.error("OPENAI_API_KEY not configured");
      return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getUser(token);
    if (claimsError || !claimsData.user) {
      console.error("Auth error:", claimsError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.user.id;

    // Parse request
    const { inbox_item_id } = await req.json();
    if (!inbox_item_id) {
      return new Response(JSON.stringify({ error: "inbox_item_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch inbox item (RLS ensures ownership)
    const { data: item, error: fetchError } = await supabase
      .from("inbox_items")
      .select("id, subject, from_name, from_email, to_email, received_at, text_body, cleaned_text, display_subject, display_from_name, display_from_email")
      .eq("id", inbox_item_id)
      .single();

    if (fetchError || !item) {
      console.error("Fetch error:", fetchError);
      return new Response(JSON.stringify({ error: "Item not found or access denied" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prepare text for extraction
    const rawText = item.cleaned_text || item.text_body || "";
    if (!rawText.trim()) {
      return new Response(JSON.stringify({ error: "No email content to extract" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanedText = cleanEmailForExtraction(rawText);
    const subject = item.display_subject || item.subject;
    const fromName = item.display_from_name || item.from_name || "";
    const fromEmail = item.display_from_email || item.from_email;

    console.log(`Extracting structured summary for inbox item ${inbox_item_id}`);

    // Call OpenAI with tool calling
    const systemPrompt = `You are an assistant that extracts structured summaries from business emails.
Output must be valid JSON matching the schema exactly.
Do not include markdown or commentary.`;

    const userPrompt = `You are given a business email. Produce a structured extraction that helps the user quickly decide whether action is required.

Rules:
- Ignore email signatures, disclaimers, tracking footers, and repeated quoted threads.
- Do not copy raw URLs. If a link is important, mention only the domain in plain text.
- Keep summary factual and concise (1-2 sentences max).
- Key points should be short and specific. No more than 12 words each when possible.
- If the email requires no action, set next_step.is_action_required=false and next_step.label="No action required".
- Extract entities and people that are explicitly referenced or strongly implied.

Constraints:
- key_points: 3 to 7 items
- categories: choose from: ["update","request","intro","scheduling","follow_up","finance","other"]
- entities.type: choose from: ["company","bank","fund","product","tool","person","other"]
- confidence: number between 0 and 1

Email metadata:
Subject: ${subject}
From: ${fromName} <${fromEmail}>
To: ${item.to_email || "unknown"}
Date: ${item.received_at}

Email content:
${cleanedText}`;

    const tools = [
      {
        type: "function",
        function: {
          name: "extract_structured_summary",
          description: "Extract a structured summary from an email",
          parameters: {
            type: "object",
            properties: {
              summary: { type: "string", description: "1-2 sentence overview of the email" },
              key_points: {
                type: "array",
                items: { type: "string" },
                description: "3-7 key bullet points from the email",
              },
              next_step: {
                type: "object",
                properties: {
                  label: { type: "string", description: "What action is required, if any" },
                  is_action_required: { type: "boolean", description: "Whether action is required" },
                },
                required: ["label", "is_action_required"],
              },
              categories: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["update", "request", "intro", "scheduling", "follow_up", "finance", "other"],
                },
                description: "Categories that apply to this email",
              },
              entities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    type: {
                      type: "string",
                      enum: ["company", "bank", "fund", "product", "tool", "person", "other"],
                    },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                  },
                  required: ["name", "type", "confidence"],
                },
                description: "Entities mentioned in the email",
              },
              people: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    email: { type: "string", nullable: true },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                  },
                  required: ["name", "confidence"],
                },
                description: "People mentioned in the email",
              },
            },
            required: ["summary", "key_points", "next_step", "categories", "entities", "people"],
          },
        },
      },
    ];

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "extract_structured_summary" } },
        temperature: 0.2,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API error:", openaiResponse.status, errorText);
      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openaiData = await openaiResponse.json();
    const toolCall = openaiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall || toolCall.function.name !== "extract_structured_summary") {
      console.error("Unexpected OpenAI response:", JSON.stringify(openaiData));
      return new Response(JSON.stringify({ error: "AI extraction returned unexpected format" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let extractedData: unknown;
    try {
      extractedData = JSON.parse(toolCall.function.arguments);
    } catch (parseError) {
      console.error("Failed to parse tool call arguments:", toolCall.function.arguments);
      return new Response(JSON.stringify({ error: "AI extraction returned invalid JSON" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate and normalize
    const validated = validateExtraction(extractedData);

    console.log(`Extraction successful for ${inbox_item_id}:`, JSON.stringify(validated));

    // Persist to database
    const { error: updateError } = await supabase
      .from("inbox_items")
      .update({
        extracted_summary: validated.summary,
        extracted_key_points: validated.key_points,
        extracted_next_step: validated.next_step,
        extracted_entities: validated.entities,
        extracted_people: validated.people,
        extracted_categories: validated.categories,
        extraction_version: "v1",
        extracted_at: new Date().toISOString(),
      })
      .eq("id", inbox_item_id);

    if (updateError) {
      console.error("Failed to persist extraction:", updateError);
      return new Response(JSON.stringify({ error: "Failed to save extraction" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Return extraction for immediate UI update
    return new Response(
      JSON.stringify({
        success: true,
        extraction: {
          summary: validated.summary,
          keyPoints: validated.key_points,
          nextStep: {
            label: validated.next_step.label,
            isActionRequired: validated.next_step.is_action_required,
          },
          categories: validated.categories,
          entities: validated.entities,
          people: validated.people,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
