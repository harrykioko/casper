

# Save/Link Attachments to Company - Implementation Plan

## Problem Statement

Currently, when users want to save an attachment from an inbox item to a company, they must first create a task. However, there are scenarios where users want to directly associate an attachment with a company (e.g., saving a pitch deck, memo, or screenshot) without creating a task first.

The infrastructure already exists:
- `pipeline_attachments` table for pipeline company files
- `pipeline-attachments` storage bucket  
- `usePipelineAttachments` hook with `uploadAttachment` function
- "Link Company" button in InboxActionRail (currently disabled)

## Solution Architecture

Enable users to:
1. Link an inbox item to a company (pipeline or portfolio)
2. Save specific attachments from an inbox item directly to a company's files

```text
┌─────────────────────────────────────────────────────────────────────┐
│                        Inbox Action Rail                             │
│  ─────────────────────────────────────────────────────────────────   │
│                                                                       │
│  [Create Task]  ← existing (includes attachments via source link)    │
│  [Add Note]     ← existing                                           │
│  [Link Company] ← NEW: Opens company picker modal                    │
│  [Save Files]   ← NEW: Opens attachment picker to save to company    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────────┐
              │   LinkCompanyModal / SaveFilesModal│
              │   ─────────────────────────────────│
              │   • Search/select pipeline company │
              │   • Search/select portfolio company│
              │   • (Optional) Select attachments  │
              │   • Confirm action                 │
              └───────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  inbox_items    │  │pipeline_attachs │  │  (Future)       │
│  ───────────    │  │  ──────────────  │  │ company_attachs │
│  related_company│  │  Copy from inbox│  │  for portfolio  │
│  _id update     │  │  to pipeline    │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Implementation Phases

### Phase 1: Link Company to Inbox Item

Enable the "Link Company" action to associate an inbox item with a pipeline or portfolio company.

**New Component: `src/components/inbox/LinkCompanyModal.tsx`**

A modal that:
- Shows a combined searchable list of pipeline and portfolio companies
- Allows selecting one company to link
- Updates the inbox item's `related_company_id` and `related_company_name`

```typescript
interface LinkCompanyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inboxItem: InboxItem;
  onLinked: (companyId: string, companyName: string, companyType: 'pipeline' | 'portfolio') => void;
}
```

**Update: `src/hooks/useInboxItems.ts`**

Add mutation for linking company:

```typescript
const linkCompanyMutation = useMutation({
  mutationFn: async ({ 
    id, 
    companyId, 
    companyName 
  }: { 
    id: string; 
    companyId: string; 
    companyName: string;
  }) => {
    const { error } = await supabase
      .from("inbox_items")
      .update({ 
        related_company_id: companyId,
        related_company_name: companyName 
      })
      .eq("id", id);
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["inbox_items"] });
    toast.success("Company linked");
  },
});
```

### Phase 2: Save Attachments to Company

Enable saving inbox attachments directly to a company's files (pipeline first, portfolio later).

**New Component: `src/components/inbox/SaveAttachmentsModal.tsx`**

A two-step modal:
1. Step 1: Select which attachments to save (with checkboxes)
2. Step 2: Select destination company (or use already-linked company)

```typescript
interface SaveAttachmentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inboxItemId: string;
  linkedCompanyId?: string;
  linkedCompanyName?: string;
  linkedCompanyType?: 'pipeline' | 'portfolio';
}
```

**New Helper: `src/lib/inbox/copyAttachmentToCompany.ts`**

Function to copy an inbox attachment to a pipeline company:

```typescript
async function copyInboxAttachmentToPipeline(
  inboxAttachment: InboxAttachment,
  pipelineCompanyId: string,
  userId: string
): Promise<PipelineAttachment | null> {
  // 1. Get signed URL for source file
  const sourceUrl = await getSignedUrl('inbox-attachments', inboxAttachment.storagePath);
  
  // 2. Download the file content
  const response = await fetch(sourceUrl);
  const blob = await response.blob();
  
  // 3. Upload to pipeline-attachments bucket
  const newPath = `${pipelineCompanyId}/${crypto.randomUUID()}.${ext}`;
  await supabase.storage.from('pipeline-attachments').upload(newPath, blob);
  
  // 4. Create pipeline_attachments record
  const { data } = await supabase.from('pipeline_attachments').insert({
    pipeline_company_id: pipelineCompanyId,
    created_by: userId,
    file_name: inboxAttachment.filename,
    storage_path: newPath,
    file_type: inboxAttachment.mimeType,
    file_size: inboxAttachment.sizeBytes,
  }).select().single();
  
  return data;
}
```

### Phase 3: Wire Up InboxActionRail

**Update: `src/components/inbox/InboxActionRail.tsx`**

- Enable the "Link Company" button
- Add "Save Attachments" button (shown when attachments exist)
- Add appropriate callbacks

```typescript
interface InboxActionRailProps {
  item: InboxItem;
  onCreateTask: (item: InboxItem, suggestionTitle?: string) => void;
  onMarkComplete: (id: string) => void;
  onArchive: (id: string) => void;
  onSnooze?: (id: string, until: Date) => void;
  onAddNote?: (item: InboxItem) => void;
  onLinkCompany?: (item: InboxItem) => void;        // NEW
  onSaveAttachments?: (item: InboxItem) => void;    // NEW
  attachmentCount?: number;                          // NEW
}
```

### Phase 4: Wire Up Parent Components

**Update: `src/components/inbox/InboxDetailWorkspace.tsx`**

Pass new handlers through:

```typescript
interface InboxDetailWorkspaceProps {
  // ...existing
  onLinkCompany?: (item: InboxItem) => void;
  onSaveAttachments?: (item: InboxItem) => void;
  attachmentCount?: number;
}
```

**Update: `src/pages/Inbox.tsx`**

Add state and handlers for the new modals:

```typescript
// Modal state
const [linkCompanyItem, setLinkCompanyItem] = useState<InboxItem | null>(null);
const [saveAttachmentsItem, setSaveAttachmentsItem] = useState<InboxItem | null>(null);

