import { formatDistanceToNow } from "date-fns";
import { ListTodo, Check, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InboxItem } from "@/types/inbox";

interface InboxItemRowProps {
  item: InboxItem;
  onClick: () => void;
  onCreateTask: () => void;
  onMarkComplete: () => void;
  onArchive: () => void;
}

export function InboxItemRow({
  item,
  onClick,
  onCreateTask,
  onMarkComplete,
  onArchive,
}: InboxItemRowProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all",
        "bg-card hover:bg-accent/50 border border-border hover:border-sky-200 dark:hover:border-sky-800",
        !item.isRead && "bg-sky-50/50 dark:bg-sky-950/20"
      )}
    >
      {/* Avatar */}
      <div className="w-11 h-11 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
        <span className="text-base font-semibold text-sky-600 dark:text-sky-400">
          {item.senderName.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={cn(
              "text-sm truncate",
              !item.isRead
                ? "font-semibold text-foreground"
                : "font-medium text-muted-foreground"
            )}
          >
            {item.senderName}
          </span>
          {!item.isRead && (
            <div className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
          )}
          <span className="text-xs text-muted-foreground ml-auto flex-shrink-0 group-hover:hidden">
            {formatDistanceToNow(new Date(item.receivedAt), { addSuffix: true })}
          </span>
        </div>
        <p className={cn(
          "text-sm truncate",
          !item.isRead ? "text-foreground" : "text-muted-foreground"
        )}>
          {item.subject}
        </p>
        {item.preview && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {item.preview}
          </p>
        )}
      </div>

      {/* Quick Actions (appear on hover) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-sky-600 hover:bg-sky-100 dark:hover:bg-sky-900/30"
          onClick={(e) => {
            e.stopPropagation();
            onCreateTask();
          }}
          title="Create task"
        >
          <ListTodo className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
          onClick={(e) => {
            e.stopPropagation();
            onMarkComplete();
          }}
          title="Mark complete"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-accent"
          onClick={(e) => {
            e.stopPropagation();
            onArchive();
          }}
          title="Archive"
        >
          <Archive className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
