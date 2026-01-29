// Email Cleaning Pipeline - Server-Side Processing
// Strips signatures, disclaimers, calendar content, quoted replies from email bodies

// ============ Types ============

export interface CleanedEmailResult {
  cleanedText: string;
  snippet: string;
  summary: string; // ~120 char one-sentence summary
  displaySubject: string;
  displayFromEmail: string | null;
  displayFromName: string | null;
  signals: {
    isForwarded: boolean;
    hasThread: boolean;
    hasDisclaimer: boolean;
    hasCalendar: boolean;
  };
}

interface ForwardedMeta {
  fromName: string | null;
  fromEmail: string | null;
  subject: string | null;
  bodyAfterHeader: string;
  isForwarded: boolean;
}

// ============ Constants ============

const SNIPPET_LENGTH = 280;
const SUMMARY_LENGTH = 120;
const MAX_CLEANED_LENGTH = 4000;

// Calendar block indicators - cut from first occurrence
const CALENDAR_BLOCK_INDICATORS = [
  "join with google meet",
  "this event has been updated",
  "this event has been changed",
  "this event has been cancelled",
  "invitation from google calendar",
  "action=respond&eid=",
  "action=view&eid=",
  "yes<https://calendar.google.com",
  "no<https://calendar.google.com",
  "maybe<https://calendar.google.com",
  "more options<https://calendar.google.com",
  "view all guest info<https://calendar",
  "reply for ",
  "going (yes",
  "going? yes",
  "\nwhen\n",
  "\nlocation\n", 
  "\nguests\n",
  "microsoft teams meeting",
  "join on your computer",
  "________________",
];

// Forwarded message markers
const FORWARD_MARKERS = [
  "---------- forwarded message ----------",
  "----- forwarded message -----",
  "begin forwarded message:",
  "-------- original message --------",
  "----- original message -----",
];

// Signature indicators
const SIGNATURE_PATTERNS = [
  /^--\s*$/m, // Standard RFC signature delimiter
  /^sent from my iphone/im,
  /^sent from my ipad/im,
  /^sent from my galaxy/im,
  /^sent from my android/im,
  /^sent from outlook/im,
  /^sent from mail for windows/im,
  /^sent from yahoo mail/im,
  /^get outlook for/im,
  /^_{10,}$/m, // Horizontal rule (10+ underscores)
  /^-{10,}$/m, // Horizontal rule (10+ dashes)
];

// Disclaimer keywords (for paragraphs > 150 chars)
const DISCLAIMER_KEYWORDS = [
  "confidential",
  "privileged",
  "intended recipient",
  "authorized recipient",
  "this email and any attachments",
  "if you are not the intended",
  "please notify the sender",
  "legal notice",
  "disclaimer",
  "do not distribute",
  "e-mail disclaimer",
  "this message contains",
  "proprietary information",
  "may contain confidential",
  "solely for the use",
  "unintended recipient",
  "please delete",
  "views expressed",
  "does not necessarily represent",
  "irs circular 230",
  "tax advice",
];

// Quoted reply patterns
const QUOTED_REPLY_PATTERNS = [
  /^on .{1,100} wrote:\s*$/im,
  /^on .{1,100} <.+?> wrote:\s*$/im,
  /^-{3,}\s*original message\s*-{3,}/im,
  /^from:\s*.+\nsent:\s*.+\nto:\s*.+\nsubject:/im,
];

// ============ Main Entry Point ============

