
import { useState } from "react";
import { CardTitle, Card, CardHeader, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface ProjectContextProps {
  context: string;
  onUpdateContext?: (newContext: string) => void;
}

export function ProjectContext({ context, onUpdateContext }: ProjectContextProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContext, setEditedContext] = useState(context);
  
  const copyContextToClipboard = () => {
    navigator.clipboard.writeText(context);
    toast({
      title: "Copied to clipboard",
      description: "Project context has been copied."
    });
  };
  
  const handleSave = () => {
    if (onUpdateContext) {
      onUpdateContext(editedContext);
    }
    setIsEditing(false);
    toast({
      title: "Context updated",
      description: "Project context has been updated."
    });
  };
  
  const handleCancel = () => {
    setEditedContext(context);
    setIsEditing(false);
  };
  
  return (
    <>
      <Card className="mb-6 glassmorphic relative group">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Project Context</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 transition active:scale-95 opacity-0 group-hover:opacity-100"
                onClick={() => {
                  setEditedContext(context);
                  setIsEditing(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
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
      
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-md rounded-2xl bg-white/10 dark:bg-zinc-900/30 backdrop-blur-sm ring-1 ring-white/10 dark:ring-white/5 shadow-2xl transition-all">
          <DialogHeader>
            <DialogTitle>Edit Project Context</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editedContext}
            onChange={(e) => setEditedContext(e.target.value)}
            placeholder="Describe the context of your project..."
            className="bg-background/80 border border-muted/30 text-foreground placeholder:text-muted-foreground rounded-md focus:ring-2 focus:ring-cyan-500 transition min-h-[150px]"
            rows={5}
            autoFocus
          />
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="w-full py-2 rounded-md bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-medium transition shadow"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
