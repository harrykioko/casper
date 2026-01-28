import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient as createSupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const systemPrompt = `You are analyzing an email to extract actionable tasks for the recipient.

Your job is to identify concrete, actionable items that require the recipient to do something.

Rules:
- Only suggest genuine actionable items, not FYIs or informational content
- Use imperative verbs (e.g., "Send", "Review", "Schedule", "Call")
- Be conservative - if unsure, do not suggest
- Maximum 5 suggestions
- If no tasks needed, return empty array

Return a JSON object with suggested_tasks array. Each task has:
- title: clear, actionable task title (string, max 80 chars)
- effort_minutes: estimated time (number: 5, 15, 30, or 60)
- due_hint: relative date hint if deadline mentioned (string or null, e.g., "tomorrow", "this week", "by Friday")
- category: optional category (string or null: "follow-up", "meeting", "review", "send", "call")
- confidence: confidence level (string: "low", "medium", "high")
- rationale: brief explanation of why this is a task (string, max 50 chars)`;

interface SuggestedTask {
  title: string;
  effort_minutes: number;
  due_hint: string | null;
  category: string | null;
  confidence: "low" | "medium" | "high";
  rationale: string;
}

interface RequestBody {
  inbox_item_id?: string;
  subject?: string;
  cleaned_text?: string;
  sender?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate OpenAI API key
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request
    const body: RequestBody = await req.json();
    const { inbox_item_id, subject, cleaned_text, sender } = body;

    // Get auth header for user context
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    // Validate user
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claims.claims.sub;

    // Build the prompt
    let emailContent = cleaned_text || "";
    let emailSubject = subject || "";
    let emailSender = sender || "";

    // If inbox_item_id provided, fetch the actual content
    if (inbox_item_id && !cleaned_text) {
      const { data: item, error: fetchError } = await supabase
        .from("inbox_items")
        .select("subject, text_body, from_name, from_email")
        .eq("id", inbox_item_id)
        .single();

      if (fetchError || !item) {
        console.error("Failed to fetch inbox item:", fetchError);
        return new Response(
          JSON.stringify({ error: "Inbox item not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      emailSubject = item.subject;
      emailContent = item.text_body || "";
      emailSender = item.from_name || item.from_email;
    }

    // Call OpenAI
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Analyze this email and extract actionable tasks:

Subject: ${emailSubject}
From: ${emailSender}

Email body:
${emailContent.substring(0, 3000)}` // Limit content length
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error("OpenAI API error:", openaiResponse.status, errorText);
      
      if (openaiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI service rate limited, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error("No content in OpenAI response");
      return new Response(
        JSON.stringify({ suggested_tasks: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse the JSON response
    let parsedContent: { suggested_tasks?: SuggestedTask[] };
    try {
      parsedContent = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse OpenAI response:", e, content);
      return new Response(
        JSON.stringify({ suggested_tasks: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const suggestedTasks = parsedContent.suggested_tasks || [];

    // Transform to frontend format with IDs
    const formattedSuggestions = suggestedTasks.slice(0, 5).map((task, index) => ({
      id: `ai-${inbox_item_id || "manual"}-${index}`,
      title: task.title.substring(0, 80),
      effortMinutes: task.effort_minutes || 15,
      effortBucket: task.effort_minutes <= 5 ? "quick" : task.effort_minutes >= 30 ? "long" : "medium",
      confidence: task.confidence || "medium",
      source: "ai" as const,
      rationale: task.rationale?.substring(0, 50) || "AI suggested",
      dueHint: task.due_hint || undefined,
      category: task.category || undefined,
    }));

    // Cache the suggestions if we have an inbox_item_id
    if (inbox_item_id) {
      const { error: upsertError } = await supabase
        .from("inbox_suggestions")
        .upsert({
          inbox_item_id,
          suggestions: formattedSuggestions,
          source: "ai",
          generated_at: new Date().toISOString(),
        }, {
          onConflict: "inbox_item_id",
        });

      if (upsertError) {
        console.error("Failed to cache suggestions:", upsertError);
        // Continue anyway - caching is not critical
      }
    }

    console.log("Generated", formattedSuggestions.length, "AI suggestions for", inbox_item_id || "manual request");

    return new Response(
      JSON.stringify({ suggested_tasks: formattedSuggestions }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error in inbox-suggest:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
