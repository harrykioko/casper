/**
 * Normalize a URL for deduplication purposes.
 * Strips tracking params, trailing slashes, and lowercases the hostname.
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Lowercase hostname
    parsed.hostname = parsed.hostname.toLowerCase();

    // Remove common tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'fbclid', 'gclid'];
    for (const param of trackingParams) {
      parsed.searchParams.delete(param);
    }

    // Remove trailing slash from pathname
    if (parsed.pathname.endsWith('/') && parsed.pathname.length > 1) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }

    // Remove hash
    parsed.hash = '';

    return parsed.toString();
  } catch {
    return url;
  }
}