// Handlers
const handleLinkCompany = (item: InboxItem) => {
  setLinkCompanyItem(item);
};

const handleSaveAttachments = (item: InboxItem) => {
  setSaveAttachmentsItem(item);
};

// Add mutations from useInboxItems
const { linkCompany } = useInboxItems();
```

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/inbox/LinkCompanyModal.tsx` | Create | Company picker modal for linking |
| `src/components/inbox/SaveAttachmentsModal.tsx` | Create | Attachment picker + company selector modal |
| `src/lib/inbox/copyAttachmentToCompany.ts` | Create | Helper to copy files between buckets |
| `src/hooks/useInboxItems.ts` | Modify | Add `linkCompany` mutation |
| `src/components/inbox/InboxActionRail.tsx` | Modify | Enable Link Company, add Save Attachments |
| `src/components/inbox/InboxDetailWorkspace.tsx` | Modify | Pass new handlers |
| `src/pages/Inbox.tsx` | Modify | Add modal state and handlers |

## Component Details

### LinkCompanyModal

```typescript
// Fetches both pipeline and portfolio companies
const { companies: pipelineCompanies } = usePipeline();
const { companies: portfolioCompanies } = usePortfolioCompanies();

// Combined and searchable
const allCompanies = useMemo(() => [
  ...pipelineCompanies.map(c => ({ 
    id: c.id, 
    name: c.company_name, 
    type: 'pipeline' as const,
    logo: c.logo_url 
  })),
  ...portfolioCompanies.map(c => ({ 
    id: c.id, 
    name: c.name, 
    type: 'portfolio' as const,
    logo: c.logo_url 
  })),
], [pipelineCompanies, portfolioCompanies]);
```

### SaveAttachmentsModal

```typescript
// If company already linked, use it
// Otherwise, show company picker first

// Attachment selection
const { attachments } = useInboxAttachments(inboxItemId);
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

// Save action
const handleSave = async () => {
  for (const id of selectedIds) {
    const attachment = attachments.find(a => a.id === id);
    if (attachment) {
      await copyInboxAttachmentToPipeline(attachment, companyId, userId);
    }
  }
  toast.success(`Saved ${selectedIds.size} file(s) to ${companyName}`);
};
```

## UI/UX Flow

