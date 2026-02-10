

# Command Stream Mode Implementation

## Overview

Replace the current placeholder for "Command Stream" on the Home page with a fully functional three-column layout: Filter Panel (left), Action Stream (center), and Assist/Time Context (right). This reuses the existing `useTriageQueue` data pipeline and drawer infrastructure from the Triage page.

## Layout Structure

```text
[ Filter Panel (260px) ]   [ Action Stream (flex) ]   [ Assist + Calendar (260px) ]
```

## Files to Create

### 1. `src/components/home/CommandStreamLayout.tsx`
Three-column grid wrapper similar to `FocusModeLayout` but with column widths tuned for Command Stream: `grid-cols-[260px_1fr_260px]` with `gap-6`.

### 2. `src/components/home/CommandFilterPanel.tsx`
Left column -- sticky filter panel matching Triage's `TriageSummaryPanel` styling and interaction patterns.

- **Type filters**: Email, Tasks, Commitments, Meetings, Pipeline (placeholder), Reading -- each as a `StatChip` toggle with icon and count
- **Priority/State filters**: Critical (score >= 0.7), Due Today, Upcoming, Waiting On -- derived from triage queue data
- **Effort filters**: Quick, Medium, Long -- reuse existing `EffortEstimate` type
- Collapsible sections using `Collapsible` from shadcn/ui
- "Clear all filters" link when any filter is active
- Styled as a rounded card (`bg-card`, `border`, `rounded-2xl`, `shadow-sm`) matching Triage panel

### 3. `src/components/home/CommandActionStream.tsx`
Center column -- the unified action stream.

- Groups items by priority tier: "Critical" (score >= 0.7), "Due Today" (score >= 0.4), "Upcoming" (remainder)
- Each group has a subtle header label (uppercase tracking, `text-[11px]`)
- Renders `CommandActionCard` for each item
- Scrollable with `max-h-[calc(100vh-12rem)]` and `overflow-y-auto`
- Empty state when all clear

### 4. `src/components/home/CommandActionCard.tsx`
Individual action card for each stream item.

- Compact card: `bg-card`, `border border-border/40`, `rounded-xl`, `px-4 py-3`
- Left: type icon with source color (reuse `SOURCE_ICONS` / `SOURCE_COLORS` pattern from `TriageItemRow`)
- Center: title (truncated, `text-sm font-medium`) + one-line context (`text-xs text-muted-foreground`)
- Right: urgency badge (red only for critical, amber for medium, muted for low) + hover-revealed quick actions (Trusted, Snooze dropdown, No Action)
- `motion.div` with `whileHover={{ y: -1, scale: 1.005 }}` for the premium hover lift
- `onClick` triggers drawer opening via callback

### 5. `src/components/home/CommandAssistPanel.tsx`
Right column -- two sections stacked vertically.

- **Assist placeholder**: A minimal card with "Assist" header and a muted placeholder message ("AI suggestions will appear here"). Styled as `bg-card/50`, dashed border, centered text.
- **Today's Availability**: Reads from the existing `useOutlookCalendar` events hook.
  - Shows next meeting name and start time
  - Shows available time windows (gaps between meetings today)
  - Read-only, calm presentation using `text-xs`/`text-sm`, muted colors
  - Reuses event data already available in `Home.tsx`

## Files to Modify

### 6. `src/pages/Home.tsx`
- Import `CommandStreamMode` (new orchestrator component)
- Replace the `<PlaceholderMode mode={mode} />` render with:
  - `mode === "command"` renders `<CommandStreamMode />`
  - `mode === "executive"` keeps `<PlaceholderMode mode="executive" />`

### 7. `src/components/home/CommandStreamMode.tsx` (new)
Orchestrator component that:
- Calls `useTriageQueue()` for data, filters, counts
- Calls `useOutlookCalendar()` for calendar context
- Calls `useInboxItems()`, `useTasksManager()`, `useCommitments()` for drawer source data
- Manages drawer state (same pattern as `TriageQueue.tsx`: `selectedItem`, `inboxDrawerItem`, `taskDrawerItem`, etc.)
- Wires `handleItemClick` to open the correct existing drawer (`TriageInboxDrawer`, `TriageTaskDrawer`, `TriageCommitmentDrawer`, `TriageEventModal`, `TriageReadingSheet`, `TriageGenericSheet`)
- Passes filter state and callbacks to `CommandFilterPanel`
- Passes items and click handler to `CommandActionStream`
- Passes calendar events to `CommandAssistPanel`
- Renders all drawers/modals at the bottom (same as Triage page)

## Data Flow

The Command Stream reuses the same `useTriageQueue` hook that powers the Triage page. No new data fetching or backend changes are needed. The filter panel applies client-side filters on the same dataset. Clicking a card opens the same detail drawers already built for Triage.

## Styling Details

- Background: inherits the existing `bg-home-gradient` from the Home page
- Cards use `bg-card` with `border-border/40` (not `/50`) for slightly softer borders
- No heavy shadows -- only `shadow-sm` on the filter panel card
- Typography hierarchy: section headers are `text-[11px] uppercase tracking-wider text-muted-foreground`
- One accent color: violet (matching Triage's icon background)
- Red used only for critical urgency badges (`bg-red-100 text-red-700` light / `bg-red-900/30 text-red-400` dark)
- Framer Motion entrance animations: fade-in with slight upward slide, staggered for stream cards

## What This Does NOT Do

- Does not change Focus Mode
- Does not implement Executive Overview
- Does not add AI chat functionality
- Does not add real pipeline filtering (pipeline type chip is present but counts will be 0 until pipeline items flow through work_items)
- Does not add navigation links to the filter panel

