// Email content cleaning utilities for stripping forwarded wrappers, 
// disclaimers, signatures, and sanitizing HTML

export interface ForwardedMeta {
  fromName: string | null;
  fromEmail: string | null;
  subject: string | null;
  date: string | null;
}

export interface CleanedEmail {
  cleanedText: string;
  cleanedHtml: string | null;
  originalSender: { name: string | null; email: string | null } | null;
  originalSubject: string | null;
  originalDate: string | null;
  wasForwarded: boolean;
  cleaningApplied: string[];
}

// Forwarded message markers
const FORWARDED_MARKERS = [
  "---------- Forwarded message ---------",
  "---------- Forwarded message ----------",
  "--- Original Message ---",
  "-------- Original Message --------",
  "Begin forwarded message:",
];

// Header line patterns
const HEADER_PATTERNS = [
  /^From:\s*.+$/im,
  /^Sent:\s*.+$/im,
  /^To:\s*.+$/im,
  /^Subject:\s*.+$/im,
  /^Date:\s*.+$/im,
  /^Cc:\s*.+$/im,
];

// Disclaimer patterns - strip from first match onwards
const DISCLAIMER_PATTERNS = [
  "DISCLAIMER:",
  "DISCLAIMER",
  "CONFIDENTIALITY NOTICE",
  "CONFIDENTIALITY NOTICE:",
  "CONFIDENTIALITY NOTE",
  "CONFIDENTIALITY NOTE:",
  "CONFIDENTIALITY:",
  "This email and any attachments",
  "This email and any files transmitted",
  "If you are not the intended recipient",
  "This message is intended only",
  "This communication is confidential",
  "This e-mail is confidential",
  "The information contained in this email",
  "NOTICE: This email is intended for",
  "________________________________",
  "This message contains confidential",
  "The contents of this email",
  "IMPORTANT NOTICE:",
  "LEGAL NOTICE:",
];

// Signature markers
const SIGNATURE_MARKERS = [
  "\n-- \n",
  "\n--\n",
  "\nSent from my iPhone",
  "\nSent from my iPad",
  "\nSent from Outlook",
  "\nGet Outlook for",
  "\nSent from Mail for",
];

// Phone patterns that often appear in signatures
const PHONE_PATTERN = /(?:Tel|Phone|Mobile|Cell|Fax|Direct Line|Direct|Office|Work|Main):\s*[\d\s\-\+\(\)\.]+/i;

// Inline quote patterns (Gmail-style replies)
const INLINE_QUOTE_PATTERNS = [
  /On .{10,80} wrote:\s*$/im,
  /On .{10,60}, .{3,40} <.+@.+> wrote:/im,
  /On .{10,60} at .{5,20}, .+? wrote:/im,
  /\d{1,2}\/\d{1,2}\/\d{2,4}.{1,40}<.+@.+>.{0,10}wrote:/im,
];

/**
 * Main function to clean email content
 */
