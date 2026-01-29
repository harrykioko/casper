import { getDomainFromEmail } from './domainMatching';

interface JoinLink {
  url: string;
  provider: 'zoom' | 'teams' | 'meet' | 'webex';
}

const JOIN_PATTERNS: Array<{ regex: RegExp; provider: JoinLink['provider'] }> = [
  { regex: /https?:\/\/[\w.-]*zoom\.us\/[^\s"<)]+/i, provider: 'zoom' },
  { regex: /https?:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\s"<)]+/i, provider: 'teams' },
  { regex: /https?:\/\/meet\.google\.com\/[^\s"<)]+/i, provider: 'meet' },
  { regex: /https?:\/\/[\w.-]*webex\.com\/[^\s"<)]+/i, provider: 'webex' },
];

/**
 * Scans location + description HTML for Zoom/Teams/Meet/Webex URLs.
 * Returns { url, provider } or null.
 */
export function extractJoinLink(event: { location?: string; description?: string }): JoinLink | null {
  const haystack = [event.location || '', event.description || ''].join(' ');
  for (const { regex, provider } of JOIN_PATTERNS) {
    const match = haystack.match(regex);
    if (match) {
      return { url: match[0], provider };
    }
  }
  return null;
}

// Patterns to strip from description HTML
const BOILERPLATE_PATTERNS = [
  // Zoom boilerplate blocks
  /─+\s*[\s\S]*?zoom\.us[\s\S]*?(?:─+|$)/gi,
  /<div[^>]*>[\s\S]*?Join Zoom Meeting[\s\S]*?<\/div>/gi,
  /Join Zoom Meeting[\s\S]*?(?:Meeting ID|Password|Passcode)[\s\S]*?(?:\d[\s\S]{0,200})?/gi,
  // Teams boilerplate
  /<div[^>]*>[\s\S]*?Join the meeting now[\s\S]*?<\/div>/gi,
  /<div[^>]*>[\s\S]*?Microsoft Teams meeting[\s\S]*?<\/div>/gi,
  /_{10,}[\s\S]*?Microsoft Teams[\s\S]*?(?:_{10,}|$)/gi,
  // Google Meet
  /<div[^>]*>[\s\S]*?meet\.google\.com[\s\S]*?<\/div>/gi,
  // Signature blocks (common pattern: dashes or underscores followed by name/title)
  /(?:<br\s*\/?>){2,}\s*--\s*[\s\S]*$/gi,
  // ICS calendar content
  /BEGIN:VCALENDAR[\s\S]*?END:VCALENDAR/gi,
  // Common email disclaimer blocks
  /<div[^>]*class="[^"]*(?:signature|disclaimer|footer)[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
];

/**
 * Removes Zoom boilerplate, Teams blocks, signature blocks, ICS content.
 * Returns { clean, isBoilerplateOnly }.
 */
export function stripBoilerplate(html: string): { clean: string; isBoilerplateOnly: boolean } {
  if (!html) return { clean: '', isBoilerplateOnly: true };

  let cleaned = html;
  for (const pattern of BOILERPLATE_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Trim whitespace and empty tags
  cleaned = cleaned
    .replace(/<(?:p|div|br|span)\s*\/?>\s*(?:<\/(?:p|div|span)>)?/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();

  // Check if anything meaningful remains
  const textOnly = cleaned.replace(/<[^>]+>/g, '').trim();
  const isBoilerplateOnly = textOnly.length < 10;

  return { clean: cleaned, isBoilerplateOnly };
}

const PERSONAL_DOMAINS = new Set([
  'gmail.com', 'googlemail.com',
  'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
  'yahoo.com', 'ymail.com',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com',
  'protonmail.com', 'proton.me',
  'zoho.com',
  'mail.com',
  'fastmail.com',
]);

/**
 * Gets unique non-personal domains from attendee emails.
 * Filters out gmail, outlook, yahoo, hotmail, icloud, etc.
 */
export function extractAttendeeDomains(
  attendees: Array<{ email?: string; name?: string }> | null | undefined
): string[] {
  if (!attendees || !Array.isArray(attendees)) return [];

  const domains = new Set<string>();
  for (const attendee of attendees) {
    if (!attendee.email) continue;
    const domain = getDomainFromEmail(attendee.email);
    if (domain && !PERSONAL_DOMAINS.has(domain)) {
      domains.add(domain);
    }
  }
  return Array.from(domains);
}
