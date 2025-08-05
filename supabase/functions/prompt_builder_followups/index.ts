// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { SYSTEM_PROMPT } from "../_shared/systemPrompt.ts";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
  };
}

serve(async (req) => {
  // Handle the browser's pre-flight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }
  try {
    const body: any = await req.json();

    // Strip clarifications—they are undefined at this stage
    const { clarifications, ...payload } = body;

    const chatReq = {
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "assistant",
          content:
            "You are in **follow-up mode**. Evaluate the payload and EITHER:\n" +
            "1) Return `{ \"followup_questions\": [ ... ] }` (max 5), OR\n" +
            "2) Return `{ \"prompt\": \"...\" }` if no clarification needed.",
        },
        { role: "user", content: JSON.stringify(payload) },
      ],
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      },
      body: JSON.stringify(chatReq),
    });

    const data = await resp.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response from OpenAI if it's a string
    const result = typeof content === 'string' ? JSON.parse(content) : content;
    
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: "Failed to generate follow-ups." }),
      { 
        status: 500,
        headers: { ...corsHeaders(), "Content-Type": "application/json" }
      }
    );
  }
});