export function cleanEmailContent(
  textBody: string | null,
  htmlBody: string | null
): CleanedEmail {
  const cleaningApplied: string[] = [];
  let cleanedText = textBody || "";
  let cleanedHtml = htmlBody || null;
  let originalSender: { name: string | null; email: string | null } | null = null;
  let originalSubject: string | null = null;
  let originalDate: string | null = null;
  let wasForwarded = false;

  const originalLength = cleanedText.length;

  // Step 1: Extract and strip forwarded wrapper
  const forwardResult = stripForwardedWrapper(cleanedText);
  if (forwardResult.meta) {
    wasForwarded = true;
    originalSender = {
      name: forwardResult.meta.fromName,
      email: forwardResult.meta.fromEmail,
    };
    originalSubject = forwardResult.meta.subject;
    originalDate = forwardResult.meta.date;
    cleanedText = forwardResult.body;
    cleaningApplied.push("forwarded_wrapper");
  }

  // Step 2: Strip inline quoted replies
  const quoteResult = stripInlineQuotes(cleanedText);
  if (quoteResult !== cleanedText) {
    cleanedText = quoteResult;
    cleaningApplied.push("inline_quotes");
  }

  // Step 3: Strip disclaimers
  const disclaimerResult = stripDisclaimers(cleanedText);
  if (disclaimerResult !== cleanedText) {
    cleanedText = disclaimerResult;
    cleaningApplied.push("disclaimers");
  }

  // Step 4: Strip signatures (only if they don't remove too much)
  const signatureResult = stripSignatures(cleanedText);
  if (signatureResult !== cleanedText && signatureResult.length > cleanedText.length * 0.3) {
    cleanedText = signatureResult;
    cleaningApplied.push("signatures");
  }

  // Step 5: Clean HTML if present
  if (cleanedHtml) {
    // First sanitize HTML
    cleanedHtml = sanitizeHtml(cleanedHtml);
    cleaningApplied.push("html_sanitized");
    
    // Then try to clean disclaimers from HTML
    const htmlCleanResult = cleanHtmlContent(cleanedHtml, cleanedText);
    if (htmlCleanResult.wasModified) {
      cleanedHtml = htmlCleanResult.html;
      if (!cleaningApplied.includes("disclaimers")) {
        cleaningApplied.push("html_disclaimers");
      }
    }
  }

  // Safety check: if we removed more than 80% of content, fall back to original
  if (cleanedText.length < originalLength * 0.2 && originalLength > 100) {
    cleanedText = textBody || "";
    cleaningApplied.push("fallback_too_aggressive");
  }

  // Final trim
  cleanedText = cleanedText.trim();

  return {
    cleanedText,
    cleanedHtml,
    originalSender,
    originalSubject,
    originalDate,
    wasForwarded,
    cleaningApplied,
  };
}

/**
 * Strip forwarded message wrapper and extract metadata
 * Now also strips content BEFORE the forwarded marker (forwarder's signature)
 */
export function stripForwardedWrapper(text: string): {
  body: string;
  meta: ForwardedMeta | null;
} {
  let meta: ForwardedMeta | null = null;
  let body = text;

  // Find forwarded marker
  let markerIndex = -1;
  let markerLength = 0;
  for (const marker of FORWARDED_MARKERS) {
    const idx = text.indexOf(marker);
    if (idx !== -1 && (markerIndex === -1 || idx < markerIndex)) {
      markerIndex = idx;
      markerLength = marker.length;
    }
  }

  if (markerIndex === -1) {
    // Check for header block at start (From: line within first 20 lines)
    const lines = text.split(/\r?\n/);
    let headerBlockEnd = -1;
    let fromLine = "";
    let subjectLine = "";
    let dateLine = "";
    
    for (let i = 0; i < Math.min(15, lines.length); i++) {
      const line = lines[i].trim();
      if (/^From:\s*.+$/i.test(line)) {
        fromLine = line;
      } else if (/^Subject:\s*.+$/i.test(line)) {
        subjectLine = line;
      } else if (/^Date:\s*.+$/i.test(line)) {
        dateLine = line;
      }
      // Detect end of header block (empty line after headers or line without colon)
      if (fromLine && subjectLine && line === "") {
        headerBlockEnd = i;
        break;
      }
    }

    if (fromLine && headerBlockEnd > 0) {
      meta = parseHeaderLines(fromLine, subjectLine, dateLine);
      body = lines.slice(headerBlockEnd + 1).join("\n").trim();
    }

    return { body, meta };
  }

  // IMPORTANT: Strip content BEFORE the marker (forwarder's signature)
  // Only keep content AFTER the forwarded marker

  // Extract lines after the marker
  const afterMarker = text.substring(markerIndex + markerLength);
  const lines = afterMarker.split(/\r?\n/);
  
  let headerEndIndex = 0;
  let fromLine = "";
  let subjectLine = "";
  let dateLine = "";

  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    
    if (/^From:\s*.+$/i.test(line)) {
      fromLine = line;
      headerEndIndex = i;
    } else if (/^Subject:\s*.+$/i.test(line)) {
      subjectLine = line;
      headerEndIndex = i;
    } else if (/^Date:\s*.+$/i.test(line)) {
      dateLine = line;
      headerEndIndex = i;
    } else if (/^To:\s*.+$/i.test(line) || /^Cc:\s*.+$/i.test(line)) {
      headerEndIndex = i;
    } else if (line === "" && headerEndIndex > 0) {
      // Empty line after headers marks end
      headerEndIndex = i;
      break;
    }
  }

  if (fromLine || subjectLine) {
    meta = parseHeaderLines(fromLine, subjectLine, dateLine);
    body = lines.slice(headerEndIndex + 1).join("\n").trim();
  } else {
    body = afterMarker.trim();
  }

  return { body, meta };
}

