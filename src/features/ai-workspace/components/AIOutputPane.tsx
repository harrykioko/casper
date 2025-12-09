/**
 * AI Workspace Output Pane - v1 Scaffolding
 * Right column showing AI-generated drafts and outputs.
 */

import { FileText, Pencil, Send, ListTodo, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AIDraft } from "../types";

interface AIOutputPaneProps {
  drafts: AIDraft[];
  onEditDraft?: (id: string) => void;
  onSendDraft?: (id: string) => void;
  onCreateTaskFromDraft?: (id: string) => void;
}

function DraftCard({ 
  draft, 
  onEdit, 
  onSend, 
  onCreateTask 
}: { 
  draft: AIDraft;
  onEdit: () => void;
  onSend: () => void;
  onCreateTask: () => void;
}) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(draft.body);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className={cn(
      "rounded-xl p-4 transition-all",
      "bg-white/50 dark:bg-white/[0.04]",
      "border border-white/30 dark:border-white/[0.06]",
      "hover:bg-white/70 dark:hover:bg-white/[0.08]"
    )}>
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
          <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-foreground">{draft.title}</h4>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-3 leading-relaxed">
            {draft.preview}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-white/10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-3 w-3 mr-1" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSend}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Send className="h-3 w-3 mr-1" />
          Send
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCreateTask}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <ListTodo className="h-3 w-3 mr-1" />
          Task
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground ml-auto"
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export function AIOutputPane({ 
  drafts, 
  onEditDraft, 
  onSendDraft, 
  onCreateTaskFromDraft 
}: AIOutputPaneProps) {
  const handleEdit = (id: string) => {
    onEditDraft?.(id);
    toast.info("Edit draft (coming soon)");
  };

  const handleSend = (id: string) => {
    onSendDraft?.(id);
    toast.info("Send draft (coming soon)");
  };

  const handleCreateTask = (id: string) => {
    onCreateTaskFromDraft?.(id);
    toast.info("Create task from draft (coming soon)");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10">
        <h3 className="text-sm font-semibold text-foreground">Drafts</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {drafts.length} draft{drafts.length !== 1 ? "s" : ""} ready
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {drafts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center mb-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              No drafts yet. Ask the AI to draft something.
            </p>
          </div>
        ) : (
          drafts.map(draft => (
            <DraftCard
              key={draft.id}
              draft={draft}
              onEdit={() => handleEdit(draft.id)}
              onSend={() => handleSend(draft.id)}
              onCreateTask={() => handleCreateTask(draft.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
