import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient as createSupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
}

// Size limits (tune as needed)
const MAX_COMBINED_BODY_BYTES = 1 * 1024 * 1024; // ~1 MB of text+html
const MAX_TEXT_BODY = 60 * 1024; // 60 KB stored text
const MAX_HTML_BODY = 120 * 1024; // 120 KB stored html
const MAX_HTML_FOR_PROCESSING = 120 * 1024; // 120 KB html -> text
const SNIPPET_LENGTH = 280; // characters

serve(async (req) => {
  const { supabaseClient } = createSupabase();

  try {
    // Parse JSON once
    const payload = await req.json();

    // Extract raw bodies early
    const rawTextBody: string = payload.text || "";
    const rawHtmlBody: string = payload.html || "";

    // Approximate payload size from body lengths (cheaper than JSON.stringify)
    const textLen = rawTextBody.length;
    const htmlLen = rawHtmlBody.length;
    const approxBodySize = textLen + htmlLen;

    console.log("Inbox email body sizes", {
      textLen,
      htmlLen,
      approxBodySize,
    });

    if (approxBodySize > MAX_COMBINED_BODY_BYTES) {
      console.error("Email body too large, rejecting", {
        textLen,
        htmlLen,
        approxBodySize,
      });
      return new Response(JSON.stringify({ error: "Email too large to process" }), {
        status: 413,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Truncate bodies before any heavy processing
    let textBody = rawTextBody.slice(0, MAX_TEXT_BODY);
    let htmlBody = rawHtmlBody.slice(0, MAX_HTML_BODY);

    // Raw sender (you) – used ONLY for user lookup
    const senderEmail: string | null =
      payload.from?.value?.[0]?.address || payload.from?.address || payload.from || null;

    const senderName: string | null = payload.from?.value?.[0]?.name || payload.from?.name || null;

    const toEmail: string | null = payload.to?.value?.[0]?.address || payload.to?.address || payload.to || null;

    const smtpSubject: string = payload.subject || "(no subject)";

    if (!senderEmail) {
      console.error("Missing fromEmail in payload", {
        hasFrom: Boolean(payload.from),
        keys: Object.keys(payload),
      });
      return new Response(JSON.stringify({ error: "Missing from email in payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1) Lookup user by your email
    const { data: user, error: userError } = await supabaseClient
      .from("users")
      .select("id")
      .eq("email", senderEmail)
      .single();

    if (userError || !user) {
      console.error("User not found for sender", {
        senderEmail,
        userError,
      });
      return new Response(JSON.stringify({ error: "Sender not recognized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2) Derive a plain-text version (text preferred; else HTML->text)
    const plainBody = textBody || htmlToPlainText(htmlBody) || "";

    // After we derive plainBody, we can drop htmlBody from memory if we
    // do not absolutely need to store it. If you want HTML in the UI,
    // keep the truncated htmlBody; otherwise set it to "" here.
    // htmlBody = ""; // uncomment if you do not need HTML stored

    // 3) Parse original forwarded sender + subject from plain body
    const forwardedMeta = parseForwardedMetadata(plainBody);

    const displayFromEmail = forwardedMeta.fromEmail || senderEmail;
    const displayFromName = forwardedMeta.fromName || senderName;
    const displaySubject = forwardedMeta.subject || stripFwdPrefix(smtpSubject);

    // 4) Build snippet from the "real" body (below forwarded header if present)
    const snippetSource = forwardedMeta.bodyWithoutHeader || plainBody;
    const snippet = snippetSource.substring(0, SNIPPET_LENGTH);

    const inboxItem = {
      subject: displaySubject,
      from_name: displayFromName,
      from_email: displayFromEmail,
      to_email: toEmail,
      snippet,
      text_body: plainBody || null, // store canonical text body
      html_body: htmlBody || null, // already truncated; or null if dropped
      received_at: new Date().toISOString(),
      is_read: false,
      is_resolved: false,
      is_deleted: false,
      snoozed_until: null,
      created_by: user.id,
    };

    const { error: insertError } = await supabaseClient.from("inbox_items").insert(inboxItem);

    if (insertError) {
      console.error("Insert into inbox_items failed", insertError);
      return new Response(JSON.stringify({ error: "Insert failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Inserted inbox item", {
      subject: displaySubject,
      from: displayFromEmail,
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Unexpected error in email-inbox-ingest", err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// Helpers

function createSupabase() {
  const supabaseClient = createSupabaseClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!, {
    global: {
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    },
  });
  return { supabaseClient };
}

// HTML → plain text with capped input
function htmlToPlainText(html: string | null): string {
  if (!html) return "";

  const limited = html.slice(0, MAX_HTML_FOR_PROCESSING);

  return limited
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<\/(div|p|br|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Strip "Fwd:" / "FW:" prefixes for display
function stripFwdPrefix(subject: string): string {
  return subject.replace(/^\s*(fw|fwd):\s*/i, "").trim();
}

// Parse Gmail-style forwarded header block
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
    const fromMatch = body.match(/From:\s*(.+?)\s*<(.+?)>/i) || body.match(/From:\s*<?([^>\n]+)>?/i);

    if (fromMatch) {
      if (fromMatch.length >= 3) {
        fromName = fromMatch[1].trim();
        fromEmail = fromMatch[2].trim();
      } else {
        fromEmail = fromMatch[1].trim();
      }
    }

    const subjectMatch = body.match(/Subject:\s*(.+)/i);
    if (subjectMatch) {
      subject = subjectMatch[1].trim();
    }

    return { fromName, fromEmail, subject, bodyWithoutHeader: null };
  }

  for (let i = headerStartIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) continue;

    if (/^From:/i.test(line) && !fromEmail) {
      const m = line.match(/^From:\s*(.+?)\s*<(.+?)>$/i) || line.match(/^From:\s*<?([^>]+)>?$/i);

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

    if (fromEmail && subject && line === "") {
      break;
    }
  }

  const bodyWithoutHeader = headerStartIndex >= 0 ? lines.slice(headerStartIndex + 1).join("\n") : null;

  return { fromName, fromEmail, subject, bodyWithoutHeader };
}
