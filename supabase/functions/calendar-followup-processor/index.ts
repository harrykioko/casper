// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
  };
}

const SYSTEM_PROMPT = `You are an executive assistant AI that processes meeting follow-up notes.
Given the user's notes from a meeting, extract:
1. A brief summary of the meeting (2-3 sentences max)
2. Specific action items with optional assignee and due date suggestions
3. Key topics discussed

Return valid JSON with this exact structure:
{
  "summary": "...",
  "action_items": [
    { "content": "...", "assignee": "..." or null, "due_suggestion": "..." or null }
  ],
  "key_topics": ["...", "..."]
}

Rules:
- Action items should be specific and actionable
- Due suggestions should be relative like "end of week", "tomorrow", "next Monday"
- If no clear action items exist, return an empty array
- Keep the summary concise and factual
- Extract 2-5 key topics as short phrases`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  try {
    const payload: any = await req.json();
    const { note_text, event_title, event_description, attendees, company_name } = payload;

    const userMessage = [
      `Meeting: ${event_title || 'Unknown meeting'}`,
      company_name ? `Company: ${company_name}` : '',
      attendees?.length ? `Attendees: ${attendees.map((a: any) => a.name || a.email).join(', ')}` : '',
      event_description ? `Meeting description: ${event_description}` : '',
      `\nMy follow-up notes:\n${note_text}`,
    ].filter(Boolean).join('\n');

    const chatReq = {
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
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

    let result: Record<string, unknown>;
    try {
      const parsed = JSON.parse(content);
      result =
        typeof parsed === "object" && parsed !== null
          ? (parsed as Record<string, unknown>)
          : { summary: content, action_items: [], key_topics: [] };
    } catch {
      result = { summary: content, action_items: [], key_topics: [] };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({ error: "Follow-up processing failed." }),
      {
        status: 500,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      },
    );
  }
});
