
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useOutlookCalendar } from "@/hooks/useOutlookCalendar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, RefreshCw, Unlink, User, Mail, Clock } from "lucide-react";
import { format } from "date-fns";

export function CalendarTab() {
  const {
    connection,
    loading,
    syncing,
    connectOutlook,
    syncCalendar,
    disconnectOutlook,
    isConnected,
  } = useOutlookCalendar();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Outlook Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isConnected ? (
          <>
            <div className="flex items-center p-4 rounded-md bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400">
              <div className="ml-2 text-sm">
                Please connect your Outlook account to display calendar events.
              </div>
            </div>
            
            <Button 
              onClick={connectOutlook} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Connect Outlook
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center p-4 rounded-md bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400">
              <div className="ml-2 text-sm">
                Your Outlook calendar is connected and syncing.
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Connected Account</h4>
                <Badge variant="default" className="bg-green-500 text-white">Active</Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{connection.display_name || 'Microsoft User'}</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{connection.email}</span>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Connected {format(new Date(connection.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button 
                  onClick={syncCalendar} 
                  disabled={syncing}
                  variant="outline"
                  className="flex-1"
                >
                  {syncing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sync Now
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={disconnectOutlook} 
                  disabled={loading}
                  variant="destructive"
                  className="flex-1"
                >
                  <Unlink className="mr-2 h-4 w-4" />
                  Disconnect
                </Button>
              </div>
            </div>
          </>
        )}
        
        <div className="text-sm text-muted-foreground">
          <p>Calendar data will be synced every 15 minutes automatically.</p>
          <p className="mt-1">Only events from your primary calendar will be displayed.</p>
        </div>
      </CardContent>
    </Card>
  );
}
