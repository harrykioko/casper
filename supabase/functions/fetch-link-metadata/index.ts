
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

    console.log('Fetching metadata for URL:', url)

    // Fetch metadata using Microlink
    const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}&meta=false&embed=screenshot.url&screenshot=true&viewport.isMobile=false&viewport.hasTouch=false&goto.waitUntil=networkidle2`
    
    console.log('Calling Microlink API:', microlinkUrl)
    
    const response = await fetch(microlinkUrl)
    console.log('Microlink response status:', response.status)
    console.log('Microlink response headers:', response.headers.get('content-type'))

    if (!response.ok) {
      console.error('Microlink API error:', response.status, response.statusText)
      throw new Error(`Microlink API error: ${response.status}`)
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Microlink returned non-JSON response:', contentType)
      throw new Error('Invalid response format from Microlink')
    }

    const data = await response.json()
    console.log('Microlink response data:', JSON.stringify(data, null, 2))

    // Check if Microlink was successful
    if (data.status !== 'success') {
      console.error('Microlink API failed:', data)
      throw new Error('Failed to fetch metadata from Microlink')
    }

    const metadata = {
      title: data.data?.title || new URL(url).hostname,
      description: data.data?.description || null,
      image: data.data?.image?.url || data.data?.screenshot?.url || null,
      favicon: data.data?.logo?.url || null,
      hostname: new URL(url).hostname,
      url: url
    }

    console.log('Generated metadata:', metadata)

    return new Response(
      JSON.stringify(metadata),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error fetching metadata:', error)
    
    // Fallback metadata
    try {
      const { url: fallbackUrl } = await req.json()
      const urlObj = new URL(fallbackUrl)
      const fallbackMetadata = {
        title: urlObj.hostname,
        description: null,
        image: null,
        favicon: null,
        hostname: urlObj.hostname,
        url: fallbackUrl
      }
      
      console.log('Using fallback metadata:', fallbackMetadata)
      
      return new Response(
        JSON.stringify(fallbackMetadata),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (fallbackError) {
      console.error('Fallback metadata generation failed:', fallbackError)
      return new Response(
        JSON.stringify({ error: 'Invalid URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }
})