### Flow 1: Link Company
1. User clicks "Link Company" in action rail
2. LinkCompanyModal opens with searchable company list
3. User selects a company
4. Modal closes, inbox item now shows linked company badge
5. Future emails from same sender auto-suggest this company

### Flow 2: Save Attachments (with linked company)
1. User views inbox item that has attachments and linked company
2. User clicks "Save Files" → opens SaveAttachmentsModal
3. Modal shows checkboxes for each attachment, pre-selected company
4. User confirms → files copied to company's Files tab
5. Toast confirms success

### Flow 3: Save Attachments (without linked company)
1. User views inbox item with attachments but no linked company
2. User clicks "Save Files"
3. Modal Step 1: Select company (inline company picker)
4. Modal Step 2: Select which attachments
5. User confirms → files copied, company also linked to inbox item
6. Toast confirms success

## Visual Design

### Action Rail Updates

```text
Take Action
───────────────────────
[🗹] Create Task
    Will include email attachments

[📝] Add Note

[🏢] Link Company          ← NOW ENABLED
    Currently linked: [Acme Corp]  ← shows if linked

[💾] Save to Company       ← NEW (only if attachments exist)
    3 attachments available
───────────────────────
```

### LinkCompanyModal Layout

```text
┌────────────────────────────────────────┐
│  Link to Company                    [×]│
├────────────────────────────────────────┤
│  [🔍 Search companies...]              │
│                                        │
│  Pipeline                              │
│  ┌────────────────────────────────┐   │
│  │ 🔷 Acme Corp       [Series A]  │   │
│  │ 🔷 Beta Ventures   [Seed]      │   │
│  └────────────────────────────────┘   │
│                                        │
│  Portfolio                             │
│  ┌────────────────────────────────┐   │
│  │ 🟢 Alpha Inc       [Active]    │   │
│  │ 🟢 Gamma Ltd       [Active]    │   │
│  └────────────────────────────────┘   │
│                                        │
│          [Cancel]  [Link Company]      │
└────────────────────────────────────────┘
```

### SaveAttachmentsModal Layout

```text
┌────────────────────────────────────────┐
│  Save Attachments to Acme Corp      [×]│
├────────────────────────────────────────┤
│  Select files to save:                 │
│                                        │
│  [✓] 📄 pitch_deck.pdf      2.4 MB    │
│  [✓] 🖼 screenshot.png      340 KB    │
│  [ ] 📄 notes.txt           12 KB     │
│                                        │
│  Saving to: [Acme Corp ▼]  ← dropdown  │
│                                        │
│        [Cancel]  [Save 2 Files]        │
└────────────────────────────────────────┘
```

## Future Considerations

### Portfolio Company Attachments

Currently only pipeline companies have an attachments table. To support portfolio:
1. Create `company_attachments` table (mirrors `pipeline_attachments`)
2. Create `company-attachments` storage bucket
3. Add `useCompanyAttachments` hook
4. Update `copyAttachmentToCompany` to handle both types

This can be added in a follow-up phase once the pipeline flow is validated.

### Attachment Source Tracking

Consider adding an optional `source_inbox_attachment_id` column to `pipeline_attachments` to track provenance. This would allow showing "Saved from email: [subject]" in the Files tab.

## Acceptance Criteria

1. "Link Company" button in InboxActionRail is functional
2. LinkCompanyModal shows searchable list of pipeline and portfolio companies
3. Linking updates `related_company_id` and `related_company_name` on inbox item
4. "Save to Company" button appears when inbox item has attachments
5. SaveAttachmentsModal allows selecting specific attachments
6. Selected attachments are copied to the company's Files (pipeline_attachments)
7. Success toasts confirm actions
8. Linked company badge shows in action rail after linking
9. All existing functionality (Create Task, Archive, Snooze) continues working

## Implementation Order

1. **Phase 1**: Add `linkCompany` mutation to useInboxItems
2. **Phase 2**: Create LinkCompanyModal component
3. **Phase 3**: Wire Link Company action in InboxActionRail and Inbox.tsx
4. **Phase 4**: Create copyAttachmentToCompany helper
5. **Phase 5**: Create SaveAttachmentsModal component
6. **Phase 6**: Wire Save Attachments action in InboxActionRail and Inbox.tsx
7. **Phase 7**: Add visual indicators (linked company badge, attachment count)

