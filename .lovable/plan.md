

# Add Quick Actions to Reading Items in Focus Queue

## Problem Summary

Reading items in the Focus Queue currently display only the title and "Unlinked" badge, requiring users to click to open the FocusReadingSheet before taking any action. Users want inline quick actions directly on the row for faster triage.

## Current State

- `FocusItemRow.tsx` renders all focus queue items uniformly with no quick actions
- The `FocusReadingSheet.tsx` contains the full set of reading-specific triage actions: Queue, Up Next, Signal, Archive, Open Link, Snooze
- The `useFocusReadingActions` hook provides the functions for these actions
- Other components like `ReadingItemCard.tsx` and `PriorityItemRow.tsx` demonstrate the inline action pattern using `group-hover:opacity-100`

## Solution

Enhance `FocusItemRow.tsx` to show hover-revealed quick action buttons specifically for reading items (`source_type === 'reading'`). The actions will provide rapid triage without opening the detail sheet.

---

## Implementation Details

### Part 1: Update FocusItemRow to Accept Action Handlers

**File: `src/components/focus/FocusItemRow.tsx`**

Add new optional props for reading-specific actions:

```typescript
interface FocusItemRowProps {
  item: FocusQueueItem;
  isSelected: boolean;
  onClick: () => void;
  index: number;
  // New: Reading quick action handlers
  onReadingQueue?: (workItemId: string, sourceId: string) => void;
  onReadingUpNext?: (workItemId: string, sourceId: string) => void;
  onReadingArchive?: (workItemId: string, sourceId: string) => void;
  onReadingOpenLink?: (url: string) => void;
  onSnooze?: (workItemId: string, until: Date) => void;
}
```

### Part 2: Add Hover Quick Actions for Reading Items

Add inline action buttons that appear on hover, following the existing pattern:

```text
Row Structure:
[Icon] [Title & badges]                    [Quick Actions (on hover)] [Timestamp]

Quick Actions (visible on hover, reading items only):
- Open Link (ExternalLink icon) - opens URL in new tab
- Queue (ListPlus icon) - keeps as queued
- Up Next (ArrowUpRight icon) - marks as up next
- Archive (Archive icon) - archives the item
- Snooze dropdown (Clock icon) - snooze options
```

Implementation uses:
- Parent `div` gets `group` class
- Action buttons wrapped in `opacity-0 group-hover:opacity-100 transition-opacity`
- Each button uses `e.stopPropagation()` to prevent row click
- Small ghost buttons matching existing design system (6x6 rounded-full)

### Part 3: Wire Actions in FocusQueue.tsx

**File: `src/pages/FocusQueue.tsx`**

Add the `useFocusReadingActions` hook and create handlers:

```typescript
const readingActions = useFocusReadingActions();

const handleReadingQueue = useCallback((workItemId: string, sourceId: string) => {
  readingActions.keepAsQueued(sourceId, workItemId);
}, [readingActions]);

const handleReadingUpNext = useCallback((workItemId: string, sourceId: string) => {
  readingActions.markUpNext(sourceId, workItemId);
}, [readingActions]);

const handleReadingArchive = useCallback((workItemId: string, sourceId: string) => {
  readingActions.archiveFromFocus(sourceId, workItemId);
}, [readingActions]);

const handleReadingOpenLink = useCallback((url: string) => {
  window.open(url, "_blank", "noopener,noreferrer");
}, []);
```

Pass these handlers to each `FocusItemRow`:

```tsx
<FocusItemRow
  key={item.id}
  item={item}
  isSelected={selectedItem?.id === item.id}
  onClick={() => handleItemClick(item)}
  index={index}
  onReadingQueue={handleReadingQueue}
  onReadingUpNext={handleReadingUpNext}
  onReadingArchive={handleReadingArchive}
  onReadingOpenLink={handleReadingOpenLink}
  onSnooze={(id, until) => triageActions.snooze(id, until)}
/>
```

### Part 4: Fetch URL for Open Link Action

The `FocusQueueItem` doesn't include the reading item URL. We need to fetch it from `reading_items` table when composing focus queue items.

**File: `src/hooks/useFocusQueue.ts`**

Update the `fetchSourceData` function to include URL for reading items:

```typescript
if (byType["reading"]?.length) {
  fetches.push(async () => {
    const { data } = await supabase
      .from("reading_items")
      .select("id, title, url, project_id, one_liner")  // Add one_liner too
      .in("id", byType["reading"]);
    for (const row of data || []) {
      result[`reading:${row.id}`] = {
        title: row.title || row.url || "Untitled",
        url: row.url,  // NEW
        snippet: row.one_liner || undefined,  // Show one-liner as snippet
        scoreData: {},
        hasSourceLink: !!row.project_id,
      };
    }
  });
}
```

Update the `SourceDataEntry` interface and `FocusQueueItem` to include the URL:

```typescript
interface SourceDataEntry {
  title: string;
  snippet?: string;
  url?: string;  // NEW for reading items
  scoreData?: any;
  hasSourceLink?: boolean;
}
```

Pass URL to composed items:

```typescript
composedItems.push({
  ...item,
  // ... existing fields
  source_url: sd?.url || undefined,  // NEW
});
```

Update `FocusQueueItem` interface to include `source_url`:

```typescript
export interface FocusQueueItem extends WorkQueueItem {
  priorityScore: number;
  source_url?: string;  // NEW for reading items
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useFocusQueue.ts` | Add URL to SourceDataEntry and FocusQueueItem, fetch URL for reading items |
| `src/components/focus/FocusItemRow.tsx` | Add quick action props, render hover buttons for reading items |
| `src/pages/FocusQueue.tsx` | Import useFocusReadingActions, create handlers, pass to FocusItemRow |

---

## Visual Design

**Before (current):**
```text
[BookOpen] War Is Peace, the Dozing Don Edition       5 days ago
           ⊘ Unlinked
```

**After (on hover):**
```text
[BookOpen] War Is Peace, the Dozing Don Edition   [↗][+][↑][📥][⏰]  5 days ago
           ⊘ Unlinked
```

Where icons are:
- ↗ = Open Link (ExternalLink)
- + = Queue (ListPlus) 
- ↑ = Up Next (ArrowUpRight)
- 📥 = Archive (Archive)
- ⏰ = Snooze dropdown (Clock)

---

## Technical Notes

1. Only reading items (`source_type === 'reading'`) will show quick actions
2. Actions use `e.stopPropagation()` to prevent opening the detail sheet
3. All actions resolve the work item (set status to 'trusted') after completing
4. The Open Link action requires fetching the URL from reading_items table
5. Snooze uses a dropdown menu matching the pattern in FocusReadingSheet
6. Toast notifications already handled by useFocusReadingActions

