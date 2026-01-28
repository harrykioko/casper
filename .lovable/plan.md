
# Inbox Detail Workspace Refactor

## Overview

Refactor the inbox email detail pane from a single-column layout into a two-column workspace with a wide content column (left) and a sticky action rail (right), wrapped in a glassmorphic card container that matches Casper's command-center aesthetic.

## Current State Analysis

**Current Component:** `src/components/dashboard/InboxDetailDrawer.tsx`
- Single-column layout with header (sender/subject/inline actions) and scrollable body
- Actions are inline in the header: Create Task, Complete, Archive
- Related company card displayed at top of body
- Email content with collapsible disclaimer section
- Supports both `sheet` and `embedded` modes

**Action Handlers Available (from `useInboxItems`):**
- `markAsRead`, `markComplete`, `archive`, `unarchive`
- `snooze` (takes Date)
- `markTopPriority`

**UI Patterns to Reuse:**
- `GlassPanel` / `GlassModuleCard` for glassmorphic containers
- `ActionPanel` system for consistent styling
- Snooze dropdown pattern from `PriorityTaskDetailContent`

## Implementation Plan

### File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/inbox/InboxDetailWorkspace.tsx` | CREATE | New two-column workspace component |
| `src/components/inbox/InboxActionRail.tsx` | CREATE | Right-side sticky action rail |
| `src/components/inbox/InboxContentPane.tsx` | CREATE | Left-side content column |
| `src/components/dashboard/InboxDetailDrawer.tsx` | MODIFY | Use new workspace in embedded mode |
| `src/pages/Inbox.tsx` | MODIFY | Pass additional handlers (snooze, addNote) |

### Component Architecture

```text
InboxDetailDrawer (existing, mode switch)
  |
  +-- mode="sheet" --> Sheet overlay (unchanged for mobile)
  |
  +-- mode="embedded" --> InboxDetailWorkspace (NEW)
                              |
                              +-- InboxContentPane (left, scrollable)
                              |     +-- Header (sender, subject, timestamp, status pill)
                              |     +-- Body (cleaned content)
                              |     +-- Collapsible "View original email"
                              |     +-- Linked Entities section
                              |
                              +-- InboxActionRail (right, sticky)
                                    +-- Take Action section
                                    +-- Suggested Actions (placeholder)
                                    +-- Activity timeline (placeholder)
```

### Step 1: Create InboxActionRail Component

**File:** `src/components/inbox/InboxActionRail.tsx`

A compact, sticky vertical rail with action groups:

**Take Action Section:**
- Create Task button (icon + label)
- Add Note button (opens AddNoteModal)
- Link Company button (placeholder for now)
- Set Category dropdown (placeholder)
- Snooze dropdown (Later today / Tomorrow / Next week)
- Complete button
- Archive button

**Suggested Actions Section:**
- Header with sparkle icon and count
- Placeholder cards showing AI suggestion format
- Each card: title, confidence badge, effort estimate, Approve/Edit buttons
- Initially shows "No suggestions yet" empty state

**Activity Section:**
- Header "Activity" with count
- Collapsible list of actions taken (placeholder data structure)
- Each entry: icon, action text, timestamp

**Styling:**
- Width: ~200px fixed
- Sticky positioning (top-24)
- Glass background with subtle border
- Compact button sizing (h-8, text-xs)
- Muted section headers (uppercase, tracking-wide)
- Dividers between sections

### Step 2: Create InboxContentPane Component

**File:** `src/components/inbox/InboxContentPane.tsx`

The main document viewing area:

**Header Section:**
- Sender avatar, name, email
- Timestamp (relative + absolute on hover)
- Subject as prominent title
- Status pill (Open/Resolved/Archived)
- Category chips (if any linked)
- Linked company chips (clickable)

**Body Section:**
- Max-width prose container for readability
- Cleaned/parsed body content by default
- HTML sanitization for htmlBody
- "View original email" collapsible at bottom showing raw content

**Attachments Section (placeholder):**
- List of attachment cards
- Each card: file icon, name, size, download button
- PDF/image preview deferred to future phase

**Linked Entities Section:**
- Subsection for linked companies (with avatars, names)
- Quick unlink button on hover
- "+ Link company" button if none linked

