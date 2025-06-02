import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory store to track used codes (in production, use Redis or database)
const usedCodes = new Set<string>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid authentication');
    }

    if (req.method === 'GET') {
      // Generate authorization URL
      const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
      const redirectUri = Deno.env.get('MICROSOFT_REDIRECT_URI');
      
      console.log('Microsoft OAuth Config Check:');
      console.log('- Client ID exists:', !!clientId);
      console.log('- Client ID format:', clientId ? `${clientId.substring(0, 8)}...` : 'missing');
      console.log('- Redirect URI:', redirectUri);
      
      if (!clientId || !redirectUri) {
        throw new Error('Microsoft OAuth not configured');
      }

      // Generate a unique state value with timestamp to prevent reuse
      const state = `${user.id}_${Date.now()}_${Math.random().toString(36).substring(2)}`;

      const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('scope', 'https://graph.microsoft.com/calendars.read https://graph.microsoft.com/user.read offline_access');
      authUrl.searchParams.set('state', state);
      authUrl.searchParams.set('response_mode', 'query');

      console.log('Generated auth URL with unique state:', state);
      return new Response(JSON.stringify({ authUrl: authUrl.toString() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (req.method === 'POST') {
      // Handle OAuth callback
      const { code, state, action } = await req.json();
      
      console.log('OAuth callback received:');
      console.log('- Action:', action);
      console.log('- Code received:', !!code);
      console.log('- Code length:', code ? code.length : 0);
      console.log('- State received:', state);
      
      if (action === 'callback') {
        // Validate state format and extract user ID
        const statePattern = new RegExp(`^${user.id}_\\d+_[a-z0-9]+$`);
        if (!state || !statePattern.test(state)) {
          console.error('State validation failed:', { expected_pattern: `${user.id}_*`, received: state });
          throw new Error('Invalid or expired state parameter');
        }

        // Check if code has already been used
        if (usedCodes.has(code)) {
          console.error('Code already used:', code.substring(0, 20) + '...');
          throw new Error('Authorization code has already been used');
        }

        // Mark code as used immediately
        usedCodes.add(code);
        console.log('Marked code as used, total used codes:', usedCodes.size);

        const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
        const clientSecret = Deno.env.get('MICROSOFT_CLIENT_SECRET');
        const redirectUri = Deno.env.get('MICROSOFT_REDIRECT_URI');

        console.log('Token exchange attempt:');
        console.log('- Client ID:', clientId ? `${clientId.substring(0, 8)}...` : 'missing');
        console.log('- Client Secret exists:', !!clientSecret);
        console.log('- Client Secret length:', clientSecret ? clientSecret.length : 0);
        console.log('- Redirect URI:', redirectUri);

        if (!clientId || !clientSecret || !redirectUri) {
          console.error('Missing required environment variables');
          throw new Error('Missing Microsoft OAuth configuration');
        }

        // Exchange code for tokens
        const tokenRequestBody = new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code: code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        });

        console.log('Making token exchange request to Microsoft...');

        const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: tokenRequestBody,
        });

        console.log('Token response status:', tokenResponse.status);

        const tokenResponseText = await tokenResponse.text();
        console.log('Token response body:', tokenResponseText);

        if (!tokenResponse.ok) {
          console.error('Token exchange failed with status:', tokenResponse.status);
          // Remove code from used set if token exchange fails
          usedCodes.delete(code);
          try {
            const errorData = JSON.parse(tokenResponseText);
            console.error('Microsoft error details:', errorData);
            throw new Error(`Microsoft token exchange failed: ${errorData.error} - ${errorData.error_description || 'Unknown error'}`);
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
            throw new Error(`Failed to exchange code for token. Status: ${tokenResponse.status}, Response: ${tokenResponseText}`);
          }
        }

        let tokenData;
        try {
          tokenData = JSON.parse(tokenResponseText);
          console.log('Token data received:', {
            access_token: !!tokenData.access_token,
            refresh_token: !!tokenData.refresh_token,
            expires_in: tokenData.expires_in,
            token_type: tokenData.token_type
          });
        } catch (parseError) {
          console.error('Failed to parse token response:', parseError);
          // Remove code from used set if parsing fails
          usedCodes.delete(code);
          throw new Error('Invalid token response from Microsoft');
        }
        
        // Get user info from Microsoft Graph
        console.log('Fetching user info from Microsoft Graph...');
        const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
          },
        });

        console.log('User info response status:', userResponse.status);

        if (!userResponse.ok) {
          const userErrorText = await userResponse.text();
          console.error('Failed to get user info:', userErrorText);
          // Remove code from used set if user info fails
          usedCodes.delete(code);
          throw new Error('Failed to get user info from Microsoft Graph');
        }

        const userData = await userResponse.json();
        console.log('User data received:', {
          id: userData.id,
          email: userData.mail || userData.userPrincipalName,
          displayName: userData.displayName
        });

        // Store connection in database
        const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
        
        console.log('Storing connection in database...');
        const { error } = await supabaseClient
          .from('outlook_connections')
          .upsert({
            user_id: user.id,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            token_expires_at: expiresAt.toISOString(),
            microsoft_user_id: userData.id,
            email: userData.mail || userData.userPrincipalName,
            display_name: userData.displayName,
            is_active: true,
          }, {
            onConflict: 'user_id',
          });

        if (error) {
          console.error('Database error:', error);
          // Remove code from used set if database storage fails
          usedCodes.delete(code);
          throw new Error('Failed to store connection');
        }

        console.log('OAuth flow completed successfully');
        
        // Clean up old used codes periodically (keep last 1000)
        if (usedCodes.size > 1000) {
          const codesArray = Array.from(usedCodes);
          usedCodes.clear();
          // Keep the most recent codes (this is a simple cleanup)
          codesArray.slice(-500).forEach(code => usedCodes.add(code));
        }

        return new Response(JSON.stringify({ success: true, user: userData }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
