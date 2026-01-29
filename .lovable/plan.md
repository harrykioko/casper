
# Unify Global Inbox Drawer Across All Access Points

## Current State Analysis

### Entry Points for Inbox Items
1. **Dashboard InboxPanel** - Uses `GlobalInboxDrawerOverlay` via context (partial handlers)
2. **Inbox page** - Uses 3-column layout with embedded `InboxDetailDrawer` on desktop, global drawer on mobile
3. **Pipeline Company Detail (CommsTab)** - Shows linked emails but they are NOT clickable/actionable

### Problems with Current Implementation
1. **Inbox page has dual implementations**: Embedded pane on desktop, global drawer on mobile
2. **Dashboard InboxPanel missing handlers**: No `onLinkCompany`, `onSaveAttachments`, `onApproveSuggestion`, `onSaveAttachmentToCompany`
3. **CommsTab emails not clickable**: Just displays emails statically, no way to open detail drawer
4. **Handler duplication**: Same handlers defined in multiple places (Inbox.tsx, InboxPanel.tsx)

## Solution Overview

Create a **single, unified global inbox drawer** that works consistently from all entry points:
- Dashboard
- Inbox page (convert from 3-column to 2-column + drawer)
- Pipeline company pages (CommsTab)
- Portfolio company pages (if applicable)

### Key Changes

1. **Create a shared handlers hook** - Centralize all inbox action handlers
2. **Convert Inbox page to 2-column** - Summary panel + list, use global drawer for detail
3. **Make CommsTab emails clickable** - Open global drawer on click
4. **Fix Dashboard InboxPanel** - Pass all required handlers

---

## File Changes

### 1. Create New Hook: `src/hooks/useInboxDrawerActions.ts`

A centralized hook that provides all inbox action handlers, reducing duplication and ensuring consistency.

```typescript
// Returns all handlers needed for the global inbox drawer
export function useInboxDrawerActions() {
  const { user } = useAuth();
  const { createTask } = useTasks();
  const { markComplete, archive, snooze, linkCompany } = useInboxItems();
  const { createCompany: createPipelineCompany } = usePipeline();
  
  // State for modals
  const [taskPrefill, setTaskPrefill] = useState<TaskPrefillOptions | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [linkCompanyItem, setLinkCompanyItem] = useState<InboxItem | null>(null);
  const [saveAttachmentsItem, setSaveAttachmentsItem] = useState<InboxItem | null>(null);

  // All handler implementations...
  const handleCreateTask = (item: InboxItem, suggestionTitle?: string) => {...};
  const handleMarkComplete = (id: string) => {...};
  const handleArchive = (id: string) => {...};
  const handleSnooze = (id: string, until: Date) => {...};
  const handleLinkCompany = (item: InboxItem) => {...};
  const handleSaveAttachments = (item: InboxItem) => {...};
  const handleApproveSuggestion = async (item: InboxItem, suggestion) => {...};
  const handleSaveAttachmentToCompany = async (item: InboxItem, attachment) => {...};

  // Return handlers + modal state + modal components
  return {
    handlers: {
      onCreateTask: handleCreateTask,
      onMarkComplete: handleMarkComplete,
      onArchive: handleArchive,
      onSnooze: handleSnooze,
      onLinkCompany: handleLinkCompany,
      onSaveAttachments: handleSaveAttachments,
      onApproveSuggestion: handleApproveSuggestion,
      onSaveAttachmentToCompany: handleSaveAttachmentToCompany,
    },
    modals: {
      taskPrefill,
      isTaskDialogOpen,
      setIsTaskDialogOpen,
      linkCompanyItem,
      setLinkCompanyItem,
      saveAttachmentsItem,
      setSaveAttachmentsItem,
    },
    createTask,
  };
}
```

### 2. Create New Component: `src/components/inbox/InboxModalsProvider.tsx`

A component that renders all the modals needed for inbox actions. Can be used at page level or app level.

