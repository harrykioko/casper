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
    const payload = await req.json();

    // Raw sender (you) – used ONLY for user lookup
    const senderEmail: string | null =
      payload.from?.value?.[0]?.address ||
      payload.from?.address ||
      payload.from ||
      null;

    const senderName: string | null =
      payload.from?.value?.[0]?.name ||
      payload.from?.name ||
      null;

    const toEmail: string | null =
      payload.to?.value?.[0]?.address ||
      payload.to?.address ||
      payload.to ||
      null;

    const smtpSubject: string = payload.subject || "(no subject)";
    const textBody: string = payload.text || "";
    const htmlBody: string = payload.html || "";

    if (!senderEmail) {
      console.error("❌ Missing fromEmail in payload:", payload);
      return new Response(
        JSON.stringify({ error: "Missing from email in payload" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // --- 1) Lookup user by *your* email (unchanged logic) ---
    const { data: user, error: userError } = await supabaseClient
      .from("users")
      .select("id")
      .eq("email", senderEmail)
      .single();

    if (userError || !user) {
      console.error("❌ User not found for sender:", senderEmail, userError);
      return new Response(
        JSON.stringify({ error: "Sender not recognized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // --- 2) Derive a text version of the body for parsing + snippet ---
    const plainBody = textBody || htmlToPlainText(htmlBody) || "";

    // --- 3) Try to parse original forwarded sender + subject from body ---
    const forwardedMeta = parseForwardedMetadata(plainBody);

    // If we successfully parsed an original sender/subject, use those for display.
    // Otherwise fall back to the SMTP envelope (current behavior).
    const displayFromEmail = forwardedMeta.fromEmail || senderEmail;
    const displayFromName = forwardedMeta.fromName || senderName;
    const displaySubject =
      forwardedMeta.subject || stripFwdPrefix(smtpSubject);

    // --- 4) Build snippet from the "real" body (below the header) ---
    const snippetSource = forwardedMeta.bodyWithoutHeader || plainBody;
    const snippet = snippetSource.substring(0, 200);

    const inboxItem = {
      subject: displaySubject,
      from_name: displayFromName,
      from_email: displayFromEmail,
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

    console.log("✅ Successfully inserted inbox item for:", displaySubject);

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

// --- Helpers ---

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

// Basic HTML → text for fallback
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

// Strip "Fwd:" / "FW:" prefixes for display
function stripFwdPrefix(subject: string): string {
  return subject.replace(/^\s*(fw|fwd):\s*/i, "").trim();
}

// Parse Gmail-style forwarded header block:
// "---------- Forwarded message ----------"
// "From: Name <email>"
// "Subject: ..."
// Returns best-effort metadata + body with the header removed
function parseForwardedMetadata(body: string): {
  fromName: string | null;
  fromEmail: string | null;
  subject: string | null;
  bodyWithoutHeader: string | null;
} {
  let fromName: string | null = null;
  let fromEmail: string | null = null;
  let subject: string | null = null;

  const lines = body.split(/\r?\n/);

  let headerStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/forwarded message/i.test(lines[i])) {
      headerStartIndex = i;
      break;
    }
  }

  if (headerStartIndex === -1) {
    // No forwarded header marker; best-effort parse from entire body
    const fromMatch =
      body.match(/From:\s*(.+?)\s*<(.+?)>/i) ||
      body.match(/From:\s*<?([^>\n]+)>?/i);

    if (fromMatch) {
      if (fromMatch.length >= 3) {
        // "From: Name <email>"
        fromName = fromMatch[1].trim();
        fromEmail = fromMatch[2].trim();
      } else {
        // "From: email"
        fromEmail = fromMatch[1].trim();
      }
    }

    const subjectMatch = body.match(/Subject:\s*(.+)/i);
    if (subjectMatch) {
      subject = subjectMatch[1].trim();
    }

    return { fromName, fromEmail, subject, bodyWithoutHeader: null };
  }

  // When we find the forwarded header marker, parse only the lines following it
  for (let i = headerStartIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) continue;
    if (/^From:/i.test(line) && !fromEmail) {
      // From: Name <email>  OR  From: email
      const m =
        line.match(/^From:\s*(.+?)\s*<(.+?)>$/i) ||
        line.match(/^From:\s*<?([^>]+)>?$/i);

      if (m) {
        if (m.length >= 3) {
          fromName = m[1].trim();
          fromEmail = m[2].trim();
        } else {
          fromEmail = m[1].trim();
        }
      }
    } else if (/^Subject:/i.test(line) && !subject) {
      const m = line.match(/^Subject:\s*(.+)$/i);
      if (m) subject = m[1].trim();
    }

    // Once we've read through a few header lines and hit a blank line, stop
    if (fromEmail && subject && line === "") {
      break;
    }
  }

  // Body without the header block
  const bodyWithoutHeader =
    headerStartIndex >= 0
      ? lines.slice(headerStartIndex + 1).join("\n")
      : null;

  return { fromName, fromEmail, subject, bodyWithoutHeader };
}
