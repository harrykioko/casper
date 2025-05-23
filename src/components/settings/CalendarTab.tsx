
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function CalendarTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Outlook Calendar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center p-4 rounded-md bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400">
          <div className="ml-2 text-sm">
            Please connect your Outlook account to display calendar events.
          </div>
        </div>
        
        <Button>Connect Outlook</Button>
        
        <div className="text-sm text-muted-foreground">
          <p>Calendar data will be synced every 15 minutes.</p>
        </div>
      </CardContent>
    </Card>
  );
}
