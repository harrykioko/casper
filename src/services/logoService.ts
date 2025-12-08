/**
 * Logo fetching service using Supabase Edge Function
 * Primary: Logo.dev (authenticated) with Google Favicon fallback
 */

import { supabase } from "@/integrations/supabase/client";

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
 * Fetches a company logo URL from the website using the edge function
 * 
 * Strategy:
 * 1. Primary: Logo.dev CDN (authenticated, high quality)
 * 2. Fallback: Google Favicon service (always works)
 * 
 * @param websiteUrl - The company website URL
 * @returns Logo URL or null if not found
 */
export async function fetchCompanyLogo(websiteUrl: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke('fetch-company-logo', {
      body: { websiteUrl }
    });

    if (error) {
      console.error('Edge function error:', error);
      // Fall back to Google Favicon on error
      const domain = extractDomain(websiteUrl);
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    }

    return data?.logoUrl || null;
  } catch (error) {
    console.error('Failed to fetch company logo:', error);
    // Ultimate fallback
    try {
      const domain = extractDomain(websiteUrl);
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch {
      return null;
    }
  }
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
