import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { cleanEmailForExtraction, extractStructuredSummary } from "../_shared/email-extraction.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    // Parse request
    const { inbox_item_id } = await req.json();
    if (!inbox_item_id) {
      return new Response(JSON.stringify({ error: "inbox_item_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch inbox item (RLS ensures ownership) - include thread context
    const { data: item, error: fetchError } = await supabase
      .from("inbox_items")
      .select("id, subject, from_name, from_email, to_email, received_at, text_body, cleaned_text, display_subject, display_from_name, display_from_email, thread_clean_text, thread_message_count")
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
    const threadCleanText = item.thread_clean_text ? cleanEmailForExtraction(item.thread_clean_text) : null;
    const threadMessageCount = item.thread_message_count || 1;
    const subject = item.display_subject || item.subject;
    const fromName = item.display_from_name || item.from_name || "";
    const fromEmail = item.display_from_email || item.from_email;

    console.log(`Extracting structured summary for inbox item ${inbox_item_id}`, {
      hasThreadContext: !!threadCleanText,
      threadMessageCount,
    });

    // Call shared extraction function (v2 with thread support)
    const validated = await extractStructuredSummary(openaiApiKey, {
      subject,
      fromName,
      fromEmail,
      toEmail: item.to_email,
      receivedAt: item.received_at,
      cleanedText,
      threadCleanText,
      threadMessageCount,
    });

    console.log(`Extraction successful for ${inbox_item_id}:`, {
      extractionBasis: validated.extraction_basis,
      isActionRequired: validated.next_step.is_action_required,
    });

    // Persist to database (v2 with extraction_basis)
    const { error: updateError } = await supabase
      .from("inbox_items")
      .update({
        extracted_summary: validated.summary,
        extracted_key_points: validated.key_points,
        extracted_next_step: validated.next_step,
        extracted_entities: validated.entities,
        extracted_people: validated.people,
        extracted_categories: validated.categories,
        extraction_version: "v2",
        extraction_basis: validated.extraction_basis || 'latest',
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
