// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { SYSTEM_PROMPT } from "../_shared/systemPrompt.ts";

serve(async (req) => {
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
    return new Response(JSON.stringify(data.choices[0].message.content), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Prompt generation failed." }), {
      status: 500,
    });
  }
});