```typescript
interface InboxModalsProviderProps {
  modals: ReturnType<typeof useInboxDrawerActions>['modals'];
  createTask: (data: TaskCreateData) => void;
  linkCompany: (id: string, companyId: string | null, companyName: string | null) => void;
}

export function InboxModalsProvider({ modals, createTask, linkCompany }: InboxModalsProviderProps) {
  // Renders AddTaskDialog, LinkCompanyModal, SaveAttachmentsModal
  return (
    <>
      <AddTaskDialog ... />
      {modals.linkCompanyItem && <LinkCompanyModal ... />}
      {modals.saveAttachmentsItem && <SaveAttachmentsModal ... />}
    </>
  );
}
```

### 3. Modify `src/pages/Inbox.tsx`

**Convert from 3-column to 2-column layout:**

Changes:
- Remove the `selectedItem` state and embedded `InboxDetailDrawer`
- Always use `openGlobalDrawer()` on item click (both desktop and mobile)
- Simplify grid to 2 columns: `grid-cols-[280px_1fr]`
- Use `useInboxDrawerActions` hook for handlers
- Add `InboxModalsProvider` for modals

```typescript
// Before
const gridClasses = cn(
  "grid gap-5",
  isDesktop && selectedItem
    ? "grid-cols-[280px_minmax(320px,1fr)_minmax(460px,1.4fr)]"
    : isDesktop
      ? "grid-cols-[280px_minmax(0,1fr)]"
      : "grid-cols-1"
);

// After - always 2 columns on desktop
const gridClasses = cn(
  "grid gap-5",
  isDesktop
    ? "grid-cols-[280px_minmax(0,1fr)] 2xl:grid-cols-[320px_1fr]"
    : "grid-cols-1"
);
```

Remove:
- `const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);`
- `const { attachments: selectedItemAttachments } = useInboxAttachments(selectedItem?.id);`
- The entire right column `{isDesktop && selectedItem && (...)}`
- The `closeDetail` function
- All inline handler definitions (moved to hook)

### 4. Modify `src/components/dashboard/InboxPanel.tsx`

Update to use the centralized handlers hook and pass all required handlers to the global drawer.

```typescript
export function InboxPanel({ onOpenTaskCreate }: InboxPanelProps) {
  const navigate = useNavigate();
  const { inboxItems, isLoading, markAsRead, markComplete, archive, snooze, linkCompany } = useInboxItems();
  const { createCompany: createPipelineCompany } = usePipeline();
  const { openDrawer } = useGlobalInboxDrawer();
  const { user } = useAuth();

  // State for modals
  const [linkCompanyItem, setLinkCompanyItem] = useState<InboxItem | null>(null);
  const [saveAttachmentsItem, setSaveAttachmentsItem] = useState<InboxItem | null>(null);

  const openInboxDetail = (item: InboxItem) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    openDrawer(item, {
      onCreateTask: handleCreateTaskFromEmail,
      onMarkComplete: handleMarkComplete,
      onArchive: handleArchive,
      onSnooze: handleSnooze,
      onAddNote: handleAddNote,
      onLinkCompany: handleLinkCompany,          // Add
      onSaveAttachments: handleSaveAttachments,   // Add
      onApproveSuggestion: handleApproveSuggestion, // Add
      onSaveAttachmentToCompany: handleSaveAttachmentToCompany, // Add
    });
  };

  // Add handler implementations...
  const handleLinkCompany = (item: InboxItem) => {
    setLinkCompanyItem(item);
  };

  const handleSaveAttachments = (item: InboxItem) => {
    setSaveAttachmentsItem(item);
  };

  const handleApproveSuggestion = async (item: InboxItem, suggestion: StructuredSuggestion) => {
    // Implementation similar to Inbox.tsx
  };

  const handleSaveAttachmentToCompany = async (item: InboxItem, attachment: InboxAttachment) => {
    // Implementation similar to Inbox.tsx
  };

  // Add modals at the end
  return (
    <>
      <ActionPanel ...>
        ...
      </ActionPanel>

      {linkCompanyItem && (
        <LinkCompanyModal ... />
      )}

      {saveAttachmentsItem && (
        <SaveAttachmentsModal ... />
      )}
    </>
  );
}
```

