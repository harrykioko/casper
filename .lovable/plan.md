
# Enhance Linked Entities Section in Inbox Drawer

## Summary

Improve the "Linked Entities" section in the inbox detail view with:
1. Clickable company link that routes to the company detail page
2. Display company logo instead of generic Building2 icon  
3. Add ability to remove/unlink a company
4. Move the Linked Entities section above "View original email" dropdown

## Current State

In `InboxContentPane.tsx`, the Linked Entities section:
- Shows at the bottom after the "View original email" collapsible
- Uses a static `Building2` icon instead of the company logo
- Is not clickable/navigable
- Has no way to remove the link

The `InboxItem` type has:
- `relatedCompanyId` - the company UUID
- `relatedCompanyName` - the company name

Missing:
- `relatedCompanyType` - needed to determine routing path (pipeline vs portfolio)
- `relatedCompanyLogoUrl` - needed for displaying the logo

## Solution

### Approach 1: Store type and logo URL in inbox_items (Recommended)

Add two new columns to `inbox_items` table:
- `related_company_type` (text, nullable) - 'pipeline' or 'portfolio'
- `related_company_logo_url` (text, nullable) - URL of the company logo

This data is already available when linking (the `LinkCompanyModal` has access to type and logo), we just need to persist it.

### File Changes

#### 1. Database Migration

Add columns to `inbox_items` table:
- `related_company_type TEXT` (values: 'pipeline', 'portfolio', null)
- `related_company_logo_url TEXT`

```sql
ALTER TABLE inbox_items 
ADD COLUMN related_company_type TEXT,
ADD COLUMN related_company_logo_url TEXT;
```

#### 2. Update `src/types/inbox.ts`

Add the new fields to the `InboxItem` interface:

```typescript
export interface InboxItem {
  // ... existing fields
  relatedCompanyId?: string;
  relatedCompanyName?: string;
  relatedCompanyType?: 'pipeline' | 'portfolio';  // NEW
  relatedCompanyLogoUrl?: string;                  // NEW
  // ...
}
```

#### 3. Update `src/hooks/useInboxItems.ts`

**Update `InboxItemRow` interface:**
Add the new database columns:
```typescript
related_company_type?: string | null;
related_company_logo_url?: string | null;
```

**Update `transformRow` function:**
Map the new fields:
```typescript
relatedCompanyType: row.related_company_type as 'pipeline' | 'portfolio' | undefined,
relatedCompanyLogoUrl: row.related_company_logo_url || undefined,
```

**Update `linkCompanyMutation`:**
Accept and persist the additional data:
```typescript
mutationFn: async ({ 
  id, 
  companyId, 
  companyName,
  companyType,   // NEW
  companyLogoUrl // NEW
}: { 
  id: string; 
  companyId: string | null; 
  companyName: string | null;
  companyType?: 'pipeline' | 'portfolio' | null;
  companyLogoUrl?: string | null;
}) => {
  const { error } = await supabase
    .from("inbox_items")
    .update({ 
      related_company_id: companyId,
      related_company_name: companyName,
      related_company_type: companyType || null,
      related_company_logo_url: companyLogoUrl || null,
    })
    .eq("id", id);
  if (error) throw error;
}
```

**Update the exported `linkCompany` function signature:**
```typescript
linkCompany: (
  id: string, 
  companyId: string | null, 
  companyName: string | null,
  companyType?: 'pipeline' | 'portfolio' | null,
  companyLogoUrl?: string | null
) => linkCompanyMutation.mutate({ id, companyId, companyName, companyType, companyLogoUrl })
```

**Add `unlinkCompany` mutation:**
New mutation that clears the company link:
```typescript
const unlinkCompanyMutation = useMutation({
  mutationFn: async (id: string) => {
    const { error } = await supabase
      .from("inbox_items")
      .update({ 
        related_company_id: null,
        related_company_name: null,
        related_company_type: null,
        related_company_logo_url: null,
      })
      .eq("id", id);
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["inbox_items"] });
    queryClient.invalidateQueries({ queryKey: ["inbox_items_archived"] });
    queryClient.invalidateQueries({ queryKey: ["company_linked_communications"] });
    toast.success("Company unlinked");
  },
  onError: (error) => {
    console.error("Error unlinking company:", error);
    toast.error("Failed to unlink company");
  },
});

// Export
unlinkCompany: (id: string) => unlinkCompanyMutation.mutate(id),
```