export function extractBrief(
  textBody: string,
  htmlBody: string | null,
  subject: string,
  fromEmail: string,
  fromName: string | null
): CleanedEmailResult {
  const signals = {
    isForwarded: false,
    hasThread: false,
    hasDisclaimer: false,
    hasCalendar: false,
  };

  // Step 1: Get plain text (prefer text_body, fallback to HTML conversion)
  let text = textBody || stripHtml(htmlBody || "");
  
  // Step 2: Detect and parse forwarded message
  const forwardedMeta = detectForwarded(text);
  signals.isForwarded = forwardedMeta.isForwarded;
  
  // Use content after forwarded header if present
  if (forwardedMeta.isForwarded && forwardedMeta.bodyAfterHeader) {
    text = forwardedMeta.bodyAfterHeader;
  }

  // Step 3: Canonicalize subject
  const displaySubject = forwardedMeta.subject 
    ? canonicalizeSubject(forwardedMeta.subject)
    : canonicalizeSubject(subject);

  // Step 4: Aggressive calendar block cut (before other cleaning)
  const calendarResult = stripCalendarBlock(text);
  text = calendarResult.text;
  signals.hasCalendar = calendarResult.found;

  // Step 5: Strip at signature delimiter
  text = stripSignatures(text);

  // Step 6: Strip quoted reply threads
  const threadResult = stripQuotedReplies(text);
  text = threadResult.text;
  signals.hasThread = threadResult.found;

  // Step 7: Strip disclaimers (long legal paragraphs)
  const disclaimerResult = stripDisclaimers(text);
  text = disclaimerResult.text;
  signals.hasDisclaimer = disclaimerResult.found;

  // Step 8: Strip CID/inline image references
  text = stripCidReferences(text);

  // Step 9: Normalize whitespace
  text = normalizeWhitespace(text);

  // Step 10: Cap length
  text = capLength(text, MAX_CLEANED_LENGTH);

  // Step 11: Generate snippet
  const snippet = text.substring(0, SNIPPET_LENGTH).trim();

  // Step 12: Generate summary (~120 char one-sentence)
  const summary = generateSummary(text);

  return {
    cleanedText: text,
    snippet,
    summary,
    displaySubject,
    displayFromEmail: forwardedMeta.fromEmail || (signals.isForwarded ? null : fromEmail),
    displayFromName: forwardedMeta.fromName || (signals.isForwarded ? null : fromName),
    signals,
  };
}

// ============ Processing Functions ============

/**
 * Convert HTML to plain text
 */
function stripHtml(html: string): string {
  if (!html) return "";

  return html
    // Remove style and script blocks
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    // Convert block elements to newlines
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/(div|li|tr|h[1-6])>/gi, "\n")
    // Strip remaining tags
    .replace(/<[^>]+>/g, " ")
    // Decode common entities
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&rsquo;|&lsquo;/gi, "'")
    .replace(/&rdquo;|&ldquo;/gi, '"')
    .replace(/&mdash;/gi, "—")
    .replace(/&ndash;/gi, "–")
    .replace(/&#\d+;/g, "") // Strip other numeric entities
    // Collapse whitespace
    .replace(/[ \t]+/g, " ")
    .trim();
}

/**
 * Detect forwarded message and extract original sender info
 */
function detectForwarded(text: string): ForwardedMeta {
  const lowerText = text.toLowerCase();
  
  // Find forwarded message marker
  let markerIndex = -1;
  let markerLength = 0;
  
  for (const marker of FORWARD_MARKERS) {
    const idx = lowerText.indexOf(marker);
    if (idx !== -1 && (markerIndex === -1 || idx < markerIndex)) {
      markerIndex = idx;
      markerLength = marker.length;
    }
  }

  if (markerIndex === -1) {
    // No forwarded marker - check for From:/To:/Subject: block pattern
    const outlookPattern = /^from:\s*.+\nsent:\s*.+\nto:\s*.+\nsubject:/im;
    const match = outlookPattern.exec(text);
    if (match) {
      markerIndex = match.index;
      markerLength = 0;
    }
  }

  if (markerIndex === -1) {
    return {
      fromName: null,
      fromEmail: null,
      subject: null,
      bodyAfterHeader: text,
      isForwarded: false,
    };
  }

  // Content after the marker
  const afterMarker = text.substring(markerIndex + markerLength).trim();
  
  // Parse headers from the forwarded block
  const fromMatch = afterMarker.match(/^From:\s*(.+?)\s*<(.+?)>/im) 
    || afterMarker.match(/^From:\s*<?([^\n<>]+)>?/im);
  const subjectMatch = afterMarker.match(/^Subject:\s*(.+)$/im);

  let fromName: string | null = null;
  let fromEmail: string | null = null;
  let subject: string | null = null;

  if (fromMatch) {
    if (fromMatch.length >= 3) {
      fromName = fromMatch[1].trim();
      fromEmail = fromMatch[2].trim();
    } else {
      fromEmail = fromMatch[1].trim();
    }
  }

  if (subjectMatch) {
    subject = subjectMatch[1].trim();
  }

  // Find where the actual body starts (after the header block)
  // Look for a blank line after the headers
  const lines = afterMarker.split(/\r?\n/);
  let bodyStartLine = 0;
  let seenHeader = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isHeaderLine = /^(from|to|sent|date|subject|cc|bcc):/i.test(line);
    
    if (isHeaderLine) {
      seenHeader = true;
    } else if (seenHeader && line === "") {
      bodyStartLine = i + 1;
      break;
    } else if (seenHeader && !isHeaderLine && line.length > 0) {
      // Non-empty, non-header line after seeing headers = body start
      bodyStartLine = i;
      break;
    }
  }

  const bodyAfterHeader = lines.slice(bodyStartLine).join("\n").trim();

  return {
    fromName,
    fromEmail,
    subject,
    bodyAfterHeader,
    isForwarded: true,
  };
}