### 5. Create Helper Function: `src/lib/inbox/fetchInboxItemById.ts`

For opening emails from company pages where we only have partial data (from LinkedCommunication), we need to fetch the full InboxItem.

```typescript
import { supabase } from "@/integrations/supabase/client";
import type { InboxItem } from "@/types/inbox";

export async function fetchInboxItemById(emailId: string): Promise<InboxItem | null> {
  const { data, error } = await supabase
    .from("inbox_items")
    .select("*")
    .eq("id", emailId)
    .single();

  if (error || !data) return null;

  // Transform to InboxItem type
  return {
    id: data.id,
    subject: data.subject,
    senderName: data.from_name || data.from_email.split("@")[0],
    senderEmail: data.from_email,
    toEmail: data.to_email,
    preview: data.snippet,
    body: data.text_body,
    htmlBody: data.html_body,
    receivedAt: data.received_at,
    isRead: data.is_read,
    isResolved: data.is_resolved,
    isDeleted: data.is_deleted,
    snoozedUntil: data.snoozed_until,
    relatedCompanyId: data.related_company_id || undefined,
    relatedCompanyName: data.related_company_name || undefined,
    createdBy: data.created_by,
    isTopPriority: data.is_top_priority || false,
    cleanedText: data.cleaned_text,
    displaySnippet: data.display_snippet,
    displaySubject: data.display_subject,
    displayFromEmail: data.display_from_email,
    displayFromName: data.display_from_name,
    isForwarded: data.is_forwarded || false,
    hasThread: data.has_thread || false,
    hasDisclaimer: data.has_disclaimer || false,
    hasCalendar: data.has_calendar || false,
  };
}
```

### 6. Modify `src/components/pipeline-detail/tabs/CommsTab.tsx`

Make email rows clickable to open the global inbox drawer:

```typescript
import { useGlobalInboxDrawer } from "@/contexts/GlobalInboxDrawerContext";
import { useInboxItems } from "@/hooks/useInboxItems";
import { usePipeline } from "@/hooks/usePipeline";
import { useAuth } from "@/contexts/AuthContext";
import { fetchInboxItemById } from "@/lib/inbox/fetchInboxItemById";
import { toast } from "sonner";
// ... other imports

export function CommsTab({ company }: CommsTabProps) {
  const { linkedCommunications, loading } = useCompanyLinkedCommunications(company.primary_domain, company.id);
  const { openDrawer } = useGlobalInboxDrawer();
  const { markAsRead, markComplete, archive, snooze, linkCompany } = useInboxItems();
  const { createCompany: createPipelineCompany } = usePipeline();
  const { user } = useAuth();

  // Modal state
  const [linkCompanyItem, setLinkCompanyItem] = useState<InboxItem | null>(null);
  const [saveAttachmentsItem, setSaveAttachmentsItem] = useState<InboxItem | null>(null);
  const [taskPrefill, setTaskPrefill] = useState<TaskPrefillOptions | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  const handleEmailClick = async (email: LinkedCommunication) => {
    // Fetch full inbox item data
    const fullItem = await fetchInboxItemById(email.emailData!.id);
    if (!fullItem) {
      toast.error("Could not load email details");
      return;
    }

    if (!fullItem.isRead) {
      markAsRead(fullItem.id);
    }

    openDrawer(fullItem, {
      onCreateTask: handleCreateTask,
      onMarkComplete: handleMarkComplete,
      onArchive: handleArchive,
      onSnooze: handleSnooze,
      onLinkCompany: handleLinkCompany,
      onSaveAttachments: handleSaveAttachments,
      onApproveSuggestion: handleApproveSuggestion,
      onSaveAttachmentToCompany: handleSaveAttachmentToCompany,
    });
  };

  // Handler implementations...

  return (
    <div className="space-y-6">
      {/* Events section unchanged */}

      {emails.length > 0 && (
        <GlassPanel>
          <GlassPanelHeader title={`Emails (${emails.length})`} />
          <div className="p-4 space-y-2">
            {emails.map((email) => (
              <GlassSubcard 
                key={email.id} 
                className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleEmailClick(email)}
              >
                <Mail className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-clamp-1">{email.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{email.subtitle}</p>
                </div>
              </GlassSubcard>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Modals */}
      <AddTaskDialog ... />
      {linkCompanyItem && <LinkCompanyModal ... />}
      {saveAttachmentsItem && <SaveAttachmentsModal ... />}
    </div>
  );
}
```

