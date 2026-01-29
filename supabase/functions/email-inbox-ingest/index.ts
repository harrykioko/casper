import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient as createSupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { extractBrief } from "../_shared/email-cleaner.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
}

// Size limits
const MAX_COMBINED_BODY_BYTES = 1 * 1024 * 1024; // ~1 MB of text+html
const MAX_TEXT_BODY = 60 * 1024; // 60 KB stored text
const MAX_HTML_BODY = 120 * 1024; // 120 KB stored html
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

    // Truncate bodies for storage
    const textBody = rawTextBody.slice(0, MAX_TEXT_BODY);
    const htmlBody = rawHtmlBody.slice(0, MAX_HTML_BODY);

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

    // ============ Server-Side Email Cleaning ============
    // Process email through cleaning pipeline to get cleaned content and signals
    const cleanedResult = extractBrief(
      textBody,
      htmlBody,
      smtpSubject,
      senderEmail,
      senderName
    );

    console.log("Email cleaning complete", {
      originalLength: textBody.length,
      cleanedLength: cleanedResult.cleanedText.length,
      signals: cleanedResult.signals,
      displaySubject: cleanedResult.displaySubject,
      displayFromEmail: cleanedResult.displayFromEmail,
    });

    // Build inbox item data with both raw and cleaned fields
    const inboxItemData = {
      // Raw fields (audit/fallback)
      subject: smtpSubject,
      from_name: senderName,
      from_email: senderEmail,
      to_email: toEmail,
      text_body: textBody || null,
      html_body: htmlBody || null,
      
      // Cleaned fields (display)
      cleaned_text: cleanedResult.cleanedText,
      display_snippet: cleanedResult.snippet,
      display_subject: cleanedResult.displaySubject,
      display_from_email: cleanedResult.displayFromEmail,
      display_from_name: cleanedResult.displayFromName,
      
      // Summary
      summary: cleanedResult.summary,
      summary_source: 'heuristic',
      summary_updated_at: new Date().toISOString(),
      
      // Legacy snippet (uses cleaned content now)
      snippet: cleanedResult.snippet,
      
      // Signals
      is_forwarded: cleanedResult.signals.isForwarded,
      forwarded_by_email: cleanedResult.signals.isForwarded ? senderEmail : null,
      has_thread: cleanedResult.signals.hasThread,
      has_disclaimer: cleanedResult.signals.hasDisclaimer,
      has_calendar: cleanedResult.signals.hasCalendar,
      
      // Metadata
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
      subject: cleanedResult.displaySubject,
      from: cleanedResult.displayFromEmail || senderEmail,
      isForwarded: cleanedResult.signals.isForwarded,
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

        // Option A: Content (base64 string OR Buffer object)
        if (att.content) {
          try {
            console.log("Processing attachment content", {
              filename,
              contentType: typeof att.content,
              isBuffer: typeof att.content === 'object' && (att.content as Record<string, unknown>)?.type === 'Buffer',
            });
            fileBuffer = contentToUint8Array(att.content);
          } catch (decodeErr) {
            console.error("Failed to decode attachment content", { filename, error: decodeErr });
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

// Convert attachment content to Uint8Array - handles multiple input formats
function contentToUint8Array(content: unknown): Uint8Array {
  // 1. Already Uint8Array
  if (content instanceof Uint8Array) {
    return content;
  }
  
  // 2. Buffer-like object: {type: "Buffer", data: [...]}
  if (typeof content === 'object' && content !== null) {
    const obj = content as Record<string, unknown>;
    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return new Uint8Array(obj.data as number[]);
    }
    // Plain array of bytes
    if (Array.isArray(content)) {
      return new Uint8Array(content as number[]);
    }
  }
  
  // 3. Base64 string
  if (typeof content === 'string') {
    return base64ToUint8Array(content);
  }
  
  throw new Error(`Unsupported content format: ${typeof content}`);
}

// Base64 to Uint8Array helper
function base64ToUint8Array(base64: string): Uint8Array {
  let cleanBase64 = base64;
  // Handle data URIs
  if (base64.includes(',')) {
    cleanBase64 = base64.split(',')[1];
  }
  // Remove whitespace
  cleanBase64 = cleanBase64.replace(/\s/g, '');
  
  const binaryString = atob(cleanBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
