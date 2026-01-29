
# Pipeline Tab UX & Functionality Enhancements

## Overview

Enhance the Pipeline tab to function as a high-signal command surface for deal flow management. This plan focuses on improving scanability, attention signaling, and flow into deeper deal work while strictly preserving existing structure, stages, and navigation patterns.

## Current State Summary

- **5 Pipeline Stages**: New, Passed, To Share, Interesting, Pearls (plus Active sidebar)
- **3 View Modes**: Kanban, List, Grid
- **Existing Card Info**: Company name, round badge, sector badge, raise amount, close date, next steps preview
- **Existing Actions**: Top of Mind toggle (star), website link, drag-to-move
- **Existing Filters**: Search, Round dropdown, Sector dropdown
- **Summary Tiles**: Total, Active, Passed, To Share, Interesting, Pearls, New (already clickable)

## Architecture

The implementation enhances existing components without introducing new layout paradigms:

```text
+------------------------------------------------------------------------+
|  Pipeline                    [Search] [Round▼] [Sector▼]               |
|                              [Needs Attention] [Top of Mind] [Stale]   |
+------------------------------------------------------------------------+
|                                                                        |
|  New (4)                    | Interesting (3)        | Pearls (2)      |
|  "1 stale, 2 open tasks"    | "1 closing soon"       | "All clear"     |
|  ─────────────────────────  | ─────────────────────  | ───────────────  |
|  ┌──────────────────────┐   | ┌────────────────────┐ | ┌──────────────┐ |
|  │ CompanyName    [★][↗]│   | │ CompanyName   [★][↗]│ | │ CompanyName  │ |
|  │ [Seed] [Payments]    │   | │ [Series A] [Wealth]│ | │ [Seed] [Fin] │ |
|  │ $3M • Mar 2026       │   | │ $5M • Apr 2026     │ | │ $2M • May    │ |
|  │ ─────────────────────│   | │ ────────────────────│ | │ ─────────────│ |
|  │ ⚠ Stale • 2 tasks    │   | │ 📋 1 task • 3d ago │ | │ ✓ Next step  │ |
|  └──────────────────────┘   | └────────────────────┘ | └──────────────┘ |
|                                                                        |
+------------------------------------------------------------------------+
```

## Implementation Steps

### Step 1: Enhanced Pipeline Card Component

**File: `src/components/pipeline/PipelineCard.tsx`**

Standardize card anatomy with new attention row:

```
Header Row:
├── Company name (left)
└── Actions (right): Star toggle, Open full page icon

Metadata Row:
├── Round badge
└── Sector badge

Deal Facts Row:
├── Raise amount
└── Close date

Attention Row (NEW - conditional):
├── Open tasks count (if > 0): "2 tasks" with task icon
├── Last touch indicator: "12d ago" / "3d ago"
├── Next step exists: small dot/chip if next_steps present
├── Stale badge: amber "Stale" badge if no activity > 14 days
└── Overdue indicator: red dot/badge if any linked task overdue
```

**New Props & Data Requirements:**
- Add `openTaskCount?: number` and `hasOverdueTasks?: boolean` props
- Add `lastInteractionAt?: string` for stale/last touch calculation
- These will be computed at the page level and passed down

**Visual Changes:**
- Slightly reduce border saturation for stage colors
- Attention signals (stale, overdue) get stronger color emphasis
- Increase card padding-bottom slightly for attention row
- Add "Open full page" icon (ArrowUpRight) always visible next to star

### Step 2: Create Pipeline Attention Helper Functions

**New File: `src/lib/pipeline/pipelineAttentionHelpers.ts`**

Utility functions for computing attention signals:

```typescript
interface PipelineCardAttention {
  isStale: boolean;              // No activity > 14 days
  daysSinceTouch: number | null;
  hasOverdueTasks: boolean;
  openTaskCount: number;
  hasNextSteps: boolean;
  isClosingSoon: boolean;        // Close date within 14 days
  needsAttention: boolean;       // Composite: stale OR overdue OR closing soon
}

function computeCardAttention(
  company: PipelineCompany,
  tasks: PipelineTask[]
): PipelineCardAttention

function computeColumnSummary(
  companies: PipelineCompany[],
  allTasks: PipelineTask[]
): ColumnSummary
```

