// Thread Parser - Extracts and concatenates messages from email threads
// Used to provide context-aware extraction for forwarded/replied email chains

export interface ThreadMessage {
  index: number;
  content: string;
  sender?: string;
  date?: string;
}

export interface ParsedThread {
  messages: ThreadMessage[];
  latestCleanText: string;
  threadCleanText: string | null;
  messageCount: number;
}

// Thread/reply markers to detect message boundaries
const THREAD_MARKERS = [
  /^On .{10,100} wrote:\s*$/im,
  /^On .{10,100} <.+?> wrote:\s*$/im,
  /^-{3,}\s*Original Message\s*-{3,}/im,
  /^From:\s*.+\n(?:Sent|Date):\s*.+\nTo:\s*.+\n(?:Subject:)?/im,
  /^_{20,}$/m,
  /^---------- Forwarded message ----------$/im,
  /^----- Forwarded Message -----$/im,
  /^Begin forwarded message:$/im,
];

// Max chars per message block
const MAX_BLOCK_LENGTH = 1500;
// Max total thread context length
const MAX_THREAD_LENGTH = 6000;
// Max messages to keep
const MAX_MESSAGES = 5;

/**
 * Parse email text into thread messages
 * Returns both the latest message and concatenated thread context
 */
export function parseEmailThread(text: string): ParsedThread {
  if (!text || text.trim().length === 0) {
    return {
      messages: [],
      latestCleanText: "",
      threadCleanText: null,
      messageCount: 0,
    };
  }

  // Find all thread marker positions
  const markerPositions: { index: number; marker: string }[] = [];
  
  for (const pattern of THREAD_MARKERS) {
    let match;
    const globalPattern = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
    
    while ((match = globalPattern.exec(text)) !== null) {
      markerPositions.push({
        index: match.index,
        marker: match[0],
      });
    }
  }

  // Sort by position
  markerPositions.sort((a, b) => a.index - b.index);

  // If no markers found, treat entire text as single message
  if (markerPositions.length === 0) {
    const cleaned = text.trim();
    return {
      messages: [{ index: 0, content: cleaned }],
      latestCleanText: cleaned,
      threadCleanText: null,
      messageCount: 1,
    };
  }

  // Split into message blocks
  const messages: ThreadMessage[] = [];
  
  // First message: from start to first marker
  const firstMessage = text.substring(0, markerPositions[0].index).trim();
  if (firstMessage.length > 0) {
    messages.push({
      index: 0,
      content: truncateBlock(firstMessage, MAX_BLOCK_LENGTH),
    });
  }

  // Subsequent messages: between markers
  for (let i = 0; i < markerPositions.length; i++) {
    const start = markerPositions[i].index + markerPositions[i].marker.length;
    const end = i + 1 < markerPositions.length 
      ? markerPositions[i + 1].index 
      : text.length;
    
    const content = text.substring(start, end).trim();
    if (content.length > 0) {
      // Try to extract sender/date from the marker
      const { sender, date } = extractMetaFromMarker(markerPositions[i].marker);
      
      messages.push({
        index: messages.length,
        content: truncateBlock(content, MAX_BLOCK_LENGTH),
        sender,
        date,
      });
    }
  }

  // Latest message is the first one (most recent)
  const latestCleanText = messages.length > 0 ? messages[0].content : text.trim();

  // If only one message, no thread context needed
  if (messages.length <= 1) {
    return {
      messages,
      latestCleanText,
      threadCleanText: null,
      messageCount: messages.length,
    };
  }

  // Build thread context from most recent messages
  const threadMessages = messages.slice(0, MAX_MESSAGES);
  const threadParts: string[] = [];
  let totalLength = 0;

  for (let i = 0; i < threadMessages.length; i++) {
    const msg = threadMessages[i];
    const label = i === 0 ? "--- Message 1 (most recent) ---" : `--- Message ${i + 1} ---`;
    const block = `${label}\n${msg.content}`;
    
    if (totalLength + block.length > MAX_THREAD_LENGTH) {
      break;
    }
    
    threadParts.push(block);
    totalLength += block.length;
  }

  const threadCleanText = threadParts.join("\n\n");

  return {
    messages: threadMessages,
    latestCleanText,
    threadCleanText: threadCleanText.length > latestCleanText.length ? threadCleanText : null,
    messageCount: threadMessages.length,
  };
}

/**
 * Truncate a block to max length, preserving sentence boundaries where possible
 */
function truncateBlock(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Try to cut at sentence boundary
  const truncated = text.substring(0, maxLength);
  const lastPeriod = truncated.lastIndexOf(". ");
  const lastNewline = truncated.lastIndexOf("\n");
  
  const cutPoint = Math.max(lastPeriod, lastNewline);
  
  if (cutPoint > maxLength * 0.6) {
    return text.substring(0, cutPoint + 1).trim();
  }
  
  return truncated.trim() + "...";
}

/**
 * Extract sender/date metadata from thread marker if possible
 */
function extractMetaFromMarker(marker: string): { sender?: string; date?: string } {
  // Try "On [date] [sender] wrote:" pattern
  const onWroteMatch = marker.match(/^On (.+?) (.+?) wrote:$/i);
  if (onWroteMatch) {
    return {
      date: onWroteMatch[1],
      sender: onWroteMatch[2],
    };
  }

  // Try "From: [sender]" pattern
  const fromMatch = marker.match(/^From:\s*(.+?)$/im);
  if (fromMatch) {
    return { sender: fromMatch[1].trim() };
  }

  return {};
}
