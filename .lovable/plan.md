
# Fix Email-Company Linking Visibility

## Problem Summary

When a user links an email to a pipeline company (Proxify), the linked email is correctly stored in the database (`related_company_id` is set), but it does not appear in:

1. The **Comms tab** on the pipeline company detail page
2. The **Relationship Summary** (shows "Comms: 0")
3. The **Activity feed** on the context rail
4. The **Activity dropdown** in the inbox detail drawer

## Root Cause

The communication linking uses **domain matching only** - it checks if the sender/recipient email domain matches the company's `primary_domain`. This misses emails that are **manually linked** via `related_company_id`, which is the case here:

- Sender: `harrison@canapi.com` (domain: canapi.com)
- Company domain: `proxify.ai`
- Domain match: **FAIL**
- But `related_company_id` is correctly set to the Proxify company ID

## Solution

Update the communication fetching to use a **dual approach**:

1. **Domain matching** (existing) - for automatic linking
2. **Explicit link check** (new) - for manually linked emails via `related_company_id`

Additionally, update the inbox activity section to show tasks created from the email.

---

## File Changes

### 1. Update `src/hooks/useCompanyLinkedCommunications.ts`

Add a new parameter to accept the company ID and fetch emails that are explicitly linked:

```text
Current: useCompanyLinkedCommunications(primaryDomain)
New:     useCompanyLinkedCommunications(primaryDomain, companyId?)
```

Changes:
- Accept optional `companyId` parameter
- Fetch inbox items where `related_company_id = companyId` (explicit links)
- Also fetch inbox items matching by domain (implicit links)
- Merge and dedupe the two result sets
- Return unified list of linked communications

Query logic:
```typescript
// Fetch explicitly linked emails
const { data: linkedEmails } = await supabase
  .from('inbox_items')
  .select('id, subject, from_email, from_name, to_email, received_at')
  .eq('related_company_id', companyId)
  .eq('is_resolved', false)
  .eq('is_deleted', false);

// Combine with domain-matched emails, dedupe by ID
```

### 2. Update `src/components/pipeline-detail/tabs/CommsTab.tsx`

Pass the company ID to the hook:

```typescript
// Before
const { linkedCommunications, loading } = useCompanyLinkedCommunications(company.primary_domain);

// After
const { linkedCommunications, loading } = useCompanyLinkedCommunications(
  company.primary_domain,
  company.id
);
```

### 3. Update `src/hooks/usePipelineTimeline.ts`

Add linked emails as timeline events:

```typescript
// Accept a new parameter for linked communications
export function usePipelineTimeline(
  interactions: PipelineInteraction[],
  tasks: PipelineTask[],
  linkedEmails?: LinkedCommunication[]
): PipelineTimelineEvent[]

// Add email linked events to the timeline
for (const email of linkedEmails || []) {
  if (email.type === 'email') {
    events.push({
      id: `email-linked-${email.id}`,
      type: 'email',
      timestamp: email.timestamp,
      title: 'Email linked',
      description: email.title,
      icon: 'email',
      metadata: { email },
    });
  }
}
```

### 4. Update `src/pages/PipelineCompanyDetail.tsx`

Pass linked communications to the timeline hook:

```typescript
// Fetch linked communications for the company
const { linkedCommunications } = useCompanyLinkedCommunications(
  company?.primary_domain,
  companyId
);

// Pass to timeline hook
const timelineEvents = usePipelineTimeline(
  interactions, 
  tasks, 
  linkedCommunications.filter(c => c.type === 'email')
);
```

### 5. Update `src/components/inbox/InboxActionRail.tsx`

Fetch and display tasks created from this email in the Activity section:

```typescript
// Add hook to fetch related tasks
import { useTasks } from '@/hooks/useTasks';

// Inside the component:
const { tasks: allTasks } = useTasks();

// Filter tasks created from this inbox item
const relatedTasks = useMemo(() => {
  return allTasks.filter(t => t.sourceInboxItemId === item.id);
}, [allTasks, item.id]);

// Map to activity items
const activityItems = useMemo(() => {
  return relatedTasks.map(task => ({
    action: `Created task: "${task.content}"`,
    timestamp: formatDistanceToNow(new Date(task.createdAt), { addSuffix: true }),
  }));
}, [relatedTasks]);
```