/**
 * Remove Re:/Fwd:/FW:/AW: prefixes from subject
 */
function canonicalizeSubject(subject: string): string {
  let result = subject;
  let previousResult = "";
  
  // Loop to strip repeated prefixes
  while (result !== previousResult) {
    previousResult = result;
    result = result.replace(/^\s*(re|fwd|fw|aw|sv|vs):\s*/i, "").trim();
  }
  
  // Fallback if result is too short
  if (result.length < 3) {
    return subject.trim();
  }
  
  return result;
}

/**
 * Aggressively cut at calendar block indicators
 */
function stripCalendarBlock(text: string): { text: string; found: boolean } {
  const lowerText = text.toLowerCase();
  let earliestIndex = text.length;
  let found = false;

  for (const indicator of CALENDAR_BLOCK_INDICATORS) {
    const idx = lowerText.indexOf(indicator);
    // Only cut if indicator is found after some content (>50 chars)
    if (idx !== -1 && idx > 50 && idx < earliestIndex) {
      earliestIndex = idx;
      found = true;
    }
  }

  if (found) {
    return { text: text.substring(0, earliestIndex).trim(), found: true };
  }

  return { text, found: false };
}

/**
 * Strip signature blocks
 */
function stripSignatures(text: string): string {
  let result = text;

  // Find standard RFC signature delimiter (-- on its own line)
  const sigMatch = result.match(/^--\s*$/m);
  if (sigMatch && sigMatch.index !== undefined && sigMatch.index > 50) {
    result = result.substring(0, sigMatch.index).trim();
    return result; // Don't continue processing after finding primary delimiter
  }

  // Check other signature patterns
  for (const pattern of SIGNATURE_PATTERNS) {
    const match = result.match(pattern);
    if (match && match.index !== undefined && match.index > 50) {
      result = result.substring(0, match.index).trim();
      break;
    }
  }

  // Look for common sign-off + name pattern (Best, Name or Thanks, Name)
  const signoffPattern = /\n\s*(best|thanks|regards|cheers|sincerely|warm regards|best regards|kind regards|many thanks),?\s*\n\s*[A-Z][a-z]+(\s+[A-Z][a-z]+)?\s*$/i;
  const signoffMatch = result.match(signoffPattern);
  if (signoffMatch && signoffMatch.index !== undefined) {
    // Keep the sign-off, cut after the name
    const endOfSignoff = signoffMatch.index + signoffMatch[0].length;
    result = result.substring(0, endOfSignoff).trim();
  }

  return result;
}

/**
 * Strip quoted reply threads
 */
function stripQuotedReplies(text: string): { text: string; found: boolean } {
  let result = text;
  let found = false;

  // Remove "On ... wrote:" patterns
  for (const pattern of QUOTED_REPLY_PATTERNS) {
    const match = result.match(pattern);
    if (match && match.index !== undefined && match.index > 50) {
      result = result.substring(0, match.index).trim();
      found = true;
      break;
    }
  }

  // Remove lines starting with >
  const lines = result.split("\n");
  const cleanedLines: string[] = [];
  let inQuoteBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith(">")) {
      inQuoteBlock = true;
      found = true;
    } else if (inQuoteBlock && trimmed === "") {
      // Allow blank lines in quote blocks
      continue;
    } else {
      inQuoteBlock = false;
      cleanedLines.push(line);
    }
  }

  return { text: cleanedLines.join("\n"), found };
}

