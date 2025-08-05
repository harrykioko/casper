// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { SYSTEM_PROMPT } from "../_shared/systemPrompt.ts";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
  };
}

serve(async (req) => {
  // Pre-flight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  try {
    const payload: any = await req.json();

    const chatReq = {
      model: "gpt-4o-mini",
      temperature: 0.25,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "assistant",
          content:
            "You are in **generation mode**. Build the final prompt per rule 4 and return JSON `{ \"prompt\": \"...\" }`.",
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
    const content = data.choices?.[0]?.message?.content ?? "";

    // --- Robust wrapper: always return canonical JSON ------------------
    let result: Record<string, unknown>;
    try {
      const parsed = JSON.parse(content);
      result =
        typeof parsed === "object" && parsed !== null
          ? (parsed as Record<string, unknown>)
          : { prompt: content };
    } catch {
      // Model returned raw text
      result = { prompt: content };
    }
    // -------------------------------------------------------------------

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: "Prompt generation failed." }),
      {
        status: 500,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      },
    );
  }
});
