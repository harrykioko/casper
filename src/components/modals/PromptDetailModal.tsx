
import { useState } from "react";
import { MessageSquareText, Copy, Edit, Save, X, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
}

interface PromptDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prompt: Prompt | null;
  onUpdatePrompt?: (prompt: Prompt) => void;
}

export function PromptDetailModal({ open, onOpenChange, prompt, onUpdatePrompt }: PromptDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState<Prompt | null>(null);
  const [newTag, setNewTag] = useState("");

  if (!prompt) return null;

  const currentPrompt = editedPrompt || prompt;

  const handleEdit = () => {
    setEditedPrompt({ ...prompt });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedPrompt(null);
    setNewTag("");
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!editedPrompt || !onUpdatePrompt) return;

    try {
      setIsLoading(true);
      
      onUpdatePrompt(editedPrompt);
      toast.success("Prompt updated successfully");
      setIsEditing(false);
      setEditedPrompt(null);
    } catch (error) {
      console.error("Error updating prompt:", error);
      toast.error("Failed to update prompt. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentPrompt.content);
      toast.success("Prompt copied to clipboard");
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy prompt");
    }
  };

  const addTag = () => {
    if (newTag.trim() && editedPrompt && !editedPrompt.tags.includes(newTag.trim())) {
      setEditedPrompt({
        ...editedPrompt,
        tags: [...editedPrompt.tags, newTag.trim()]
      });
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (editedPrompt) {
      setEditedPrompt({
        ...editedPrompt,
        tags: editedPrompt.tags.filter(tag => tag !== tagToRemove)
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-2xl bg-white/10 dark:bg-zinc-900/30 backdrop-blur-sm ring-1 ring-white/10 dark:ring-white/5 shadow-2xl transition-all max-h-[80vh] overflow-hidden">
        <DialogHeader className="border-b border-white/10 pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4" />
              {isEditing ? "Edit Prompt" : "Prompt Details"}
            </DialogTitle>
            <div className="flex gap-2">
              {!isEditing && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="text-white/60 hover:text-white"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    className="text-white/60 hover:text-white"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Title</label>
            {isEditing ? (
              <Input
                value={editedPrompt?.title || ""}
                onChange={(e) => setEditedPrompt(prev => prev ? { ...prev, title: e.target.value } : null)}
                className="bg-background/80 border border-muted/30 text-foreground placeholder:text-muted-foreground rounded-md focus:ring-2 focus:ring-cyan-500 transition"
                disabled={isLoading}
              />
            ) : (
              <h2 className="text-xl font-semibold text-white">{currentPrompt.title}</h2>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Description</label>
            {isEditing ? (
              <Textarea
                value={editedPrompt?.description || ""}
                onChange={(e) => setEditedPrompt(prev => prev ? { ...prev, description: e.target.value } : null)}
                className="bg-background/80 border border-muted/30 text-foreground placeholder:text-muted-foreground rounded-md focus:ring-2 focus:ring-cyan-500 transition min-h-[80px]"
                rows={3}
                disabled={isLoading}
              />
            ) : (
              <p className="text-white/70">{currentPrompt.description}</p>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Prompt Content</label>
            {isEditing ? (
              <Textarea
                value={editedPrompt?.content || ""}
                onChange={(e) => setEditedPrompt(prev => prev ? { ...prev, content: e.target.value } : null)}
                className="bg-background/80 border border-muted/30 text-foreground placeholder:text-muted-foreground rounded-md focus:ring-2 focus:ring-cyan-500 transition min-h-[200px]"
                rows={8}
                disabled={isLoading}
              />
            ) : (
              <div className="bg-black/20 rounded-md p-4 max-h-[300px] overflow-y-auto">
                <pre className="text-sm text-white/90 whitespace-pre-wrap font-mono">
                  {currentPrompt.content}
                </pre>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Tags</label>
            {isEditing ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="bg-background/80 border border-muted/30 text-foreground placeholder:text-muted-foreground rounded-md focus:ring-2 focus:ring-cyan-500 transition"
                    disabled={isLoading}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addTag}
                    disabled={!newTag.trim() || isLoading}
                  >
                    Add
                  </Button>
                </div>
                
                {editedPrompt && editedPrompt.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {editedPrompt.tags.map(tag => (
                      <Badge 
                        key={tag} 
                        variant="secondary" 
                        className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {currentPrompt.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="border-t border-white/10 pt-3">
          {isEditing ? (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition shadow"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleCopy}
              className="w-full py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition shadow"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Prompt
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
