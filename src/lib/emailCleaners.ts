// Email content cleaning utilities for stripping forwarded wrappers, 
// disclaimers, signatures, calendar content, and sanitizing HTML

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

// Google Calendar patterns (for complete removal)
const CALENDAR_PATTERNS = [
  "Invitation from Google Calendar",
  "You are receiving this email because you are an attendee",
  "Forwarding this invitation could allow any recipient",
  "Join with Google Meet",
  "View all guest info",
  "More options<https://calendar.google.com",
  "RSVP to view up-to-date information",
  "Going?",
  "more details »",
  "Calendar<https://calendar.google.com",
  "This event has been updated",
  "This event has been changed",
];

// Calendar RSVP line patterns
const CALENDAR_RSVP_PATTERNS = [
  /^Yes<https:\/\/calendar\.google\.com/im,
  /^No<https:\/\/calendar\.google\.com/im,
  /^Maybe<https:\/\/calendar\.google\.com/im,
  /^Yes\s*-\s*No\s*-\s*Maybe/im,
  /^Going\?\s*Yes\s*-?\s*No\s*-?\s*Maybe/im,
];

// Calendar metadata patterns (When:/Where:/Guests:)
const CALENDAR_METADATA_PATTERNS = [
  /^When:\s*.+$/im,
  /^Where:\s*.+$/im,
  /^Guests:\s*.+$/im,
  /^Calendar:\s*.+$/im,
  /^Who:\s*.+$/im,
  /^Video call:\s*.+$/im,
];

// Phone patterns that often appear in signatures
const PHONE_PATTERN = /(?:Tel|Phone|Mobile|Cell|Fax|Direct Line|Direct|Office|Work|Main):\s*[\d\s\-\+\(\)\.]+/i;

// Inline quote patterns (Gmail-style replies)
const INLINE_QUOTE_PATTERNS = [
  /On .{10,80} wrote:\s*$/im,
  /On .{10,60}, .{3,40} <.+@.+> wrote:/im,
  /On .{10,60} at .{5,20}, .+? wrote:/im,
  /\d{1,2}\/\d{1,2}\/\d{2,4}.{1,40}<.+@.+>.{0,10}wrote:/im,
  // Gmail format: "On Tue, Jan 13, 2026 at 11:05 AM Name <email> wrote:"
  /On \w{3}, \w{3} \d{1,2}, \d{4} at \d{1,2}:\d{2}\s*(?:AM|PM)?\s+[^<\n]+<[^>]+>\s*wrote:/im,
  /On \w{3}, \w{3} \d{1,2}, \d{4} at \d{1,2}:\d{2}\s*(?:AM|PM)?,?\s*.+?(?:<.+?>)?\s*wrote:/im,
  /On \w{3,9}, \w{3,9} \d{1,2}, \d{4},?\s*.+?(?:<.+?>)?\s*wrote:/im,
  // Generic fallback: "On [day], [person] wrote:"
  /On [A-Z][a-z]{2}, [A-Z][a-z]{2} \d{1,2}, \d{4}.{0,60}wrote:/im,
];

// Sign-off patterns that indicate end of meaningful content
const SIGNOFF_PATTERNS = [
  /\n\s*(Best|Thanks|Regards|Cheers|Kind regards|Best regards|Warm regards|Many thanks),?\s*\n/i,
];

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Strip content after a sign-off like "Best,\nName" if junk follows
 */
