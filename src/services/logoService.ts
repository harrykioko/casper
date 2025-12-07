/**
 * Logo fetching service using Logo.dev as primary source
 * with Google Favicon as fallback
 */

/**
 * Extracts domain from a URL, stripping www. prefix
 */
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    throw new Error('Invalid URL');
  }
}

/**
 * Tests if an image URL is accessible
 */
async function testImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type');
    return response.ok && (contentType?.startsWith('image/') ?? false);
  } catch {
    return false;
  }
}

/**
 * Fetches a company logo URL from the website
 * 
 * Strategy:
 * 1. Primary: Logo.dev CDN (high quality company logos)
 * 2. Fallback: Google Favicon service (always works)
 * 
 * @param websiteUrl - The company website URL
 * @returns Logo URL or null if not found
 */
export async function fetchCompanyLogo(websiteUrl: string): Promise<string | null> {
  const domain = extractDomain(websiteUrl);

  // Primary: Logo.dev (no token needed for basic usage via CDN)
  // Their CDN serves logos at: https://img.logo.dev/{domain}
  const logoDevUrl = `https://img.logo.dev/${domain}?token=pk_X-1ZWAKgTmqR8FQOHbMBTw`;
  
  // Test if Logo.dev has the logo
  const logoDevWorks = await testImageUrl(logoDevUrl);
  if (logoDevWorks) {
    return logoDevUrl;
  }

  // Fallback: Google Favicon service (128px, always available)
  const googleFaviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  
  return googleFaviconUrl;
}

/**
 * Gets the fallback favicon URL for a domain
 * Useful when you just need a quick icon without waiting
 */
export function getFaviconUrl(websiteUrl: string): string | null {
  try {
    const domain = extractDomain(websiteUrl);
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return null;
  }
}
