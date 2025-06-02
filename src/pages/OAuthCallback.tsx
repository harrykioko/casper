
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useOutlookCalendar } from "@/hooks/useOutlookCalendar";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleOAuthCallback } = useOutlookCalendar();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMessage(`OAuth Error: ${error}`);
      return;
    }

    if (!code || !state) {
      setStatus('error');
      setErrorMessage('Missing authorization code or state parameter');
      return;
    }

    // Handle the OAuth callback
    handleOAuthCallback(code, state)
      .then(() => {
        setStatus('success');
        // Redirect to settings after a short delay
        setTimeout(() => {
          navigate('/settings?tab=calendar');
        }, 2000);
      })
      .catch((error) => {
        setStatus('error');
        setErrorMessage(error.message || 'Failed to complete OAuth flow');
      });
  }, [searchParams, handleOAuthCallback, navigate]);

  const handleRetry = () => {
    navigate('/settings?tab=calendar');
  };

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
