import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient as createSupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
}

serve(async (req) => {
  const { supabaseClient } = createSupabase();

  try {
    // Forward Email posts JSON
    const payload = await req.json();
    console.log("📧 Received email payload:", JSON.stringify(payload, null, 2));

    // ---- Extract core fields from Forward Email payload ----
    const fromEmail: string | null =
      payload.from?.value?.[0]?.address ||
      payload.from?.address ||
      payload.from ||
      null;

    const fromName: string | null =
      payload.from?.value?.[0]?.name ||
      payload.from?.name ||
      null;

    const toEmail: string | null =
      payload.to?.value?.[0]?.address ||
      payload.to?.address ||
      payload.to ||
      null;

    const subject: string = payload.subject || "(no subject)";
    const textBody: string = payload.text || "";
    const htmlBody: string = payload.html || "";

    console.log("📧 Parsed fields:", { fromEmail, fromName, toEmail, subject });

    if (!fromEmail) {
      console.error("❌ Missing fromEmail in payload");
      return new Response(
        JSON.stringify({ error: "Missing from email in payload" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ---- Look up the user by sender email ----
    const { data: user, error: userError } = await supabaseClient
      .from("users")
      .select("id")
      .eq("email", fromEmail)
      .single();

    if (userError || !user) {
      console.error("❌ User not found for sender:", fromEmail, userError);
      return new Response(
        JSON.stringify({ error: "Sender not recognized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Found user:", user.id);

    // ---- Build snippet ----
    const baseSnippetSource = textBody || htmlToPlainText(htmlBody) || "";
    const snippet = baseSnippetSource.substring(0, 200);

    // ---- Build inbox item row ----
    const inboxItem = {
      subject,
      from_name: fromName,
      from_email: fromEmail,
      to_email: toEmail,
      snippet,
      text_body: textBody || null,
      html_body: htmlBody || null,
      received_at: new Date().toISOString(),
      is_read: false,
      is_resolved: false,
      is_deleted: false,
      snoozed_until: null,
      created_by: user.id,
    };

    console.log("📧 Inserting inbox item:", { subject, from_email: fromEmail });

    // ---- Insert into inbox_items ----
    const { error: insertError } = await supabaseClient
      .from("inbox_items")
      .insert(inboxItem);

    if (insertError) {
      console.error("❌ Insert into inbox_items failed:", insertError);
      return new Response(
        JSON.stringify({ error: "Insert failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Successfully inserted inbox item for:", subject);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("❌ Unexpected error in email-inbox-ingest:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

// ---- Helpers ----

function createSupabase() {
  const supabaseClient = createSupabaseClient(
    SUPABASE_URL!,
    SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    }
  );
  return { supabaseClient };
}

// Simple HTML → text fallback for snippet generation
function htmlToPlainText(html: string | null): string {
  if (!html) return "";
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/(div|p|br|li|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