/**
 * Parse header lines to extract metadata
 */
function parseHeaderLines(
  fromLine: string,
  subjectLine: string,
  dateLine: string
): ForwardedMeta {
  let fromName: string | null = null;
  let fromEmail: string | null = null;
  let subject: string | null = null;
  let date: string | null = null;

  // Parse From: line - formats: "Name <email>", "<email>", "email"
  if (fromLine) {
    const fromMatch = fromLine.match(/^From:\s*(?:(.+?)\s*)?<(.+?)>$/i) ||
                      fromLine.match(/^From:\s*<?([^>\n]+)>?$/i);
    if (fromMatch) {
      if (fromMatch.length >= 3) {
        fromName = fromMatch[1]?.trim() || null;
        fromEmail = fromMatch[2]?.trim() || null;
      } else {
        fromEmail = fromMatch[1]?.trim() || null;
      }
    }
  }

  // Parse Subject: line
  if (subjectLine) {
    const subjectMatch = subjectLine.match(/^Subject:\s*(.+)$/i);
    if (subjectMatch) {
      subject = subjectMatch[1].trim();
    }
  }

  // Parse Date: line
  if (dateLine) {
    const dateMatch = dateLine.match(/^Date:\s*(.+)$/i);
    if (dateMatch) {
      date = dateMatch[1].trim();
    }
  }

  return { fromName, fromEmail, subject, date };
}

/**
 * Strip inline quoted replies (Gmail-style "On X wrote:")
 */
export function stripInlineQuotes(text: string): string {
  let result = text;
  
  for (const pattern of INLINE_QUOTE_PATTERNS) {
    const match = result.match(pattern);
    if (match && match.index !== undefined) {
      // Only strip if we're not removing too much content (at least 20% should remain)
      const beforeQuote = result.substring(0, match.index);
      if (beforeQuote.length > result.length * 0.2) {
        result = beforeQuote.trim();
        break;
      }
    }
  }
  
  return result;
}

/**
 * Strip legal disclaimers from content
 */
export function stripDisclaimers(text: string): string {
  let result = text;
  let earliestIndex = result.length;

  for (const pattern of DISCLAIMER_PATTERNS) {
    const index = result.toLowerCase().indexOf(pattern.toLowerCase());
    // Only strip if pattern appears after some reasonable content (at least 50 chars)
    if (index !== -1 && index > 50 && index < earliestIndex) {
      earliestIndex = index;
    }
  }

  if (earliestIndex < result.length) {
    result = result.substring(0, earliestIndex).trim();
  }

  return result;
}

/**
 * Strip email signatures
 */
export function stripSignatures(text: string): string {
  let result = text;

  // Check for common signature markers
  for (const marker of SIGNATURE_MARKERS) {
    const index = result.indexOf(marker);
    if (index !== -1 && index > result.length * 0.3) {
      // Only strip if marker is in latter portion of email
      result = result.substring(0, index).trim();
      break;
    }
  }

  // Check for phone patterns at end (common in signatures)
  const lines = result.split(/\r?\n/);
  let signatureStartLine = -1;
  
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 10); i--) {
    const line = lines[i].trim();
    if (PHONE_PATTERN.test(line)) {
      signatureStartLine = i;
      break;
    }
  }

  // If we found a phone line near the end, check if preceding lines look like a signature
  if (signatureStartLine !== -1 && signatureStartLine > lines.length * 0.5) {
    // Look back for short lines that might be name/title
    let cutLine = signatureStartLine;
    for (let i = signatureStartLine - 1; i >= Math.max(0, signatureStartLine - 5); i--) {
      const line = lines[i].trim();
      if (line.length === 0 || line.length < 60) {
        cutLine = i;
      } else {
        break;
      }
    }
    result = lines.slice(0, cutLine).join("\n").trim();
  }

  return result;
}

