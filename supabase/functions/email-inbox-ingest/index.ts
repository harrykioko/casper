import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient as createSupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
}

// Size limits
const MAX_COMBINED_BODY_BYTES = 1 * 1024 * 1024; // ~1 MB of text+html
const MAX_TEXT_BODY = 60 * 1024; // 60 KB stored text
const MAX_HTML_BODY = 120 * 1024; // 120 KB stored html
const MAX_HTML_FOR_PROCESSING = 120 * 1024; // 120 KB html -> text
const SNIPPET_LENGTH = 280;
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10 MB per attachment

serve(async (req) => {
  const { supabaseClient } = createSupabase();

  try {
    const payload = await req.json();

    // Extract raw bodies
    const rawTextBody: string = payload.text || "";
    const rawHtmlBody: string = payload.html || "";

    const textLen = rawTextBody.length;
    const htmlLen = rawHtmlBody.length;
    const approxBodySize = textLen + htmlLen;

    console.log("Inbox email received", {
      textLen,
      htmlLen,
      approxBodySize,
      hasAttachments: !!(payload.attachments?.length),
      attachmentCount: payload.attachments?.length || 0,
    });

    if (approxBodySize > MAX_COMBINED_BODY_BYTES) {
      console.error("Email body too large, rejecting", { textLen, htmlLen, approxBodySize });
      return new Response(JSON.stringify({ error: "Email too large to process" }), {
        status: 413,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Truncate bodies
    let textBody = rawTextBody.slice(0, MAX_TEXT_BODY);
    let htmlBody = rawHtmlBody.slice(0, MAX_HTML_BODY);

    // Parse sender (you) – used for user lookup
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

    // Lookup user by email
    const { data: user, error: userError } = await supabaseClient
      .from("users")
      .select("id")
      .eq("email", senderEmail)
      .single();

    if (userError || !user) {
      console.error("User not found for sender", { senderEmail, userError });
      return new Response(JSON.stringify({ error: "Sender not recognized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Derive plain-text version
    const plainBody = textBody || htmlToPlainText(htmlBody) || "";

    // Parse forwarded sender + subject
    const forwardedMeta = parseForwardedMetadata(plainBody);
    const displayFromEmail = forwardedMeta.fromEmail || senderEmail;
    const displayFromName = forwardedMeta.fromName || senderName;
    const displaySubject = forwardedMeta.subject || stripFwdPrefix(smtpSubject);

    // Build snippet
    const snippetSource = forwardedMeta.bodyWithoutHeader || plainBody;
    const snippet = snippetSource.substring(0, SNIPPET_LENGTH);

    const inboxItemData = {
      subject: displaySubject,
      from_name: displayFromName,
      from_email: displayFromEmail,
      to_email: toEmail,
      snippet,
      text_body: plainBody || null,
      html_body: htmlBody || null,
      received_at: new Date().toISOString(),
      is_read: false,
      is_resolved: false,
      is_deleted: false,
      snoozed_until: null,
      created_by: user.id,
    };

    // Insert inbox item and get ID back
    const { data: inboxItem, error: insertError } = await supabaseClient
      .from("inbox_items")
      .insert(inboxItemData)
      .select("id")
      .single();

    if (insertError || !inboxItem) {
      console.error("Insert into inbox_items failed", insertError);
      return new Response(JSON.stringify({ error: "Insert failed" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const inboxItemId = inboxItem.id;
    console.log("Inserted inbox item", {
      id: inboxItemId,
      subject: displaySubject,
      from: displayFromEmail,
    });

    // Process attachments
    const attachments = payload.attachments || [];
    let attachmentsProcessed = 0;
    let attachmentsFailed = 0;

    for (const att of attachments) {
      try {
        const filename = att.filename || att.name || "unnamed";
        const contentType = att.contentType || att.type || att.mimeType || "application/octet-stream";
        const size = att.size || 0;

        // Skip oversized attachments
        if (size > MAX_ATTACHMENT_SIZE) {
          console.warn("Skipping large attachment", { filename, size });
          attachmentsFailed++;
          continue;
        }

        let fileBuffer: Uint8Array | null = null;

        // Option A: Base64 content
        if (att.content) {
          try {
            fileBuffer = base64ToUint8Array(att.content);
          } catch (decodeErr) {
            console.error("Failed to decode base64 attachment", { filename, error: decodeErr });
            attachmentsFailed++;
            continue;
          }
        }
        // Option B: URL reference
        else if (att.url) {
          try {
            const response = await fetch(att.url);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }
            fileBuffer = new Uint8Array(await response.arrayBuffer());
          } catch (fetchErr) {
            console.error("Failed to fetch attachment from URL", { filename, url: att.url, error: fetchErr });
            attachmentsFailed++;
            continue;
          }
        }
        // Option C: Buffer data (nodemailer format)
        else if (att.data) {
          try {
            if (typeof att.data === "string") {
              fileBuffer = base64ToUint8Array(att.data);
            } else if (att.data instanceof Uint8Array) {
              fileBuffer = att.data;
            } else if (Array.isArray(att.data)) {
              fileBuffer = new Uint8Array(att.data);
            }
          } catch (dataErr) {
            console.error("Failed to process attachment data", { filename, error: dataErr });
            attachmentsFailed++;
            continue;
          }
        }

        if (!fileBuffer || fileBuffer.length === 0) {
          console.warn("No content found for attachment", { filename });
          attachmentsFailed++;
          continue;
        }

        // Generate storage path
        const ext = filename.includes(".") ? filename.split(".").pop() : "";
        const storagePath = `${user.id}/${inboxItemId}/${crypto.randomUUID()}${ext ? `.${ext}` : ""}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabaseClient.storage
          .from("inbox-attachments")
          .upload(storagePath, fileBuffer, {
            contentType: contentType,
            upsert: false,
          });

        if (uploadError) {
          console.error("Attachment upload failed", { filename, storagePath, error: uploadError });
          attachmentsFailed++;
          continue;
        }

        // Create database record
        const { error: attachmentInsertError } = await supabaseClient
          .from("inbox_attachments")
          .insert({
            inbox_item_id: inboxItemId,
            filename: filename,
            mime_type: contentType,
            size_bytes: fileBuffer.length,
            storage_path: storagePath,
            created_by: user.id,
          });

        if (attachmentInsertError) {
          console.error("Attachment record insert failed", { filename, error: attachmentInsertError });
          // Try to clean up uploaded file
          await supabaseClient.storage.from("inbox-attachments").remove([storagePath]);
          attachmentsFailed++;
          continue;
        }

        console.log("Attachment saved", { filename, storagePath, size: fileBuffer.length });
        attachmentsProcessed++;
      } catch (attErr) {
        console.error("Unexpected error processing attachment", attErr);
        attachmentsFailed++;
      }
    }

    console.log("Email ingestion complete", {
      inboxItemId,
      attachmentsProcessed,
      attachmentsFailed,
    });

    return new Response(
      JSON.stringify({
        success: true,
        inboxItemId,
        attachmentsProcessed,
        attachmentsFailed,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error in email-inbox-ingest", err);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// ============ Helpers ============

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

// Base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  // Handle data URIs
  let cleanBase64 = base64;
  if (base64.includes(",")) {
    cleanBase64 = base64.split(",")[1];
  }
  // Remove whitespace
  cleanBase64 = cleanBase64.replace(/\s/g, "");
  
  const binaryString = atob(cleanBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
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