#### 4. Update `src/components/inbox/LinkCompanyModal.tsx`

The modal already has access to company type and logo. Update the `onLinked` callback to include logo:

```typescript
onLinked: (
  companyId: string, 
  companyName: string, 
  companyType: 'pipeline' | 'portfolio',
  companyLogoUrl?: string | null
) => void;
```

Update `handleConfirm`:
```typescript
const handleConfirm = () => {
  if (selectedCompany) {
    onLinked(
      selectedCompany.id, 
      selectedCompany.name, 
      selectedCompany.type,
      selectedCompany.logo
    );
    // ...
  }
};
```

#### 5. Update All `LinkCompanyModal` Usage Sites

**`src/pages/Inbox.tsx`:**
```typescript
const handleCompanyLinked = (
  companyId: string, 
  companyName: string, 
  companyType: 'pipeline' | 'portfolio',
  companyLogoUrl?: string | null
) => {
  if (linkCompanyItem) {
    linkCompany(linkCompanyItem.id, companyId, companyName, companyType, companyLogoUrl);
    setLinkCompanyItem(null);
  }
};
```

**`src/components/dashboard/InboxPanel.tsx`** - same pattern

**`src/components/pipeline-detail/tabs/CommsTab.tsx`** - same pattern

#### 6. Update `src/contexts/GlobalInboxDrawerContext.tsx`

Add `onUnlinkCompany` to the handlers interface:

```typescript
export interface InboxDrawerHandlers {
  // ... existing handlers
  onUnlinkCompany?: (id: string) => void;  // NEW
}
```

#### 7. Update `src/components/inbox/InboxContentPane.tsx`

**Add new props:**
```typescript
interface InboxContentPaneProps {
  item: InboxItem;
  onClose: () => void;
  hideCloseButton?: boolean;
  onSaveAttachmentToCompany?: (attachment: InboxAttachment) => void;
  onUnlinkCompany?: (id: string) => void;  // NEW
}
```

**Add navigation:**
```typescript
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X as XIcon } from "lucide-react"; // rename for clarity

const navigate = useNavigate();

const handleCompanyClick = () => {
  if (item.relatedCompanyId && item.relatedCompanyType) {
    const path = item.relatedCompanyType === 'pipeline' 
      ? `/pipeline/${item.relatedCompanyId}`
      : `/portfolio/${item.relatedCompanyId}`;
    navigate(path);
  }
};

const handleUnlink = (e: React.MouseEvent) => {
  e.stopPropagation();
  onUnlinkCompany?.(item.id);
};
```

**Move Linked Entities section above "View original email":**

Current order in the scrollable body:
1. Email body content
2. Attachments section  
3. View original email (collapsible)
4. Linked Entities section

New order:
1. Email body content
2. Attachments section
3. **Linked Entities section** (moved up)
4. View original email (collapsible)

**Redesign Linked Entities card:**
```jsx
{/* Linked Entities Section - moved above View original email */}
{item.relatedCompanyId && (
  <div className="mt-6">
    <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">
      Linked Entities
    </h3>
    <div className="space-y-2">
      <div 
        className="flex items-center gap-3 p-2 rounded-lg border border-border bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors group"
        onClick={handleCompanyClick}
      >
        {/* Company Logo or Fallback */}
        <Avatar className="h-8 w-8">
          <AvatarImage 
            src={item.relatedCompanyLogoUrl || undefined} 
            alt={item.relatedCompanyName || 'Company'} 
          />
          <AvatarFallback className="text-xs bg-background border border-border">
            {item.relatedCompanyName?.slice(0, 2).toUpperCase() || 'CO'}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {item.relatedCompanyName}
          </p>
          <p className="text-[10px] text-muted-foreground capitalize">
            {item.relatedCompanyType || 'Company'}
          </p>
        </div>
        
        {/* Remove link button */}
        {onUnlinkCompany && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleUnlink}
          >
            <XIcon className="h-3 w-3 text-muted-foreground" />
          </Button>
        )}
      </div>
    </div>
  </div>
)}

{/* View original email - now after Linked Entities */}
{hasCleanedContent && (
  <Collapsible ...>
    ...
  </Collapsible>
)}
```

