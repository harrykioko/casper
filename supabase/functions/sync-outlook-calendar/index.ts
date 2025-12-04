
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Get user's Outlook connection
    const { data: connection, error: connectionError } = await supabaseClient
      .from('outlook_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (connectionError || !connection) {
      throw new Error('No active Outlook connection found');
    }

    let accessToken = connection.access_token;
    
    // Check if token needs refresh
    const now = new Date();
    const expiresAt = new Date(connection.token_expires_at);
    
    if (now >= expiresAt) {
      console.log('Token expired, attempting refresh...');
      
      // Refresh token
      const refreshResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: Deno.env.get('MICROSOFT_CLIENT_ID')!,
          client_secret: Deno.env.get('MICROSOFT_CLIENT_SECRET')!,
          refresh_token: connection.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!refreshResponse.ok) {
        const errorData = await refreshResponse.text();
        console.error('Token refresh failed:', refreshResponse.status, errorData);
        
        // Mark connection as inactive since refresh failed
        await supabaseClient
          .from('outlook_connections')
          .update({ is_active: false })
          .eq('id', connection.id);
        
        throw new Error('RECONNECT_REQUIRED: Your Outlook connection has expired. Please reconnect your account in Settings.');
      }

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;
      console.log('Token refreshed successfully');
      
      // Update stored tokens
      const newExpiresAt = new Date(Date.now() + (refreshData.expires_in * 1000));
      await supabaseClient
        .from('outlook_connections')
        .update({
          access_token: refreshData.access_token,
          refresh_token: refreshData.refresh_token || connection.refresh_token,
          token_expires_at: newExpiresAt.toISOString(),
        })
        .eq('id', connection.id);
    }

    // Fetch calendar events from Microsoft Graph
    const startTime = new Date();
    startTime.setHours(0, 0, 0, 0); // Start of today
    const endTime = new Date();
    endTime.setDate(endTime.getDate() + 30); // Next 30 days
    endTime.setHours(23, 59, 59, 999); // End of day

    const graphUrl = new URL('https://graph.microsoft.com/v1.0/me/calendar/events');
    graphUrl.searchParams.set('$filter', `start/dateTime ge '${startTime.toISOString()}' and end/dateTime le '${endTime.toISOString()}'`);
    graphUrl.searchParams.set('$select', 'id,subject,start,end,location,body,bodyPreview,isAllDay,categories,attendees');
    graphUrl.searchParams.set('$orderby', 'start/dateTime');

    const eventsResponse = await fetch(graphUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!eventsResponse.ok) {
      throw new Error('Failed to fetch calendar events');
    }

    const eventsData = await eventsResponse.json();
    
    // Transform and store events
    const transformedEvents = eventsData.value.map((event: any) => {
      // Transform attendees from Microsoft Graph format to our format
      const attendees = event.attendees?.map((attendee: any) => ({
        name: attendee.emailAddress?.name || 'Unknown',
        email: attendee.emailAddress?.address || '',
        avatar: null, // Microsoft Graph doesn't provide avatar URLs directly
      })) || [];

      return {
        user_id: user.id,
        microsoft_event_id: event.id,
        title: event.subject || 'Untitled Event',
        start_time: event.start.dateTime,
        end_time: event.end.dateTime,
        location: event.location?.displayName || null,
        category: event.categories?.[0] || 'personal',
        description: event.body?.content || event.bodyPreview || null,
        is_all_day: event.isAllDay || false,
        attendees: attendees,
      };
    });

    // Clear existing events for this user and insert new ones
    await supabaseClient
      .from('calendar_events')
      .delete()
      .eq('user_id', user.id);

    if (transformedEvents.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('calendar_events')
        .insert(transformedEvents);

      if (insertError) {
        throw new Error('Failed to store calendar events');
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      eventsCount: transformedEvents.length,
      lastSync: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error syncing calendar:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