### 7. Update `src/hooks/useInboxItems.ts`

Add cache invalidation for company communications when linking:

```typescript
const linkCompanyMutation = useMutation({
  // ... existing mutationFn
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["inbox_items"] });
    queryClient.invalidateQueries({ queryKey: ["inbox_items_archived"] });
    queryClient.invalidateQueries({ queryKey: ["company_linked_communications"] }); // Add this
    toast.success("Company linked");
  },
  // ...
});
```

---

## Files Changed Summary

| File | Change Type | Description |
|------|------------|-------------|
| `src/lib/inbox/fetchInboxItemById.ts` | New | Helper to fetch full InboxItem by ID |
| `src/pages/Inbox.tsx` | Major refactor | Remove 3rd column, always use global drawer |
| `src/components/dashboard/InboxPanel.tsx` | Add handlers | Add missing handlers + modals |
| `src/components/pipeline-detail/tabs/CommsTab.tsx` | Add click | Make emails clickable, open drawer |
| `src/hooks/useInboxItems.ts` | Cache invalidation | Invalidate communications on link |

---

## Data Flow After Changes

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         ACCESS POINTS                                │
├─────────────────┬───────────────────┬───────────────────────────────┤
│   Dashboard     │    Inbox Page     │    Pipeline Company           │
│   InboxPanel    │    (2-column)     │    CommsTab                   │
└────────┬────────┴─────────┬─────────┴───────────────┬───────────────┘
         │                  │                         │
         │  openDrawer()    │  openDrawer()          │  fetchInboxItemById()
         │  + handlers      │  + handlers            │  + openDrawer()
         │                  │                         │  + handlers
         └──────────────────┼─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │   GlobalInboxDrawerContext   │
              │   (single source of truth)   │
              └──────────────┬──────────────┘
                             │
                             ▼
              ┌─────────────────────────────┐
              │  GlobalInboxDrawerOverlay    │
              │  - Resizable (600-1200px)   │
              │  - Width persisted          │
              │  - Spring animation         │
              │  - InboxDetailWorkspace     │
              └─────────────────────────────┘
```

---

## Expected Result

After implementation:

1. **Inbox page** - 2-column layout (summary + list), clicking any email opens the global sliding drawer
2. **Dashboard InboxPanel** - Full functionality: Link Company, Save Attachments, AI Suggestions all work
3. **Pipeline CommsTab** - Clicking an email opens the same global drawer with all actions available
4. **Consistent experience** - Same drawer, same resize behavior, same actions everywhere
5. **Width persistence** - User's preferred drawer width saved across all entry points

---

## Technical Notes

### Why Fetch Full Item from Company Pages

The `LinkedCommunication` type from `useCompanyLinkedCommunications` only contains:
- `id`, `title`, `subtitle`, `timestamp`
- Partial `emailData`: `id`, `subject`, `from_email`, `from_name`, `received_at`

But `InboxItem` requires many more fields for the detail view to work:
- `body`, `htmlBody` for content display
- `cleanedText`, processing signals for server-cleaned content
- `relatedCompanyId`, `relatedCompanyName` for actions
- etc.

Therefore we need to fetch the complete item before opening the drawer.

### Handler Consistency

All entry points must provide the same handler interface to `openDrawer()`:
```typescript
{
  onCreateTask,
  onMarkComplete,
  onArchive,
  onSnooze,
  onAddNote,
  onLinkCompany,
  onSaveAttachments,
  onApproveSuggestion,
  onSaveAttachmentToCompany,
}
```

Each page needs to handle modal state locally (for task creation, link company, save attachments) since those modals need access to the task creation function and company linking function from that page's context.