#### 8. Update `src/components/inbox/InboxDetailWorkspace.tsx`

Pass the new handler through:
```typescript
interface InboxDetailWorkspaceProps {
  // ... existing props
  onUnlinkCompany?: (id: string) => void;  // NEW
}

// In component:
<InboxContentPane 
  item={item} 
  onClose={onClose}
  hideCloseButton={hideCloseButton}
  onSaveAttachmentToCompany={onSaveAttachmentToCompany}
  onUnlinkCompany={onUnlinkCompany}  // NEW
/>
```

#### 9. Update `src/components/inbox/GlobalInboxDrawerOverlay.tsx`

Pass the handler from context:
```typescript
<InboxDetailWorkspace
  // ... existing props
  onUnlinkCompany={handlers.onUnlinkCompany}
/>
```

#### 10. Update All Entry Points to Provide `onUnlinkCompany`

**`src/pages/Inbox.tsx`:**
```typescript
// Add to the openGlobalDrawer call
openGlobalDrawer(item, {
  // ... existing handlers
  onUnlinkCompany: (id) => linkCompany(id, null, null, null, null),
});
```

**`src/components/dashboard/InboxPanel.tsx`:**
Same pattern - add `onUnlinkCompany` to the drawer handlers.

**`src/components/pipeline-detail/tabs/CommsTab.tsx`:**
Same pattern.

---

## Files Changed Summary

| File | Change |
|------|--------|
| `supabase/migrations/xxx_add_company_link_metadata.sql` | Add columns for type and logo URL |
| `src/types/inbox.ts` | Add `relatedCompanyType` and `relatedCompanyLogoUrl` |
| `src/hooks/useInboxItems.ts` | Update transform, link mutation, add unlink mutation |
| `src/components/inbox/LinkCompanyModal.tsx` | Include logo in onLinked callback |
| `src/contexts/GlobalInboxDrawerContext.tsx` | Add `onUnlinkCompany` to handlers |
| `src/components/inbox/InboxContentPane.tsx` | Redesign linked entities (clickable, logo, remove button, reorder) |
| `src/components/inbox/InboxDetailWorkspace.tsx` | Pass through unlink handler |
| `src/components/inbox/GlobalInboxDrawerOverlay.tsx` | Pass through unlink handler |
| `src/pages/Inbox.tsx` | Update handlers for new signature |
| `src/components/dashboard/InboxPanel.tsx` | Update handlers for new signature |
| `src/components/pipeline-detail/tabs/CommsTab.tsx` | Update handlers for new signature |

---

## Visual Design

```text
┌─────────────────────────────────────────────────────────────┐
│  LINKED ENTITIES                                            │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ┌────────┐                                      [x] │   │
│  │  │ LOGO   │  Nilus                                   │   │
│  │  │  img   │  Pipeline                                │   │
│  │  └────────┘                                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↓ clickable, navigates to company   │
│                         ↓ [x] removes the link              │
└─────────────────────────────────────────────────────────────┘

Below this:
┌─────────────────────────────────────────────────────────────┐
│  ▼ View original email • Forwarded, Disclaimer             │
└─────────────────────────────────────────────────────────────┘
```

---

## Expected Result

1. **Clickable company** - Clicking the linked entity navigates to `/pipeline/{id}` or `/portfolio/{id}`
2. **Company logo** - Shows actual logo (Avatar with fallback to initials)
3. **Remove link** - X button appears on hover, clears the company association
4. **Correct position** - Linked Entities now appears above the "View original email" dropdown
