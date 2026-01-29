import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { websiteUrl } = await req.json();
    
    if (!websiteUrl) {
      return new Response(
        JSON.stringify({ error: "websiteUrl is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOGO_DEV_TOKEN = Deno.env.get("LOGO_DEV_TOKEN");
    
    if (!LOGO_DEV_TOKEN) {
      console.error("LOGO_DEV_TOKEN not configured");
      return new Response(
        JSON.stringify({ error: "Logo service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract domain from URL
    let domain: string;
    try {
      const parsed = new URL(websiteUrl);
      domain = parsed.hostname.replace(/^www\./, '');
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching logo for domain: ${domain}`);

    // Try Logo.dev first (with authenticated token)
    const logoDevUrl = `https://img.logo.dev/${domain}?token=${LOGO_DEV_TOKEN}`;
    
    try {
      const logoResponse = await fetch(logoDevUrl, { method: 'HEAD' });
      const contentType = logoResponse.headers.get('content-type');
      
      if (logoResponse.ok && contentType?.startsWith('image/')) {
        console.log(`Logo.dev returned valid logo for ${domain}`);
        return new Response(
          JSON.stringify({ logoUrl: logoDevUrl, source: 'logo.dev' }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (error) {
      console.log(`Logo.dev fetch failed for ${domain}:`, (error as Error).message);
    }

    // Fallback to Google Favicon (always works)
    const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    console.log(`Falling back to Google Favicon for ${domain}`);
    
    return new Response(
      JSON.stringify({ logoUrl: faviconUrl, source: 'google-favicon' }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in fetch-company-logo:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
