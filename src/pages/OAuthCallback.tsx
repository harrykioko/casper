
import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useOutlookCalendar } from "@/hooks/useOutlookCalendar";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleOAuthCallback } = useOutlookCalendar();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const processedRef = useRef(false);

  useEffect(() => {
    console.log('OAuth callback page loaded');
    console.log('Current user:', user);
    console.log('Auth loading:', authLoading);
    console.log('Search params:', Object.fromEntries(searchParams.entries()));

    // Prevent multiple processing
    if (processedRef.current) {
      console.log('OAuth callback already processed, skipping');
      return;
    }

    // Wait for auth to load
    if (authLoading) {
      console.log('Waiting for auth to load...');
      return;
    }

    // If no user, redirect to auth
    if (!user) {
      console.log('No user found, redirecting to auth');
      navigate('/auth');
      return;
    }

    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('OAuth parameters:', { code: !!code, state, error });

    if (error) {
      console.error('OAuth error:', error);
      setStatus('error');
      setErrorMessage(`OAuth Error: ${error}`);
      return;
    }

    if (!code || !state) {
      console.error('Missing OAuth parameters');
      setStatus('error');
      setErrorMessage('Missing authorization code or state parameter');
      return;
    }

    // Mark as processed to prevent duplicate calls
    processedRef.current = true;

    // Handle the OAuth callback
    console.log('Processing OAuth callback...');
    handleOAuthCallback(code, state)
      .then(() => {
        console.log('OAuth callback successful');
        setStatus('success');
        
        // Clear the URL parameters to prevent reprocessing on refresh
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        
        // Redirect to settings after a short delay
        setTimeout(() => {
          navigate('/settings?tab=calendar');
        }, 2000);
      })
      .catch((error) => {
        console.error('OAuth callback failed:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Failed to complete OAuth flow');
        
        // Clear the URL parameters even on error
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      });
  }, [searchParams, handleOAuthCallback, navigate, user, authLoading]);

  const handleRetry = () => {
    // Reset the processed flag to allow retry
    processedRef.current = false;
    navigate('/settings?tab=calendar');
  };

  const handleGoToAuth = () => {
    navigate('/auth');
  };

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Card className="w-full max-w-md glassmorphic">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
            <h2 className="text-xl font-semibold mb-2">Loading...</h2>
            <p className="text-muted-foreground">Please wait while we verify your authentication.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show auth prompt if no user
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Card className="w-full max-w-md glassmorphic">
          <CardContent className="p-8 text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-muted-foreground mb-4">
              You need to be signed in to complete the Outlook connection.
            </p>
            <Button onClick={handleGoToAuth} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Card className="w-full max-w-md glassmorphic">
        <CardContent className="p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-500" />
              <h2 className="text-xl font-semibold mb-2">Connecting your Outlook account...</h2>
              <p className="text-muted-foreground">Please wait while we complete the setup.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h2 className="text-xl font-semibold mb-2">Successfully Connected!</h2>
              <p className="text-muted-foreground mb-4">
                Your Outlook calendar has been connected. Redirecting you back to settings...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h2 className="text-xl font-semibold mb-2">Connection Failed</h2>
              <p className="text-muted-foreground mb-4">{errorMessage}</p>
              <Button onClick={handleRetry} className="w-full">
                Return to Settings
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
