
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function GitHubTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Github className="h-5 w-5" />
          GitHub Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>
            Connect your GitHub account to sync your prompts to a GitHub repository.
            This feature will be available in the next version.
          </p>
        </div>
        
        <Button variant="outline">
          <Github className="mr-2 h-4 w-4" />
          Connect GitHub Account
        </Button>
      </CardContent>
    </Card>
  );
}
