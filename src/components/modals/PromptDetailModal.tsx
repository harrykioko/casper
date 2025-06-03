
import { useState } from "react";
import { MessageSquareText, Copy, Edit, Save, X, Loader2 } from "lucide-react";
import { GlassModal, GlassModalContent, GlassModalHeader, GlassModalTitle, GlassModalFooter } from "@/components/ui/GlassModal";
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
    <GlassModal open={open} onOpenChange={onOpenChange}>
      <GlassModalContent className="max-w-2xl max-h-[80vh]">
        <GlassModalHeader className="border-b border-muted/20 pb-3">
          <div className="flex items-center justify-between">
            <GlassModalTitle className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4" />
              {isEditing ? "Edit Prompt" : "Prompt Details"}
            </GlassModalTitle>
            <div className="flex gap-2">
              {!isEditing && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEdit}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </GlassModalHeader>

        <div className="space-y-4 flex-1 min-h-0">
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Title</label>
            {isEditing ? (
              <Input
                value={editedPrompt?.title || ""}
                onChange={(e) => setEditedPrompt(prev => prev ? { ...prev, title: e.target.value } : null)}
                className="bg-background/80 border border-muted/30 text-foreground placeholder:text-muted-foreground rounded-md focus:ring-2 focus:ring-ring transition"
                disabled={isLoading}
              />
            ) : (
              <h2 className="text-xl font-semibold">{currentPrompt.title}</h2>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            {isEditing ? (
              <Textarea
                value={editedPrompt?.description || ""}
                onChange={(e) => setEditedPrompt(prev => prev ? { ...prev, description: e.target.value } : null)}
                className="bg-background/80 border border-muted/30 text-foreground placeholder:text-muted-foreground rounded-md focus:ring-2 focus:ring-ring transition min-h-[80px]"
                rows={3}
                disabled={isLoading}
              />
            ) : (
              <p className="text-muted-foreground">{currentPrompt.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Prompt Content</label>
            {isEditing ? (
              <Textarea
                value={editedPrompt?.content || ""}
                onChange={(e) => setEditedPrompt(prev => prev ? { ...prev, content: e.target.value } : null)}
                className="bg-background/80 border border-muted/30 text-foreground placeholder:text-muted-foreground rounded-md focus:ring-2 focus:ring-ring transition min-h-[200px]"
                rows={8}
                disabled={isLoading}
              />
            ) : (
              <div className="bg-muted/20 rounded-md p-4 max-h-[300px] overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap font-mono">
                  {currentPrompt.content}
                </pre>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Tags</label>
            {isEditing ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="bg-background/80 border border-muted/30 text-foreground placeholder:text-muted-foreground rounded-md focus:ring-2 focus:ring-ring transition"
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

        <GlassModalFooter className="border-t border-muted/20 pt-3">
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
                className="flex-1 py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition shadow"
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
              className="w-full py-2 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition shadow"
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy Prompt
            </Button>
          )}
        </GlassModalFooter>
      </GlassModalContent>
    </GlassModal>
  );
}
