
# Add "Save to Company" Button for Individual Attachments

## Overview

Enhance the inbox attachments section by adding a "Save to Company" button on each individual attachment card, allowing users to quickly save specific documents to a linked company's file workspace.

## Current State

- **InboxAttachmentsSection** displays attachment cards with Preview and Download buttons
- **SaveAttachmentsModal** exists but is only accessible via the Action Rail's "Save to Company" button
- The modal requires selecting files first, then a company (multi-step)
- Individual attachments can't be saved directly

## User Flow After Change

```text
User views email with attachments
          │
          ▼
┌─────────────────────────────────────────────────┐
│  ATTACHMENT CARD                                │
│  ┌──────┐                                       │
│  │ PDF  │  Nilus One-Pager Nov25.pdf     👁 ⬇ 💾│
│  └──────┘  2.7 MB                               │
└─────────────────────────────────────────────────┘
          │
          │ User clicks 💾 (Save to Company)
          │
          ├──────────────────────────────────────────┐
          │                                          │
     Company Linked?                            No Company?
          │                                          │
          ▼                                          ▼
   Save immediately                      Open company picker modal
   Show toast success                    Then save on selection
```

## File Changes

### 1. Update `InboxAttachmentsSection.tsx`

Add a "Save to Company" button to each `AttachmentCard`:

**Props changes:**
- Accept `linkedCompanyId`, `linkedCompanyName` from parent
- Accept `onSaveAttachment` callback for handling save action

**AttachmentCard changes:**
- Add a Save icon button (Building2 icon) next to Download
- Button shows tooltip: "Save to [Company Name]" or "Save to Company"
- On click:
  - If company is linked → call save function directly
  - If no company → trigger the save modal flow

**Component signature:**
```typescript
interface InboxAttachmentsSectionProps {
  inboxItemId: string;
  linkedCompanyId?: string;
  linkedCompanyName?: string;
  onSaveToCompany?: (attachment: InboxAttachment) => void;
}
```

### 2. Update `InboxContentPane.tsx`

Pass the linked company info and save handler to `InboxAttachmentsSection`:

```typescript
<InboxAttachmentsSection 
  inboxItemId={item.id}
  linkedCompanyId={item.relatedCompanyId}
  linkedCompanyName={item.relatedCompanyName}
  onSaveToCompany={onSaveAttachmentToCompany}
/>
```

Add handler that:
- If company is linked → call `copyInboxAttachmentToPipeline` directly
- If no company → open modal (passed from parent)

### 3. Update `InboxDetailWorkspace.tsx`

Add new prop to accept single-attachment save handler:

```typescript
onSaveAttachmentToCompany?: (attachment: InboxAttachment) => void;
```

Pass down to `InboxContentPane`.

### 4. Update `InboxDetailDrawer.tsx` (embedded mode)

Pass the single-attachment handler through to `InboxDetailWorkspace`.

### 5. Update `Inbox.tsx` Page

Add state and handler for single attachment saves:

```typescript
// State for single attachment save
const [singleAttachmentToSave, setSingleAttachmentToSave] = useState<{
  attachment: InboxAttachment;
  inboxItem: InboxItem;
} | null>(null);

// Handler for single attachment save
const handleSaveAttachmentToCompany = async (attachment: InboxAttachment, item: InboxItem) => {
  if (item.relatedCompanyId) {
    // Company linked - save directly
    const result = await copyInboxAttachmentToPipeline(
      attachment,
      item.relatedCompanyId,
      user.id
    );
    if (result.success) {
      toast.success(`Saved "${attachment.filename}" to ${item.relatedCompanyName}`);
    } else {
      toast.error("Failed to save attachment");
    }
  } else {
    // No company - open modal with single attachment preselected
    setSingleAttachmentToSave({ attachment, inboxItem: item });
    setSaveAttachmentsItem(item);
  }
};
```

### 6. Optional: Enhance `SaveAttachmentsModal.tsx`

Add prop to pre-select specific attachments when opened from individual save button:

```typescript
interface SaveAttachmentsModalProps {
  // ... existing props
  preSelectedAttachmentIds?: string[];
}
```

When `preSelectedAttachmentIds` is provided:
- Initialize `selectedIds` state with these IDs
- Skip file selection step if only one pre-selected

---

## UI Design for Attachment Card

```text
┌────────────────────────────────────────────────────────────────┐
│  ┌──────┐                                                      │
│  │ icon │  filename.pdf                    [👁] [⬇] [🏢]      │
│  └──────┘  2.7 MB                                              │
└────────────────────────────────────────────────────────────────┘
                                              │    │    │
                                          Preview  │  Save to
                                              Download  Company
```

Button states:
- **If company linked**: Building2 icon with checkmark, tooltip "Save to [CompanyName]"
- **If no company**: Building2 icon, tooltip "Save to company..."
- **Saving state**: Loader2 spinner

---

## Files Changed Summary

| File | Change |
|------|--------|
| `src/components/inbox/InboxAttachmentsSection.tsx` | Add Save button to each card, accept company props |
| `src/components/inbox/InboxContentPane.tsx` | Pass company info to attachments section |
| `src/components/inbox/InboxDetailWorkspace.tsx` | Add single-save handler prop |
| `src/components/dashboard/InboxDetailDrawer.tsx` | Pass handler through to workspace |
| `src/pages/Inbox.tsx` | Add handler for single attachment saves |

---

## Technical Notes

### Direct Save (when company linked)

```typescript
import { copyInboxAttachmentToPipeline } from "@/lib/inbox/copyAttachmentToCompany";

const result = await copyInboxAttachmentToPipeline(
  attachment,
  companyId,
  userId
);
```

### Toast Feedback

- Success: `Saved "filename.pdf" to [Company Name]`
- Error: `Failed to save attachment`
- Loading: Spinner on button, disable other actions

### Edge Cases

1. **Portfolio companies**: Show toast "Saving to portfolio coming soon" (already handled in existing modal)
2. **Linked company deleted**: Show error toast, fallback to company picker
3. **Storage bucket permission errors**: Show clear error message

---

## Expected Result

After implementation:

1. Each attachment card shows a third button (Building2 icon) for "Save to Company"
2. If email is linked to a company → one-click save with success toast
3. If email has no linked company → opens company picker modal
4. Files appear in the company's Files tab immediately
5. Works consistently in both desktop embedded view and mobile drawer