/**
 * Strip legal disclaimers (long paragraphs with legal keywords)
 */
function stripDisclaimers(text: string): { text: string; found: boolean } {
  const paragraphs = text.split(/\n\n+/);
  const cleanedParagraphs: string[] = [];
  let found = false;

  for (const para of paragraphs) {
    const trimmed = para.trim();
    
    // Skip short paragraphs
    if (trimmed.length < 150) {
      cleanedParagraphs.push(para);
      continue;
    }

    // Check for disclaimer keywords
    const lowerPara = trimmed.toLowerCase();
    const isDisclaimer = DISCLAIMER_KEYWORDS.some(keyword => 
      lowerPara.includes(keyword)
    );

    if (isDisclaimer) {
      found = true;
      // Skip this paragraph
    } else {
      cleanedParagraphs.push(para);
    }
  }

  return { text: cleanedParagraphs.join("\n\n"), found };
}

/**
 * Strip CID and inline image references
 */
function stripCidReferences(text: string): string {
  return text
    .replace(/\[cid:[^\]]+\]/gi, "")
    .replace(/\[image:[^\]]+\]/gi, "")
    .replace(/<cid:[^>]+>/gi, "");
}

/**
 * Normalize whitespace
 */
function normalizeWhitespace(text: string): string {
  return text
    // CRLF to LF
    .replace(/\r\n/g, "\n")
    // Collapse 3+ newlines to double newline
    .replace(/\n{3,}/g, "\n\n")
    // Strip extra spaces/tabs per line
    .replace(/[ \t]+/g, " ")
    // Trim each line
    .split("\n")
    .map(line => line.trim())
    .join("\n")
    // Final trim
    .trim();
}

/**
 * Cap content length at word boundaries
 */
function capLength(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Find last space before maxLength
  const lastSpace = text.lastIndexOf(" ", maxLength);
  if (lastSpace > maxLength * 0.8) {
    return text.substring(0, lastSpace).trim();
  }

  return text.substring(0, maxLength).trim();
}

/**
 * Generate a ~120 character one-sentence summary
 * Strips greetings, takes first meaningful sentence
 */
function generateSummary(text: string): string {
  if (!text || text.trim().length === 0) {
    return "";
  }

  let content = text.trim();

  // Strip common greetings at the start
  const greetingPatterns = [
    /^(hi|hey|hello|dear|good\s+(morning|afternoon|evening)),?\s*[a-z]*,?\s*/i,
    /^(hope\s+(this|you).{0,50}\.?\s*)/i,
    /^(thanks?\s+for.{0,50}\.?\s*)/i,
  ];

  for (const pattern of greetingPatterns) {
    content = content.replace(pattern, "").trim();
  }

  // Split into sentences (handle common sentence endings)
  const sentences = content.split(/(?<=[.!?])\s+/);
  
  // Find first meaningful sentence (at least 20 chars, not just a name)
  let summary = "";
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.length >= 20 && !/^[A-Z][a-z]+(\s+[A-Z][a-z]+)?$/.test(trimmed)) {
      summary = trimmed;
      break;
    }
  }

  // Fallback: use first chunk of content
  if (!summary && content.length > 0) {
    summary = content;
  }

  // Truncate to ~120 chars at word boundary
  if (summary.length > SUMMARY_LENGTH) {
    const lastSpace = summary.lastIndexOf(" ", SUMMARY_LENGTH);
    if (lastSpace > SUMMARY_LENGTH * 0.7) {
      summary = summary.substring(0, lastSpace).trim();
    } else {
      summary = summary.substring(0, SUMMARY_LENGTH).trim();
    }
    // Add ellipsis if truncated mid-sentence
    if (!summary.endsWith(".") && !summary.endsWith("!") && !summary.endsWith("?")) {
      summary = summary + "…";
    }
  }

  return summary;
}
