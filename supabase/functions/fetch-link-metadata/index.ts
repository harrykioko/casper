
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    
    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch metadata using Microlink
    const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}&meta=false&embed=screenshot.url&screenshot=true&viewport.isMobile=false&viewport.hasTouch=false&goto.waitUntil=networkidle2`
    
    const response = await fetch(microlinkUrl)
    const data = await response.json()

    if (!data.status === 'success') {
      throw new Error('Failed to fetch metadata')
    }

    const metadata = {
      title: data.data.title || new URL(url).hostname,
      description: data.data.description || null,
      image: data.data.image?.url || data.data.screenshot?.url || null,
      favicon: data.data.logo?.url || null,
      hostname: new URL(url).hostname,
      url: url
    }

    return new Response(
      JSON.stringify(metadata),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error fetching metadata:', error)
    
    // Fallback metadata
    try {
      const urlObj = new URL(url)
      const fallbackMetadata = {
        title: urlObj.hostname,
        description: null,
        image: null,
        favicon: null,
        hostname: urlObj.hostname,
        url: url
      }
      
      return new Response(
        JSON.stringify(fallbackMetadata),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }
})
