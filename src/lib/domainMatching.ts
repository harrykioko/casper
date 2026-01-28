/**
 * Domain matching utilities for linking calendar events and emails to companies
 */

/**
 * Extracts primary domain from a website URL
 * "https://www.openyield.com/about" → "openyield.com"
 * "https://dots.dev/" → "dots.dev"
 */
export function extractDomainFromWebsite(websiteUrl: string | null | undefined): string | null {
  if (!websiteUrl || typeof websiteUrl !== 'string') return null;
  
  const normalized = normalizeHostname(websiteUrl);
  
  // Validate: must contain a dot and no spaces
  if (!normalized || !normalized.includes('.') || normalized.includes(' ')) {
    return null;
  }
  
  return normalized;
}

/**
 * Extracts domain from email address
 * "harry@openyield.com" → "openyield.com"
 */
export function getDomainFromEmail(email: string): string | null {
  if (!email || typeof email !== 'string') return null;
  
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');
  
  if (atIndex === -1 || atIndex === trimmed.length - 1) return null;
  
  const domain = trimmed.substring(atIndex + 1);
  
  // Basic validation: must contain a dot and no spaces
  if (!domain.includes('.') || domain.includes(' ')) return null;
  
  return domain;
}

/**
 * Normalizes hostname by stripping www. prefix
 * "www.stripe.com" → "stripe.com"
 */
export function normalizeHostname(hostname: string): string {
  if (!hostname || typeof hostname !== 'string') return '';
  
  let normalized = hostname.trim().toLowerCase();
  
  // Remove protocol if present
  normalized = normalized.replace(/^https?:\/\//, '');
  
  // Remove trailing slashes and paths
  normalized = normalized.split('/')[0];
  
  // Remove www. prefix
  if (normalized.startsWith('www.')) {
    normalized = normalized.substring(4);
  }
  
  return normalized;
}

/**
 * Checks if email domain matches company's primary_domain
 */
export function emailMatchesCompanyDomain(
  email: string,
  primaryDomain: string | null | undefined
): boolean {
  if (!primaryDomain) return false;
  
  const emailDomain = getDomainFromEmail(email);
  if (!emailDomain) return false;
  
  const normalizedCompanyDomain = normalizeHostname(primaryDomain);
  if (!normalizedCompanyDomain) return false;
  
  return emailDomain === normalizedCompanyDomain;
}

/**
 * Checks if ANY attendee email matches company domain
 * Attendees format from calendar_events: { email?: string, name?: string }[]
 */
export function attendeeEmailsMatchCompany(
  attendees: Array<{ email?: string | null; name?: string | null }> | null | undefined,
  primaryDomain: string | null | undefined
): boolean {
  if (!attendees || !Array.isArray(attendees) || !primaryDomain) return false;
  
  return attendees.some(attendee => {
    if (!attendee?.email) return false;
    return emailMatchesCompanyDomain(attendee.email, primaryDomain);
  });
}

/**
 * Checks if inbox item (from/to emails) matches company domain
 */
export function inboxItemMatchesCompany(
  fromEmail: string | null | undefined,
  toEmail: string | null | undefined,
  primaryDomain: string | null | undefined
): boolean {
  if (!primaryDomain) return false;
  
  if (fromEmail && emailMatchesCompanyDomain(fromEmail, primaryDomain)) {
    return true;
  }
  
  if (toEmail && emailMatchesCompanyDomain(toEmail, primaryDomain)) {
    return true;
  }
  
  return false;
}