### Step 3: Aggregate Pipeline Tasks Hook

**New File: `src/hooks/usePipelineTasksAggregate.ts`**

Fetch all tasks linked to pipeline companies for aggregation:

```typescript
function usePipelineTasksAggregate(companyIds: string[]) {
  // Query tasks where pipeline_company_id IN companyIds
  // Returns map of companyId -> { openCount, hasOverdue, tasks[] }
}
```

This hook efficiently fetches task data for all visible companies in one query rather than per-card queries.

### Step 4: Enhanced Kanban Column Headers

**File: `src/components/pipeline/PipelineKanbanView.tsx`**

Update `KanbanColumn` component:

```
Current:
  <h3>New</h3>
  <p>4 companies</p>

Enhanced:
  <h3>New</h3>
  <p>4 companies</p>
  <p className="text-xs text-muted-foreground">1 stale • 2 open tasks</p>
```

**Column Summary Logic:**
- Count stale companies in column
- Count total open tasks across column
- Count companies closing soon
- Show most urgent signal first

**Quick Controls (Column Hover):**
- "Show needs attention only" toggle
- Sort dropdown: Last touched, Closing soon, Raise amount
- Apply only to that column via local state

### Step 5: Enhanced Filter Bar (PipelineToolbar)

**File: `src/components/pipeline/PipelineToolbar.tsx`**

Add toggle-style filter pills after existing filters:

```
[Search...] [Round▼] [Sector▼]    [Needs Attention] [Top of Mind] [Stale]    [View Toggle]
```

**New Filter State:**
```typescript
interface PipelineFilters {
  search: string;
  rounds: RoundEnum[];
  sectors: SectorEnum[];
  // New attention filters (toggle-style)
  needsAttention?: boolean;
  topOfMindOnly?: boolean;
  staleOnly?: boolean;
}
```

**Filter Logic:**
- `needsAttention`: Show only companies that are stale OR have overdue tasks OR closing soon
- `topOfMindOnly`: Show only `is_top_of_mind === true`
- `staleOnly`: Show only companies with no interaction > 14 days

### Step 6: Actionable Summary Tiles

**File: `src/components/pipeline/SummaryBox.tsx`**

Tiles are already clickable. Enhance with sublabels:

```
Current:
  [5] Active

Enhanced:
  [5] Active
  2 need follow-up
```

**Sublabel Logic per Tile:**
- Active: Count with overdue tasks or stale
- Passed: (no sublabel needed)
- To Share: Count stale
- Interesting: Count with tasks
- Pearls: Count closing soon
- New: Count needing review (no tasks created yet)

### Step 7: Inline Card Actions Menu

**File: `src/components/pipeline/PipelineCard.tsx`**

Add kebab menu (MoreHorizontal) on hover with quick actions:

```
[⋮] Menu Items:
├── Add task
├── Log note
├── Move to... (submenu with stages)
├── ─────────────
└── Mark as passed
```

**Implementation:**
- Use existing DropdownMenu pattern
- On "Add task": Open AddTaskDialog with company pre-filled
- On "Log note": Open quick note composer (reuse from Deal Room)
- On "Move to": Submenu with all stages except current
- On "Mark as passed": Direct status update with confirmation

### Step 8: Enhanced List View

**File: `src/components/pipeline/PipelineListView.tsx`**

Add attention columns to table:

```
| Company | Round | Status | Sector | Raise | Close | Tasks | Last Touch | Actions |
```

- **Tasks column**: Open task count with overdue indicator
- **Last Touch column**: Relative timestamp, red if stale
- **Actions column**: Star, kebab menu, open full page

### Step 9: Visual Polish Pass

**Files: Multiple**

- Reduce stage border saturation by 10-15% (e.g., `border-slate-400` → `border-slate-300`)
- Attention badges use stronger colors (amber-500 for stale, red-500 for overdue)
- Increase vertical spacing between cards: `space-y-4` → `space-y-5`
- Reduce internal card padding slightly: `p-4` → `p-3.5`
- Ensure consistent icon sizes (h-3.5 w-3.5 for inline, h-4 w-4 for buttons)

