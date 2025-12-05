import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Inbox, ListTodo, Check, Archive, Mail } from "lucide-react";
import { GlassPanel, GlassPanelHeader, GlassSubcard } from "@/components/ui/glass-panel";
import { Button } from "@/components/ui/button";
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
      <GlassPanel className="h-full">
        <GlassPanelHeader
          title="Inbox"
          action={
            unreadCount > 0 ? (
              <div className="h-6 min-w-6 px-2 rounded-full bg-primary flex items-center justify-center">
                <span className="text-xs font-medium text-primary-foreground">{unreadCount}</span>
              </div>
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Inbox className="h-4 w-4 text-primary" />
              </div>
            )
          }
        />

        {inboxItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
              <Mail className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Inbox zero!</p>
            <p className="text-xs text-muted-foreground/70 mt-1">No items to review.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {inboxItems.slice(0, 4).map((item) => (
              <GlassSubcard
                key={item.id}
                onClick={() => openInboxDetail(item)}
                className="group"
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-medium text-primary">
                      {item.senderName.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={cn(
                          "text-sm truncate",
                          !item.isRead ? "font-semibold text-foreground" : "font-medium text-foreground/80"
                        )}
                      >
                        {item.senderName}
                      </span>
                      {!item.isRead && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-foreground truncate">{item.subject}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.preview}</p>
                  </div>

                  {/* Quick Actions (appear on hover) */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
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
                      className="h-7 w-7"
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
                      className="h-7 w-7"
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
                  <span className="text-xs text-muted-foreground/70 flex-shrink-0 group-hover:hidden">
                    {formatDistanceToNow(new Date(item.receivedAt), { addSuffix: true })}
                  </span>
                </div>
              </GlassSubcard>
            ))}
          </div>
        )}

        {/* Footer */}
        {inboxItems.length > 0 && (
          <div className="mt-4 pt-3 border-t border-white/10 dark:border-white/5">
            <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
              View all messages
            </button>
          </div>
        )}
      </GlassPanel>

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
