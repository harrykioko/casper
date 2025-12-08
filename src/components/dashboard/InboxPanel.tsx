import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Inbox, ListTodo, Check, Archive, Mail, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ActionPanel,
  ActionPanelHeader,
  ActionPanelListArea,
  ActionPanelRow,
  ActionPanelFooter,
  CountBadge,
} from "@/components/ui/action-panel";
import { InboxItem, TaskPrefillOptions } from "@/types/inbox";
import { InboxDetailDrawer } from "./InboxDetailDrawer";
import { useInboxItems } from "@/hooks/useInboxItems";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface InboxPanelProps {
  onOpenTaskCreate: (options: TaskPrefillOptions) => void;
}

export function InboxPanel({ onOpenTaskCreate }: InboxPanelProps) {
  const navigate = useNavigate();
  const { inboxItems, isLoading, markAsRead, markComplete, archive } = useInboxItems();
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const openInboxDetail = (item: InboxItem) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
    // Mark as read when opening
    if (!item.isRead) {
      markAsRead(item.id);
    }
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setSelectedItem(null);
  };

  const handleMarkComplete = (id: string) => {
    markComplete(id);
  };

  const handleArchive = (id: string) => {
    archive(id);
  };

  const handleCreateTaskFromEmail = (item: InboxItem) => {
    onOpenTaskCreate({
      content: item.subject,
      description: item.preview || undefined,
      companyName: item.relatedCompanyName,
    });
    closeDetail();
  };

  const unreadCount = inboxItems.filter((item) => !item.isRead).length;

  return (
    <>
      <ActionPanel accentColor="sky" className="h-full">
        <ActionPanelHeader
          icon={<Inbox className="h-4 w-4" />}
          title="Inbox"
          subtitle={`${unreadCount} new messages`}
          badge={unreadCount > 0 ? <CountBadge count={unreadCount} label="unread" accentColor="sky" /> : undefined}
          accentColor="sky"
        />

        {isLoading ? (
          <ActionPanelListArea accentColor="sky" className="flex items-center justify-center">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Loader2 className="w-6 h-6 text-sky-500 animate-spin mb-2" />
              <p className="text-xs text-slate-400 dark:text-slate-500">Loading inbox...</p>
            </div>
          </ActionPanelListArea>
        ) : inboxItems.length === 0 ? (
          <ActionPanelListArea accentColor="sky" className="flex items-center justify-center">
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center mb-3">
                <Mail className="w-6 h-6 text-sky-500" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">Inbox zero!</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">No items to review.</p>
            </div>
          </ActionPanelListArea>
        ) : (
          <ActionPanelListArea accentColor="sky" className="overflow-y-auto max-h-[280px]">
            {inboxItems.slice(0, 4).map((item, index) => {
              const isLast = index === Math.min(inboxItems.length, 4) - 1;

              return (
                <ActionPanelRow
                  key={item.id}
                  onClick={() => openInboxDetail(item)}
                  isLast={isLast}
                >
                  {/* Left content */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-sky-600 dark:text-sky-300">
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
                              ? "font-semibold text-slate-700 dark:text-slate-200"
                              : "font-medium text-slate-600 dark:text-slate-300"
                          )}
                        >
                          {item.senderName}
                        </span>
                        {!item.isRead && (
                          <div className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-200 truncate">{item.subject}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{item.preview}</p>
                    </div>
                  </div>

                  {/* Right side */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Quick Actions (appear on hover) */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-500 hover:text-sky-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreateTaskFromEmail(item);
                        }}
                        title="Create task"
                      >
                        <ListTodo className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-500 hover:text-emerald-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkComplete(item.id);
                        }}
                        title="Mark complete"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchive(item.id);
                        }}
                        title="Archive"
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Timestamp (visible when not hovering) */}
                    <span className="text-[10px] text-slate-400 group-hover:hidden">
                      {formatDistanceToNow(new Date(item.receivedAt), { addSuffix: true })}
                    </span>
                  </div>
                </ActionPanelRow>
              );
            })}
          </ActionPanelListArea>
        )}

        {inboxItems.length > 0 && (
          <ActionPanelFooter>
            <button 
              onClick={() => navigate('/inbox')}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              View all messages
            </button>
            <button 
              onClick={() => navigate('/inbox')}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-slate-900/5 dark:bg-slate-50/5 text-slate-500 dark:text-slate-300 hover:bg-slate-900/10 dark:hover:bg-slate-50/10 transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Open Inbox
            </button>
          </ActionPanelFooter>
        )}
      </ActionPanel>

      {/* Detail Drawer */}
      <InboxDetailDrawer
        open={isDetailOpen}
        onClose={closeDetail}
        item={selectedItem}
        onCreateTask={handleCreateTaskFromEmail}
        onMarkComplete={handleMarkComplete}
        onArchive={handleArchive}
      />
    </>
  );
}