function stripAfterSignOff(text: string): string {
  // Pattern: Sign-off, newline, short name (1-3 words), then check what follows
  const signOffPattern = /\n\s*(Best|Thanks|Regards|Cheers|Kind regards|Best regards|Warm regards|Many thanks),?\s*\n\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*\n/im;
  const match = text.match(signOffPattern);
  
  if (match && match.index !== undefined) {
    const afterSignOff = match.index + match[0].length;
    const remainingContent = text.substring(afterSignOff);
    
    // Check if remaining content looks like junk (signature block, quotes, disclaimers)
    const isJunk = 
      remainingContent.trim().startsWith('--') ||
      remainingContent.trim().startsWith('[http') ||
      remainingContent.trim().startsWith('On ') ||
      /^\s*\n\s*\n/.test(remainingContent) ||
      /^[A-Z][a-z]+\s*\|/m.test(remainingContent) ||
      /^[CM][:.]\s*\(?\d{3}/.test(remainingContent.trim()) ||
      /^From:/im.test(remainingContent.trim()) ||
      remainingContent.trim().length > 200; // Long content after sign-off is suspicious
    
    if (isJunk && match.index > 50) {
      // Keep content through "Best,\nMyles" but cut the junk after
      return text.substring(0, afterSignOff).trim();
    }
  }
  
  return text;
}

/**
 * Main function to clean email content
 */
export function cleanEmailContent(
  textBody: string | null,
  htmlBody: string | null,
  senderName?: string
): CleanedEmail {
  const cleaningApplied: string[] = [];
  let cleanedText = textBody || "";
  let cleanedHtml = htmlBody || null;
  let originalSender: { name: string | null; email: string | null } | null = null;
  let originalSubject: string | null = null;
  let originalDate: string | null = null;
  let wasForwarded = false;

  const originalLength = cleanedText.length;

  // Step 1: Extract and strip forwarded wrapper (also strips forwarder's signature before marker)
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

  // Step 2: Strip calendar event content
  const calendarResult = stripCalendarContent(cleanedText);
  if (calendarResult !== cleanedText) {
    cleanedText = calendarResult;
    cleaningApplied.push("calendar_content");
  }

  // Step 3: Strip inline quoted replies
  const quoteResult = stripInlineQuotes(cleanedText);
  if (quoteResult !== cleanedText) {
    cleanedText = quoteResult;
    cleaningApplied.push("inline_quotes");
  }

  // Step 4: Strip disclaimers (more aggressively)
  const disclaimerResult = stripDisclaimers(cleanedText);
  if (disclaimerResult !== cleanedText) {
    cleanedText = disclaimerResult;
    cleaningApplied.push("disclaimers");
  }

  // Step 5: Strip signatures (pass sender name for better detection)
  const signatureResult = stripSignatures(cleanedText, senderName);
  if (signatureResult !== cleanedText && signatureResult.length > cleanedText.length * 0.15) {
    cleanedText = signatureResult;
    cleaningApplied.push("signatures");
  }

  // Step 6: Strip after common sign-offs if signature junk follows
  cleanedText = stripAfterSignOff(cleanedText);

  // Step 6: Clean HTML if present
  if (cleanedHtml) {
    // First sanitize HTML
    cleanedHtml = sanitizeHtml(cleanedHtml);
    cleaningApplied.push("html_sanitized");
    
    // Then try to clean disclaimers and calendar content from HTML
    const htmlCleanResult = cleanHtmlContent(cleanedHtml, cleanedText);
    if (htmlCleanResult.wasModified) {
      cleanedHtml = htmlCleanResult.html;
      if (!cleaningApplied.includes("disclaimers")) {
        cleaningApplied.push("html_disclaimers");
      }
    }
  }

  // Safety check: if we removed more than 85% of content, fall back to original
  if (cleanedText.length < originalLength * 0.15 && originalLength > 100) {
    cleanedText = textBody || "";
    cleaningApplied.push("fallback_too_aggressive");
  }

  // Final trim and cleanup
  cleanedText = cleanedText.trim();
  
  // Remove any trailing horizontal lines
  cleanedText = cleanedText.replace(/\n_{10,}$/g, "").trim();

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
 * Strip Google Calendar event content blocks
 */
export function stripCalendarContent(text: string): string {
  let result = text;
  
  // Check for calendar-related content
  let hasCalendarContent = false;
  for (const pattern of CALENDAR_PATTERNS) {
    if (result.toLowerCase().includes(pattern.toLowerCase())) {
      hasCalendarContent = true;
      break;
    }
  }
  
  if (!hasCalendarContent) {
    // Check RSVP patterns
    for (const pattern of CALENDAR_RSVP_PATTERNS) {
      if (pattern.test(result)) {
        hasCalendarContent = true;
        break;
      }
    }
  }
  
  if (!hasCalendarContent) {
    return result;
  }
  
  const lines = result.split(/\r?\n/);
  const cleanedLines: string[] = [];
  let inCalendarBlock = false;
  let skipNextBlankLines = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();
    const lineTrimmed = line.trim();
    
    // Check for calendar block start
    const isCalendarLine = CALENDAR_PATTERNS.some(p => lineLower.includes(p.toLowerCase())) ||
      CALENDAR_RSVP_PATTERNS.some(p => p.test(lineTrimmed)) ||
      CALENDAR_METADATA_PATTERNS.some(p => p.test(lineTrimmed)) ||
      /^https:\/\/calendar\.google\.com/i.test(lineTrimmed) ||
      /^https:\/\/meet\.google\.com/i.test(lineTrimmed) ||
      /^https:\/\/www\.google\.com\/calendar/i.test(lineTrimmed) ||
      /^more details\s*[»›>]/i.test(lineTrimmed) ||
      /^\s*Yes\s*<\s*https:/i.test(lineTrimmed) ||
      /^\s*No\s*<\s*https:/i.test(lineTrimmed) ||
      /^\s*Maybe\s*<\s*https:/i.test(lineTrimmed);
    
    if (isCalendarLine) {
      inCalendarBlock = true;
      skipNextBlankLines = 2;
      continue;
    }
    
    // Skip blank lines after calendar content
    if (skipNextBlankLines > 0 && lineTrimmed === "") {
      skipNextBlankLines--;
      continue;
    }
    
    // Exit calendar block on substantive content
    if (inCalendarBlock && lineTrimmed !== "" && lineTrimmed.length > 20) {
      // Check if this looks like body content vs more calendar junk
      const isBodyContent = !isCalendarLine && 
        !/^(when|where|who|guests|calendar|video call):/i.test(lineTrimmed) &&
        !/^https?:\/\//i.test(lineTrimmed);
      
      if (isBodyContent) {
        inCalendarBlock = false;
      }
    }
    
    if (!inCalendarBlock && !isCalendarLine) {
      cleanedLines.push(line);
    }
  }
  
  result = cleanedLines.join("\n").trim();
  
  // Also strip any remaining calendar fragments
  result = result.replace(/\n*Going\?\s*Yes\s*[-–]?\s*No\s*[-–]?\s*Maybe\s*\n*/gi, "\n");
  result = result.replace(/\n*more details\s*[»›>]\s*\n*/gi, "\n");
  
  return result.trim();
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

  // IMPORTANT: Content BEFORE the marker is the forwarder's additions
  // Only keep content AFTER the forwarded marker
  // The content before is typically the forwarder's signature or short note

  // Extract lines after the marker
  const afterMarker = text.substring(markerIndex + markerLength);
  const lines = afterMarker.split(/\r?\n/);
  
  let headerEndIndex = 0;
  let fromLine = "";
  let subjectLine = "";
  let dateLine = "";

  for (let i = 0; i < Math.min(12, lines.length); i++) {
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
  
  // First, strip horizontal rule dividers followed by reply headers
  const horizontalRulePattern = /\n_{20,}\n+(?:From:|Sent:|To:|Subject:)/im;
  const ruleMatch = result.match(horizontalRulePattern);
  if (ruleMatch && ruleMatch.index !== undefined) {
    const beforeRule = result.substring(0, ruleMatch.index);
    if (beforeRule.length > 50) {
      result = beforeRule.trim();
    }
  }
  
  // Check for reply header blocks (From:/Sent:/To:/Subject:)
  const replyHeaderPattern = /\n\s*From:\s*.+\n\s*Sent:\s*.+\n\s*To:/im;
  const replyMatch = result.match(replyHeaderPattern);
  if (replyMatch && replyMatch.index !== undefined) {
    const beforeReply = result.substring(0, replyMatch.index);
    if (beforeReply.length > 50) {
      result = beforeReply.trim();
    }
  }
  
  // Then check "On X wrote:" patterns
  for (const pattern of INLINE_QUOTE_PATTERNS) {
    const match = result.match(pattern);
    if (match && match.index !== undefined) {
      // Only strip if we're not removing too much content (at least 15% should remain)
      const beforeQuote = result.substring(0, match.index);
      if (beforeQuote.length > 30 && beforeQuote.length > result.length * 0.15) {
        result = beforeQuote.trim();
        break;
      }
    }
  }
  
  return result;
}

/**
 * Strip legal disclaimers from content - more aggressively finds ALL instances
 */
export function stripDisclaimers(text: string): string {
  let result = text;
  let earliestIndex = result.length;

  // Find the EARLIEST disclaimer that appears after reasonable content
  for (const pattern of DISCLAIMER_PATTERNS) {
    const patternLower = pattern.toLowerCase();
    const textLower = result.toLowerCase();
    
    // Find ALL occurrences of this pattern
    let searchIndex = 0;
    while (searchIndex < textLower.length) {
      const index = textLower.indexOf(patternLower, searchIndex);
      if (index === -1) break;
      
      // Only strip if pattern appears after some reasonable content (at least 30 chars)
      if (index > 30 && index < earliestIndex) {
        earliestIndex = index;
      }
      searchIndex = index + 1;
    }
  }

  if (earliestIndex < result.length) {
    result = result.substring(0, earliestIndex).trim();
  }

  return result;
}

/**
 * Strip email signatures with enhanced Outlook detection
 */
export function stripSignatures(text: string, senderName?: string): string {
  let result = text;
  const isShortEmail = result.length < 500;

  // 0. AGGRESSIVE: Cut at standalone -- marker (RFC signature delimiter)
  const dashDashPattern = /\n--\s*\n/;
  const dashMatch = result.match(dashDashPattern);
  if (dashMatch && dashMatch.index !== undefined && dashMatch.index > 50) {
    result = result.substring(0, dashMatch.index).trim();
    // Early return - nothing meaningful after --
    return result;
  }

  // 1. Check for common signature markers first
  for (const marker of SIGNATURE_MARKERS) {
    const index = result.indexOf(marker);
    // For short emails, be more aggressive (don't require marker to be past 30%)
    const threshold = isShortEmail ? 0.1 : 0.25;
    if (index !== -1 && index > result.length * threshold) {
      result = result.substring(0, index).trim();
      break;
    }
  }

  // 2. NEW: Check for sender's name followed by pipe (Outlook "Name | Title" format)
  if (senderName && senderName.length > 3) {
    const namePattern = new RegExp(
      `^${escapeRegex(senderName)}\\s*[|]`,
      "im"
    );
    const nameMatch = result.match(namePattern);
    if (nameMatch && nameMatch.index !== undefined) {
      // Found sender's name with pipe - this is signature start
      // Only strip if we have some content before it (at least 15 chars)
      if (nameMatch.index > 15) {
        result = result.substring(0, nameMatch.index).trim();
        return result;
      }
    }
  }

  // 3. Check for C:/M: phone pattern (common Outlook cell format)
  const cellPattern = /^[CM][:.]\s*\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}/m;
  const cellMatch = result.match(cellPattern);
  if (cellMatch && cellMatch.index !== undefined) {
    // Look back for the signature start (name line)
    const beforeCell = result.substring(0, cellMatch.index);
    const lines = beforeCell.split(/\r?\n/);
    
    // Check last 4 lines for name-like pattern
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 4); i--) {
      const line = lines[i].trim();
      // Name | Title pattern
      if (/^[A-Z][a-z]+\s+[A-Z][a-z]+\s*[|]/.test(line)) {
        const cutIndex = result.indexOf(line);
        if (cutIndex > 15) {
          result = result.substring(0, cutIndex).trim();
          return result;
        }
      }
    }
    
    // If no name found, cut at cell line if we have enough content
    if (cellMatch.index > 25) {
      result = result.substring(0, cellMatch.index).trim();
      return result;
    }
  }

  // 4. Check for "Name | Title" pattern anywhere (even without sender name)
  const nameTitlePattern = /^[A-Z][a-z]+\s+[A-Z][a-z]+\s*\|\s*[A-Z]/m;
  const nameTitleMatch = result.match(nameTitlePattern);
  if (nameTitleMatch && nameTitleMatch.index !== undefined) {
    // Found a "Name | Title" line
    const threshold = isShortEmail ? 15 : 40;
    if (nameTitleMatch.index > threshold) {
      result = result.substring(0, nameTitleMatch.index).trim();
      return result;
    }
  }

  // 5. Check for mailto: links (common in Outlook signatures)
  const mailtoPattern = /<mailto:[^>]+>/;
  const mailtoMatch = result.match(mailtoPattern);
  if (mailtoMatch && mailtoMatch.index !== undefined) {
    // Look back for signature start
    const beforeMailto = result.substring(0, mailtoMatch.index);
    const lines = beforeMailto.split(/\r?\n/);
    
    // Find where signature likely starts (look for name patterns)
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 6); i--) {
      const line = lines[i].trim();
      if (/^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(line) && line.length < 60) {
        const cutIndex = result.indexOf(line);
        if (cutIndex > 15) {
          result = result.substring(0, cutIndex).trim();
          return result;
        }
      }
    }
  }

  // 6. Check for bracketed company taglines [Company Name...]
  const taglinePattern = /\[[A-Z][^\]]{10,}\]/;
  const taglineMatch = result.match(taglinePattern);
  if (taglineMatch && taglineMatch.index !== undefined) {
    // This is often at the end of a signature, look back for start
    const beforeTagline = result.substring(0, taglineMatch.index);
    const lines = beforeTagline.split(/\r?\n/);
    
    for (let i = lines.length - 1; i >= Math.max(0, lines.length - 7); i--) {
      const line = lines[i].trim();
      // Look for name or phone patterns
      if (/^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(line) || 
          /^[CM][:.]\s*\(?\d{3}/.test(line) ||
          /^[A-Z][a-z]+\s*\|/.test(line)) {
        const cutIndex = result.indexOf(line);
        if (cutIndex > 15) {
          result = result.substring(0, cutIndex).trim();
          return result;
        }
      }
    }
  }

  // 7. Original phone pattern check with lowered thresholds for short emails
  const lines = result.split(/\r?\n/);
  let signatureStartLine = -1;
  
  // For short emails, look through more lines
  const linesToCheck = isShortEmail ? Math.min(18, lines.length) : 12;
  
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - linesToCheck); i--) {
    const line = lines[i].trim();
    if (PHONE_PATTERN.test(line)) {
      signatureStartLine = i;
      break;
    }
  }

  // If we found a phone line, check if preceding lines look like a signature
  // Lower threshold for short emails
  const lineThreshold = isShortEmail ? 0.15 : 0.4;
  if (signatureStartLine !== -1 && signatureStartLine > lines.length * lineThreshold) {
    // Look back for short lines that might be name/title
    let cutLine = signatureStartLine;
    for (let i = signatureStartLine - 1; i >= Math.max(0, signatureStartLine - 6); i--) {
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
 * Clean HTML content by trying to remove disclaimers, signatures, and calendar content
 */
export function cleanHtmlContent(html: string, cleanedText: string): {
  html: string;
  wasModified: boolean;
} {
  let result = html;
  let wasModified = false;

  // Remove calendar-related content from HTML
  for (const pattern of CALENDAR_PATTERNS) {
    const patternLower = pattern.toLowerCase();
    const htmlLower = result.toLowerCase();
    if (htmlLower.includes(patternLower)) {
      // Try to remove the containing element
      const index = htmlLower.indexOf(patternLower);
      if (index !== -1) {
        // Find containing table/div
        const beforePattern = result.substring(0, index);
        const tableStart = beforePattern.lastIndexOf("<table");
        const divStart = beforePattern.lastIndexOf("<div");
        
        const cutPoint = Math.max(tableStart, divStart);
        if (cutPoint > result.length * 0.1) {
          result = result.substring(0, cutPoint).trim();
          wasModified = true;
        }
      }
    }
  }

  // Try to find and remove disclaimer blocks in HTML
  for (const pattern of DISCLAIMER_PATTERNS) {
    const patternLower = pattern.toLowerCase();
    const htmlLower = result.toLowerCase();
    const index = htmlLower.indexOf(patternLower);
    
    if (index !== -1 && index > result.length * 0.2) {
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
        // Only cut if we're keeping at least 20% of content
        if (cutPoint > result.length * 0.2) {
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
      cleaned.cleaningApplied.includes("signatures") ||
      cleaned.cleaningApplied.includes("calendar_content")) {
    return {
      main: cleaned.cleanedText,
      disclaimer: content.length > cleaned.cleanedText.length 
        ? content.substring(cleaned.cleanedText.length).trim() 
        : null,
    };
  }

  return { main: content, disclaimer: null };
}
