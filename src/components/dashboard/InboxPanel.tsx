import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Inbox, ListTodo, Check, Archive, Mail, ExternalLink } from "lucide-react";
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
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Mock data for inbox items
const mockInboxItems: InboxItem[] = [
  {
    id: "1",
    senderName: "Sarah Chen",
    senderEmail: "sarah@techstartup.io",
    subject: "Q4 Metrics Update",
    preview: "Hi! Wanted to share our latest metrics for the quarter...",
    body: "Hi!\n\nWanted to share our latest metrics for Q4. We hit $500k MRR this month, up 23% from last quarter. Customer acquisition cost is down to $120, and churn is holding steady at 2.1%.\n\nWould love to schedule a call to walk through the numbers in detail and discuss our Series A timeline.\n\nBest,\nSarah",
    receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    isRead: false,
    relatedCompanyName: "TechStartup",
  },
  {
    id: "2",
    senderName: "Marcus Johnson",
    senderEmail: "marcus@financeapp.com",
    subject: "Intro: Potential Series B candidate",
    preview: "Hey, I wanted to make an introduction to a company I think...",
    body: "Hey,\n\nI wanted to make an introduction to a company I think would be a great fit for your portfolio. FinanceApp has been growing rapidly in the SMB space and is looking to raise their Series B.\n\nThey're doing $2M ARR with 150% NRR. Happy to make the intro if you're interested.\n\nCheers,\nMarcus",
    receivedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    isRead: false,
  },
  {
    id: "3",
    senderName: "Emily Watson",
    senderEmail: "emily@acmecorp.com",
    subject: "Follow up on our meeting",
    preview: "Thank you for taking the time to meet with us yesterday...",
    body: "Thank you for taking the time to meet with us yesterday. I've attached the updated deck with the financial projections we discussed.\n\nPlease let me know if you have any questions or if there's additional information you'd like to see.\n\nBest regards,\nEmily",
    receivedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    relatedCompanyName: "Acme Corp",
  },
];

interface InboxPanelProps {
  onOpenTaskCreate: (options: TaskPrefillOptions) => void;
}

export function InboxPanel({ onOpenTaskCreate }: InboxPanelProps) {
  const [inboxItems, setInboxItems] = useState<InboxItem[]>(mockInboxItems);
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const openInboxDetail = (item: InboxItem) => {
    setSelectedItem(item);
    setIsDetailOpen(true);
    // Mark as read when opening
    if (!item.isRead) {
      setInboxItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isRead: true } : i))
      );
    }
  };

  const closeDetail = () => {
    setIsDetailOpen(false);
    setSelectedItem(null);
  };

  const handleMarkComplete = (id: string) => {
    // TODO: Wire to backend when inbox API is available
    setInboxItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Marked as complete");
  };

  const handleArchive = (id: string) => {
    // TODO: Wire to backend archive endpoint
    setInboxItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Archived");
  };

  const handleCreateTaskFromEmail = (item: InboxItem) => {
    onOpenTaskCreate({
      content: item.subject,
      description: item.preview,
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

        {inboxItems.length === 0 ? (
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
            <button className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
              View all messages
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 bg-slate-900/5 dark:bg-slate-50/5 text-slate-500 dark:text-slate-300 hover:bg-slate-900/10 dark:hover:bg-slate-50/10 transition-colors">
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
