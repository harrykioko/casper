
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory store to track used codes (in production, use Redis or database)
const usedCodes = new Set<string>();
const usedStates = new Set<string>();

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
      console.error('No authorization header provided');
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Invalid authentication:', userError);
      return new Response(JSON.stringify({ error: 'Invalid authentication' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Request authenticated for user:', user.id);

    if (req.method === 'GET') {
      // Generate authorization URL
      const clientId = Deno.env.get('MICROSOFT_CLIENT_ID');
      const redirectUri = Deno.env.get('MICROSOFT_REDIRECT_URI');
      
      console.log('Microsoft OAuth Config Check:');
      console.log('- Client ID exists:', !!clientId);
      console.log('- Client ID format:', clientId ? `${clientId.substring(0, 8)}...` : 'missing');
      console.log('- Redirect URI:', redirectUri);
      
      if (!clientId || !redirectUri) {
        console.error('Missing Microsoft OAuth configuration');
        return new Response(JSON.stringify({ error: 'Microsoft OAuth not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
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
      console.log('- User ID:', user.id);
      
      if (action === 'callback') {
        // Basic validation - check if state contains user ID
        if (!state || !state.includes(user.id)) {
          console.error('State validation failed: state does not contain user ID', { 
            expected_user: user.id, 
            received_state: state 
          });
          return new Response(JSON.stringify({ error: 'Invalid state parameter' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if state has already been used
        if (usedStates.has(state)) {
          console.error('State already used:', state);
          return new Response(JSON.stringify({ error: 'State parameter has already been used' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if code has already been used
        if (usedCodes.has(code)) {
          console.error('Code already used:', code.substring(0, 20) + '...');
          return new Response(JSON.stringify({ error: 'Authorization code has already been used' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Mark state and code as used immediately
        usedStates.add(state);
        usedCodes.add(code);
        console.log('Marked state and code as used');

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
          // Clean up on configuration error
          usedStates.delete(state);
          usedCodes.delete(code);
          return new Response(JSON.stringify({ error: 'Missing Microsoft OAuth configuration' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
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

        try {
          const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: tokenRequestBody,
          });

          console.log('Token response status:', tokenResponse.status);

          const tokenResponseText = await tokenResponse.text();
          console.log('Token response received');

          if (!tokenResponse.ok) {
            console.error('Token exchange failed with status:', tokenResponse.status);
            // Clean up on token exchange failure
            usedStates.delete(state);
            usedCodes.delete(code);
            
            let errorMessage = `Failed to exchange code for token. Status: ${tokenResponse.status}`;
            
            try {
              const errorData = JSON.parse(tokenResponseText);
              console.error('Microsoft error details:', errorData);
              errorMessage = `Microsoft token exchange failed: ${errorData.error} - ${errorData.error_description || 'Unknown error'}`;
            } catch (parseError) {
              console.error('Failed to parse error response:', parseError);
            }
            
            return new Response(JSON.stringify({ error: errorMessage }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          let tokenData;
          try {
            tokenData = JSON.parse(tokenResponseText);
            console.log('Token data parsed successfully');
          } catch (parseError) {
            console.error('Failed to parse token response:', parseError);
            // Clean up on parsing failure
            usedStates.delete(state);
            usedCodes.delete(code);
            return new Response(JSON.stringify({ error: 'Invalid token response from Microsoft' }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
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
            // Clean up on user info failure
            usedStates.delete(state);
            usedCodes.delete(code);
            return new Response(JSON.stringify({ error: 'Failed to get user info from Microsoft Graph' }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const userData = await userResponse.json();
          console.log('User data received:', {
            id: userData.id,
            email: userData.mail || userData.userPrincipalName,
            displayName: userData.displayName
          });

          // Store connection in database with improved error handling
          const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
          
          console.log('Storing connection in database...');
          
          try {
            // First try to update existing connection
            const { data: existingConnection, error: selectError } = await supabaseClient
              .from('outlook_connections')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();

            if (selectError) {
              console.error('Error checking existing connection:', selectError);
            }

            let dbError;
            if (existingConnection) {
              // Update existing connection
              console.log('Updating existing connection for user:', user.id);
              const { error } = await supabaseClient
                .from('outlook_connections')
                .update({
                  access_token: tokenData.access_token,
                  refresh_token: tokenData.refresh_token,
                  token_expires_at: expiresAt.toISOString(),
                  microsoft_user_id: userData.id,
                  email: userData.mail || userData.userPrincipalName,
                  display_name: userData.displayName,
                  is_active: true,
                  updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id);
              dbError = error;
            } else {
              // Insert new connection
              console.log('Creating new connection for user:', user.id);
              const { error } = await supabaseClient
                .from('outlook_connections')
                .insert({
                  user_id: user.id,
                  access_token: tokenData.access_token,
                  refresh_token: tokenData.refresh_token,
                  token_expires_at: expiresAt.toISOString(),
                  microsoft_user_id: userData.id,
                  email: userData.mail || userData.userPrincipalName,
                  display_name: userData.displayName,
                  is_active: true,
                });
              dbError = error;
            }

            if (dbError) {
              console.error('Database operation error:', dbError);
              // Clean up on database failure
              usedStates.delete(state);
              usedCodes.delete(code);
              return new Response(JSON.stringify({ 
                error: 'Failed to store connection', 
                details: dbError.message 
              }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }

            console.log('Database operation completed successfully');
        } catch (dbException) {
            console.error('Database exception:', dbException);
            // Clean up on database exception
            usedStates.delete(state);
            usedCodes.delete(code);
            return new Response(JSON.stringify({ 
              error: 'Database operation failed', 
              details: (dbException as Error).message 
            }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          console.log('OAuth flow completed successfully');
          
          // Clean up old used codes and states periodically (keep last 500 each)
          if (usedCodes.size > 1000) {
            const codesArray = Array.from(usedCodes);
            usedCodes.clear();
            codesArray.slice(-500).forEach(code => usedCodes.add(code));
          }
          
          if (usedStates.size > 1000) {
            const statesArray = Array.from(usedStates);
            usedStates.clear();
            statesArray.slice(-500).forEach(state => usedStates.add(state));
          }

          return new Response(JSON.stringify({ success: true, user: userData }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
          
        } catch (fetchError) {
          console.error('Network error during token exchange:', fetchError);
          // Clean up on network error
          usedStates.delete(state);
          usedCodes.delete(code);
          return new Response(JSON.stringify({ error: 'Network error during authentication' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    console.log('Invalid request method or action');
    return new Response(JSON.stringify({ error: 'Invalid request' }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