### 6. Update `src/components/pipeline-detail/shared/RelationshipSummary.tsx`

The Comms count should reflect explicitly linked emails. This is already passed from the parent, but ensure it counts linked inbox items:

The parent component (`DealRoomContextRail`) calculates `commsCount` - update it to use the linked communications count:

```typescript
// In DealRoomContextRail.tsx
const commsCount = linkedCommunications.length; // Use actual count
```

Wait - I need to check what `DealRoomContextRail` currently receives:

---

## Additional Investigation Needed

Looking at `DealRoomContextRail.tsx`:

```typescript
const commsCount = 0; // Placeholder
```

This is a hardcoded placeholder! It needs to receive the actual linked communications count.

### 7. Update `src/components/pipeline-detail/DealRoomContextRail.tsx`

Add linked communications to the props and use for count:

```typescript
interface DealRoomContextRailProps {
  // ...existing props
  linkedCommunications: LinkedCommunication[];
}

// In component
const commsCount = linkedCommunications.length;
```

### 8. Update `src/pages/PipelineCompanyDetail.tsx`

Fetch and pass linked communications to the context rail:

```typescript
const { linkedCommunications, loading: commsLoading } = useCompanyLinkedCommunications(
  company?.primary_domain,
  companyId
);

<DealRoomContextRail
  company={company}
  tasks={tasks}
  interactions={interactions}
  timelineEvents={timelineEvents}
  attachments={attachments}
  linkedCommunications={linkedCommunications}
/>
```

---

## Files Changed Summary

| File | Change |
|------|--------|
| `src/hooks/useCompanyLinkedCommunications.ts` | Add `companyId` param, fetch explicitly linked emails |
| `src/components/pipeline-detail/tabs/CommsTab.tsx` | Pass company ID to hook |
| `src/hooks/usePipelineTimeline.ts` | Include linked emails as timeline events |
| `src/pages/PipelineCompanyDetail.tsx` | Fetch linked comms, pass to timeline + context rail |
| `src/components/pipeline-detail/DealRoomContextRail.tsx` | Accept linked comms, compute count |
| `src/components/inbox/InboxActionRail.tsx` | Show tasks created from email in Activity section |
| `src/types/inbox.ts` | Add `sourceInboxItemId` to InboxItem if missing |

---

## Data Flow After Fix

```text
Email Linked to Company
        │
        ▼
┌────────────────────────────────────┐
│  inbox_items.related_company_id    │
│  = pipeline_company.id             │
└────────────────────────────────────┘
        │
        ▼
┌────────────────────────────────────┐
│  useCompanyLinkedCommunications()  │
│  - Fetches by related_company_id   │
│  - Also matches by domain          │
│  - Returns merged, deduped list    │
└────────────────────────────────────┘
        │
        ├──────────────────────────────────┐
        │                                  │
        ▼                                  ▼
┌──────────────────────┐     ┌──────────────────────────┐
│  CommsTab            │     │  DealRoomContextRail     │
│  Shows linked emails │     │  - RelationshipSummary   │
│  and meetings        │     │    (shows Comms count)   │
└──────────────────────┘     │  - ActivityFeed          │
                             │    (shows email events)  │
                             └──────────────────────────┘
```

---

## Expected Result

After implementation:

1. **Comms tab** - Shows the Neil Agarwal email under "Emails (1)"
2. **Relationship Summary** - Shows "Comms: 1"
3. **Activity feed** - Shows "Email linked" event with timestamp
4. **Inbox Activity dropdown** - Shows "Created task: Follow up with Neil..." entry

---

## Technical Notes

### Deduplication

When merging domain-matched and explicitly-linked emails, dedupe by `id` to avoid showing the same email twice:

```typescript
const allEmails = [...linkedEmails, ...domainMatchedEmails];
const uniqueEmails = Array.from(
  new Map(allEmails.map(e => [e.id, e])).values()
);
```

### Query Cache Invalidation

After linking a company to an email, invalidate the communications query:

```typescript
// In useInboxItems.ts linkCompanyMutation onSuccess:
queryClient.invalidateQueries({ queryKey: ["company_linked_communications"] });
```

### Build Error Fixes

The plan should also include fixing the existing build errors mentioned (TypeScript issues in edge functions) - these are separate from the linking issue but need to be resolved.
