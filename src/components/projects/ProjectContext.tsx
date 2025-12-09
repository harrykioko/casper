import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Copy, Pencil, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ProjectContextProps {
  context: string;
  onUpdateContext?: (newContext: string) => void;
}

export function ProjectContext({ context, onUpdateContext }: ProjectContextProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContext, setEditedContext] = useState(context);
  const [isFocused, setIsFocused] = useState(false);
  
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

  const isEmpty = !context || context.trim() === '';
  
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={cn(
          "relative rounded-2xl overflow-hidden mb-6 group",
          "bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-pink-50/30",
          "dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-pink-950/10",
          "backdrop-blur-xl",
          "border border-white/40 dark:border-white/[0.08]",
          "shadow-[0_8px_32px_rgba(99,102,241,0.08)] dark:shadow-[0_8px_36px_rgba(99,102,241,0.15)]",
          "hover:shadow-[0_12px_40px_rgba(99,102,241,0.12)] dark:hover:shadow-[0_12px_44px_rgba(99,102,241,0.2)]",
          "transition-all duration-300"
        )}
      >
        {/* Subtle accent gradient at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500/50 via-purple-500/40 to-pink-500/30" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/20 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center",
              "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
            )}>
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="font-semibold text-sm tracking-tight text-foreground">
              Project Context
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-8 w-8 rounded-lg transition-all duration-200",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-white/40 dark:hover:bg-white/10",
                "opacity-0 group-hover:opacity-100"
              )}
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
              className={cn(
                "h-8 w-8 rounded-lg transition-all duration-200",
                "text-muted-foreground hover:text-foreground",
                "hover:bg-white/40 dark:hover:bg-white/10"
              )}
              onClick={copyContextToClipboard}
              disabled={isEmpty}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {isEmpty ? (
            <div 
              className={cn(
                "text-sm text-muted-foreground/70 italic cursor-pointer",
                "hover:text-muted-foreground transition-colors"
              )}
              onClick={() => {
                setEditedContext('');
                setIsEditing(true);
              }}
            >
              Outline the purpose, scope, and key questions driving this project…
            </div>
          ) : (
            <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {context}
            </div>
          )}
        </div>
      </motion.div>
      
      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className={cn(
          "max-w-lg rounded-2xl",
          "bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl",
          "border border-white/30 dark:border-white/10",
          "shadow-2xl"
        )}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-500" />
              Edit Project Context
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={editedContext}
            onChange={(e) => setEditedContext(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Outline the purpose, scope, and key questions driving this project…"
            className={cn(
              "min-h-[180px] text-sm resize-none",
              "bg-white/50 dark:bg-white/[0.04]",
              "border border-white/30 dark:border-white/10",
              "focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40",
              "transition-all duration-200",
              isFocused && "shadow-[0_0_20px_rgba(99,102,241,0.15)]"
            )}
            rows={6}
            autoFocus
          />
          <DialogFooter className="mt-4 gap-2">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className={cn(
                "bg-indigo-500 hover:bg-indigo-600 text-white",
                "shadow-lg shadow-indigo-500/20"
              )}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