/**
 * Clean HTML content by trying to remove disclaimers and signatures
 */
export function cleanHtmlContent(html: string, cleanedText: string): {
  html: string;
  wasModified: boolean;
} {
  let result = html;
  let wasModified = false;

  // Try to find and remove disclaimer blocks in HTML
  // Common patterns: divs/tables at the end with disclaimer keywords
  
  // Look for disclaimer text in HTML and try to truncate
  for (const pattern of DISCLAIMER_PATTERNS) {
    const patternLower = pattern.toLowerCase();
    const htmlLower = result.toLowerCase();
    const index = htmlLower.indexOf(patternLower);
    
    if (index !== -1 && index > result.length * 0.3) {
      // Find the nearest opening tag before the disclaimer
      const beforeDisclaimer = result.substring(0, index);
      
      // Look for common wrapper patterns
      const divMatch = beforeDisclaimer.lastIndexOf("<div");
      const pMatch = beforeDisclaimer.lastIndexOf("<p");
      const tableMatch = beforeDisclaimer.lastIndexOf("<table");
      const tdMatch = beforeDisclaimer.lastIndexOf("<td");
      
      // Use the closest opening tag
      const cutPoints = [divMatch, pMatch, tableMatch, tdMatch].filter(x => x > 0);
      if (cutPoints.length > 0) {
        const cutPoint = Math.max(...cutPoints);
        // Only cut if we're keeping at least 30% of content
        if (cutPoint > result.length * 0.3) {
          result = result.substring(0, cutPoint).trim();
          wasModified = true;
          break;
        }
      }
    }
  }

  // Remove trailing empty divs/paragraphs
  result = result.replace(/(<div[^>]*>\s*<\/div>\s*)+$/gi, "");
  result = result.replace(/(<p[^>]*>\s*<\/p>\s*)+$/gi, "");
  result = result.replace(/(<br\s*\/?\s*>\s*)+$/gi, "");

  return { html: result, wasModified };
}

/**
 * Sanitize HTML content
 */
export function sanitizeHtml(html: string): string {
  let result = html;

  // Remove script tags
  result = result.replace(/<script[\s\S]*?<\/script>/gi, "");

  // Remove style tags
  result = result.replace(/<style[\s\S]*?<\/style>/gi, "");

  // Remove event handlers
  result = result.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
  result = result.replace(/\s+on\w+\s*=\s*[^\s>]*/gi, "");

  // Remove javascript: URLs
  result = result.replace(/javascript:[^"'\s]*/gi, "");

  // Remove data: URLs that might contain scripts
  result = result.replace(/data:text\/html[^"'\s]*/gi, "");

  // Remove tracking pixels (1x1 images)
  result = result.replace(/<img[^>]*(?:width|height)\s*=\s*["']?1["']?[^>]*(?:width|height)\s*=\s*["']?1["']?[^>]*>/gi, "");

  // Remove meta refresh
  result = result.replace(/<meta[^>]*http-equiv\s*=\s*["']?refresh["']?[^>]*>/gi, "");

  return result;
}

/**
 * Split content at disclaimer for "View more" functionality (legacy helper)
 */
export function splitContentAtDisclaimer(content: string): {
  main: string;
  disclaimer: string | null;
} {
  const cleaned = cleanEmailContent(content, null);
  
  if (cleaned.cleaningApplied.includes("disclaimers") || 
      cleaned.cleaningApplied.includes("forwarded_wrapper") ||
      cleaned.cleaningApplied.includes("signatures")) {
    return {
      main: cleaned.cleanedText,
      disclaimer: content.length > cleaned.cleanedText.length 
        ? content.substring(cleaned.cleanedText.length).trim() 
        : null,
    };
  }

  return { main: content, disclaimer: null };
}
