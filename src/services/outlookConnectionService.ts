
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { OutlookConnection } from '@/types/outlook';

export async function fetchConnection(userId: string): Promise<OutlookConnection | null> {
  try {
    const { data, error } = await supabase
      .from('outlook_connections')
      .select('id, email, display_name, is_active, token_expires_at, created_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching connection:', error);
    return null;
  }
}

export async function connectToOutlook(userId: string): Promise<void> {
  console.log('Starting Outlook connection process...');
  
  try {
    // Get the JWT token for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }

    console.log('Making request to Microsoft auth endpoint...');
    
    // Make a direct GET request to the edge function
    const response = await fetch(`https://onzzazxyfjdgvxhoxstr.supabase.co/functions/v1/microsoft-auth`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      let errorMessage = 'Failed to get authorization URL';
      try {
        const errorData = await response.json();
        console.error('Auth endpoint error:', errorData);
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        const errorText = await response.text();
        console.error('Raw error response:', errorText);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('Auth URL received:', !!data.authUrl);

    if (data.authUrl) {
      console.log('Redirecting to Microsoft OAuth...');
      // Redirect to Microsoft OAuth
      window.location.href = data.authUrl;
    } else {
      throw new Error('No authorization URL received');
    }
  } catch (error) {
    console.error('Error connecting to Outlook:', error);
    toast.error(`Failed to connect to Outlook: ${error.message}`);
    throw error;
  }
}

export async function handleOAuthCallback(userId: string, code: string, state: string): Promise<void> {
  console.log('Handling OAuth callback with code and state');
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch('https://onzzazxyfjdgvxhoxstr.supabase.co/functions/v1/microsoft-auth', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code, state, action: 'callback' }),
    });

    console.log('Callback response status:', response.status);

    if (!response.ok) {
      let errorMessage = 'Failed to complete Outlook connection';
      try {
        const errorData = await response.json();
        console.error('Callback error:', errorData);
        errorMessage = errorData.error || errorMessage;
        
        // Handle specific error messages
        if (errorMessage.includes('already been used') || errorMessage.includes('already redeemed')) {
          throw new Error('This authorization has already been processed. Please try connecting again.');
        } else if (errorMessage.includes('Invalid state')) {
          throw new Error('The connection session has expired. Please try connecting again.');
        } else if (errorMessage.includes('Database operation failed') || errorMessage.includes('Failed to store connection')) {
          throw new Error('Database error occurred. Please try again in a moment.');
        }
      } catch (parseError) {
        console.error('Failed to parse error response:', parseError);
        const errorText = await response.text();
        console.error('Raw error response:', errorText);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log('OAuth callback successful:', data);
    toast.success('Successfully connected to Outlook!');
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    throw new Error(error.message || 'Failed to complete Outlook connection');
  }
}

export async function disconnectFromOutlook(userId: string, connectionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('outlook_connections')
      .update({ is_active: false })
      .eq('id', connectionId);

    if (error) {
      throw error;
    }

    // Clear local events
    await supabase
      .from('calendar_events')
      .delete()
      .eq('user_id', userId);

    toast.success('Disconnected from Outlook');
  } catch (error) {
    console.error('Error disconnecting:', error);
    toast.error('Failed to disconnect from Outlook');
    throw error;
  }
}
