
import { CardTitle, Card, CardHeader, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProjectContextProps {
  context: string;
}

export function ProjectContext({ context }: ProjectContextProps) {
  const { toast } = useToast();
  
  const copyContextToClipboard = () => {
    navigator.clipboard.writeText(context);
    toast({
      title: "Copied to clipboard",
      description: "Project context has been copied."
    });
  };
  
  return (
    <Card className="mb-6 glassmorphic relative group">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Project Context</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 transition active:scale-95"
              onClick={copyContextToClipboard}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={context}
          readOnly
          className="resize-none bg-transparent border-none focus-visible:ring-0 h-32"
        />
      </CardContent>
    </Card>
  );
}