### Step 3: Create InboxDetailWorkspace Component

**File:** `src/components/inbox/InboxDetailWorkspace.tsx`

The container component that arranges the two columns:

```tsx
<div className="flex h-full rounded-2xl border bg-card shadow-sm overflow-hidden">
  {/* Left: Content Column (scrollable) */}
  <div className="flex-1 min-w-0 overflow-y-auto">
    <InboxContentPane ... />
  </div>
  
  {/* Right: Action Rail (sticky) */}
  <div className="w-[200px] xl:w-[220px] flex-shrink-0 border-l overflow-y-auto">
    <InboxActionRail ... />
  </div>
</div>
```

**Layout Details:**
- Flex container with `h-full`
- Left column: `flex-1 min-w-0` for flexible width, independent scroll
- Right rail: fixed width (200-220px), border-left, independent scroll if needed
- Container: rounded-2xl corners, subtle shadow, glass-like border

### Step 4: Update InboxDetailDrawer

**File:** `src/components/dashboard/InboxDetailDrawer.tsx`

Modify embedded mode to use the new workspace:

```tsx
if (mode === 'embedded') {
  return (
    <InboxDetailWorkspace
      item={item}
      onClose={onClose}
      onCreateTask={onCreateTask}
      onMarkComplete={onMarkComplete}
      onArchive={onArchive}
      onSnooze={onSnooze}
      onAddNote={onAddNote}
    />
  );
}
```

Keep the sheet mode unchanged for mobile.

### Step 5: Update Inbox Page

**File:** `src/pages/Inbox.tsx`

Pass additional handlers to the detail drawer:
- `onSnooze` handler using `snooze` from `useInboxItems`
- `onAddNote` handler to open note modal with inbox item context

Add state for AddNoteModal:
```tsx
const [noteModalOpen, setNoteModalOpen] = useState(false);
const [noteContext, setNoteContext] = useState<NoteContext | null>(null);

const handleAddNote = (item: InboxItem) => {
  // Could link to inbox item if note_links supports it
  // For now, just open the modal
  setNoteModalOpen(true);
};
```

## Styling Details

**Container:**
- `rounded-2xl` for pane-within-cockpit feel
- `bg-white dark:bg-slate-900` base
- `border border-slate-200 dark:border-slate-700`
- `shadow-sm` subtle elevation

**Section Headers:**
- `text-[10px] font-semibold uppercase tracking-[0.12em]`
- `text-muted-foreground`
- `mb-2` spacing

**Action Buttons:**
- `h-8 text-xs` compact sizing
- Full-width in rail: `w-full justify-start`
- Icons: `h-3.5 w-3.5 mr-2`
- Ghost variant for secondary actions
- Outline variant for primary actions

**Dividers:**
- `border-t border-slate-100 dark:border-slate-800`
- `my-4` spacing between sections

**Content Typography:**
- Body: `text-[13px] leading-relaxed`
- `max-w-prose` for readability
- Muted colors for metadata

## Props Interface

```typescript
interface InboxDetailWorkspaceProps {
  item: InboxItem;
  onClose: () => void;
  onCreateTask: (item: InboxItem) => void;
  onMarkComplete: (id: string) => void;
  onArchive: (id: string) => void;
  onSnooze?: (id: string, until: Date) => void;
  onAddNote?: (item: InboxItem) => void;
}
```

## Deferred Items

1. **Attachments Preview**: File attachment listing and PDF/image preview - requires backend attachment storage (not currently in inbox_items schema)

2. **AI Suggested Actions**: Placeholder UI only - actual AI suggestion engine is a separate feature

3. **Activity Timeline**: Placeholder structure - requires tracking actions taken on inbox items (new table or audit log)

4. **Link Company**: UI placeholder - requires modal for company search and linking mutation

5. **Set Category**: UI placeholder - requires category system for inbox items

## Summary

This refactor introduces a two-column workspace layout for the inbox detail pane:
- Left column for focused email reading with cleaned content
- Right rail for quick actions and future AI suggestions
- Glassmorphic styling consistent with Casper's design language
- No changes to existing data fetching, filtering, or list behavior
- Maintains mobile sheet mode unchanged