## File Summary

| File | Action | Description |
|------|--------|-------------|
| `src/lib/pipeline/pipelineAttentionHelpers.ts` | Create | Utility functions for computing attention signals |
| `src/hooks/usePipelineTasksAggregate.ts` | Create | Hook to fetch all pipeline tasks efficiently |
| `src/components/pipeline/PipelineCard.tsx` | Modify | Add attention row, inline actions menu, open full page icon |
| `src/components/pipeline/PipelineKanbanView.tsx` | Modify | Enhanced column headers with summaries and quick controls |
| `src/components/pipeline/PipelineToolbar.tsx` | Modify | Add toggle-style attention filters |
| `src/components/pipeline/SummaryBox.tsx` | Modify | Add sublabels to tiles |
| `src/components/pipeline/PipelineListView.tsx` | Modify | Add tasks and last touch columns |
| `src/components/pipeline/PipelineGridView.tsx` | Modify | Ensure cards show attention signals |
| `src/types/pipeline.ts` | Modify | Extend PipelineFilters interface |
| `src/pages/Pipeline.tsx` | Modify | Wire up aggregate hooks and pass attention data |

## Data Flow

```text
Pipeline.tsx
├── usePipeline() → companies[]
├── usePipelineTasksAggregate(companyIds) → tasksMap
├── Compute attention for each company
└── Pass to views

PipelineKanbanView
├── Receive companies with attention data
├── Compute column summaries
└── Render enhanced headers + cards

PipelineCard
├── Receive company + attention props
├── Render attention row conditionally
└── Render inline actions menu
```

## New Type Definitions

```typescript
// src/types/pipeline.ts additions

interface PipelineCardAttention {
  isStale: boolean;
  daysSinceTouch: number | null;
  hasOverdueTasks: boolean;
  openTaskCount: number;
  hasNextSteps: boolean;
  isClosingSoon: boolean;
  needsAttention: boolean;
}

interface EnhancedPipelineCompany extends PipelineCompany {
  attention: PipelineCardAttention;
}

interface PipelineFilters {
  search: string;
  rounds: RoundEnum[];
  sectors: SectorEnum[];
  needsAttention?: boolean;
  topOfMindOnly?: boolean;
  staleOnly?: boolean;
}

interface ColumnSummary {
  staleCount: number;
  openTaskCount: number;
  closingSoonCount: number;
  summaryText: string; // e.g., "1 stale • 2 tasks"
}
```

## Acceptance Criteria

1. **Card Attention Signals**: Cards display stale badge (amber), overdue indicator (red), task count, last touch timestamp, and next steps indicator
2. **Column Summaries**: Each Kanban column header shows aggregated attention signals (e.g., "2 stale • 5 tasks")
3. **Column Quick Controls**: Hover reveals "Show needs attention" toggle and sort options
4. **Filter Bar**: Three new toggle pills (Needs Attention, Top of Mind, Stale) filter the entire view
5. **Actionable Tiles**: Summary tiles show sublabels and filter on click
6. **Inline Actions**: Kebab menu on card hover with Add task, Log note, Move to, Mark as passed
7. **Open Full Page**: Always-visible icon to navigate to Deal Room
8. **Visual Polish**: Reduced border saturation, stronger attention colors, improved spacing
9. **List View**: Additional columns for tasks and last touch
10. **Existing Functionality**: All current features (drag-drop, filters, modal edit) continue working

## Implementation Order

1. **Phase 1 - Foundation**: Create attention helpers + aggregate tasks hook
2. **Phase 2 - Card Enhancements**: Add attention row + inline actions to PipelineCard
3. **Phase 3 - Column Headers**: Enhanced summaries + quick controls in KanbanView
4. **Phase 4 - Filter Bar**: Toggle-style attention filters in Toolbar
5. **Phase 5 - Summary Tiles**: Sublabels in SummaryBox
6. **Phase 6 - List View**: Additional columns
7. **Phase 7 - Visual Polish**: Color and spacing adjustments

## Performance Considerations

- Aggregate tasks hook uses single query with `IN` clause for all company IDs
- Attention computations are memoized at Pipeline.tsx level
- Column summaries computed only when companies change
- No additional API calls per card
