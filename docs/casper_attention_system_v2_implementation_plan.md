# Casper Attention System v2 — Implementation Plan

**Created**: 2026-02-03
**Status**: Approved spec, ready for implementation
**Approach**: Clean rebuild of surfaces, incremental data migration

---

## Table of Contents

1. [Decision Log](#1-decision-log)
2. [Phase 0: Data Migration](#2-phase-0-data-migration)
3. [Phase 1: Attention Queue](#3-phase-1-attention-queue)
4. [Phase 2: Triage Queue](#4-phase-2-triage-queue)
5. [Phase 3: Dashboard Redesign](#5-phase-3-dashboard-redesign)
6. [Phase 4: Projection & Threading](#6-phase-4-projection--threading)
7. [Phase 5: AI Suggestions](#7-phase-5-ai-suggestions)
8. [Phase 6: Pipeline Nudges & Polish](#8-phase-6-pipeline-nudges--polish)
9. [Phase 7: Decommission Focus](#9-phase-7-decommission-focus)
10. [File Index](#10-file-index)

---

## 1. Decision Log

All decisions from the spec interview, locked in and referenced throughout.

| # | Decision | Detail |
|---|----------|--------|
| 1 | Inbox stays | Dedicated email surface. Triage is the front door; Inbox is for deeper context. |
| 2 | Dashboard = briefing | Snapshotted start-of-day briefing. No action resolution. Separate from Attention. |
| 3 | Single `work_items` table | Add `queue` column (`triage` \| `attention` \| `none`). Enforced by RPCs. |
| 4 | Rich triage drawers | Keep source-specific drawers, reframed as triage context. |
| 5 | Ranked Attention | Urgency bands (critical/high/medium/low) primary, importance secondary (0.75/0.25). |
| 6 | Email projection | First-class lifecycle event. New work_item for task/commitment, email → `queue='none'`. |
| 7 | Commitments = one row | Supporting tasks in drawer, not separate Attention rows. |
| 8 | Passive AI suggestions | Pre-filled triggers and metadata at launch. Background classification as fast follow. |
| 9 | Pipeline via staleness | Staleness nudges and approaching close dates → Triage. |
| 10 | Snooze → Attention | Snoozed items always return to Attention regardless of origin queue. |
| 11 | Unlinked notes → Triage | Must be linked to entity or promoted to task/commitment. |
| 12 | Reading items → Triage | All new reading items pass through Triage once. |
| 13 | Nonnegotiables = ambient | Stay on Dashboard side panel only. Not part of attention system. |
| 14 | Clean surface rebuild | New page components for Triage and Attention. Data layer evolves incrementally. |

---

## 2. Phase 0: Data Migration

**Goal**: Extend `work_items` to support the two-queue state machine without breaking existing functionality.

### 2.1 Database Migration

**File**: `supabase/migrations/YYYYMMDD_attention_system_v2_schema.sql`

```sql
-- 1. Add queue column
ALTER TABLE work_items
  ADD COLUMN queue TEXT NOT NULL DEFAULT 'triage'
  CHECK (queue IN ('triage', 'attention', 'none'));

-- 2. Add attention triggers (JSONB for flexibility)
-- Structure: [{ trigger_type, trigger_at, trigger_source, trigger_confidence }]
ALTER TABLE work_items
  ADD COLUMN attention_triggers JSONB DEFAULT '[]'::jsonb;

-- 3. Add thread identity
ALTER TABLE work_items
  ADD COLUMN thread_key TEXT;

-- 4. Add projection provenance
ALTER TABLE work_items
  ADD COLUMN superseded_by_work_item_id UUID REFERENCES work_items(id);

-- 5. Add resolution tracking
ALTER TABLE work_items
  ADD COLUMN resolution_type TEXT
  CHECK (resolution_type IN ('completed', 'projected', 'dismissed', 'archived'));

-- 6. Add priority score column if not exists (for new scoring)
-- (priority_score already exists as nullable number)

-- 7. Add urgency band for legible ranking
ALTER TABLE work_items
  ADD COLUMN urgency_band TEXT
  CHECK (urgency_band IN ('critical', 'high', 'medium', 'low'));

-- 8. Indexes
CREATE INDEX idx_work_items_queue ON work_items(created_by, queue)
  WHERE queue IN ('triage', 'attention');

CREATE INDEX idx_work_items_thread_key ON work_items(thread_key)
  WHERE thread_key IS NOT NULL;

CREATE INDEX idx_work_items_superseded ON work_items(superseded_by_work_item_id)
  WHERE superseded_by_work_item_id IS NOT NULL;

-- 9. Backfill existing items into queues
-- Items with active triggers → attention
-- Everything else → triage
-- Trusted/ignored → none

UPDATE work_items SET queue = 'none'
  WHERE status IN ('trusted', 'ignored');

UPDATE work_items SET queue = 'attention'
  WHERE status IN ('needs_review', 'enriched_pending')
  AND source_type = 'commitment'
  AND source_id IN (
    SELECT id::text FROM commitments
    WHERE status = 'open'
    AND (due_at IS NOT NULL OR expected_by IS NOT NULL)
  );

UPDATE work_items SET queue = 'attention'
  WHERE status IN ('needs_review', 'enriched_pending')
  AND source_type = 'task'
  AND source_id IN (
    SELECT id::text FROM tasks
    WHERE completed != true
    AND scheduled_for IS NOT NULL
  );

-- Snoozed items: they'll return to attention when snooze expires
UPDATE work_items SET queue = 'attention'
  WHERE status = 'snoozed';

-- Everything still needs_review/enriched_pending without triggers → triage
UPDATE work_items SET queue = 'triage'
  WHERE queue = 'triage'
  AND status IN ('needs_review', 'enriched_pending');
```

### 2.2 RPC Gatekeepers

**File**: `supabase/migrations/YYYYMMDD_attention_system_v2_rpcs.sql`

```sql
-- Promote item from triage to attention
-- Requires at least one attention trigger
CREATE OR REPLACE FUNCTION promote_to_attention(
  p_work_item_id UUID,
  p_triggers JSONB,
  p_user_id UUID
) RETURNS void AS $$
BEGIN
  IF p_triggers IS NULL OR jsonb_array_length(p_triggers) = 0 THEN
    RAISE EXCEPTION 'Cannot promote to attention without at least one trigger';
  END IF;

  UPDATE work_items SET
    queue = 'attention',
    attention_triggers = p_triggers,
    status = 'needs_review',
    updated_at = now()
  WHERE id = p_work_item_id
    AND created_by = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Demote item from attention back to triage
CREATE OR REPLACE FUNCTION demote_to_triage(
  p_work_item_id UUID,
  p_reason TEXT,
  p_user_id UUID
) RETURNS void AS $$
BEGIN
  UPDATE work_items SET
    queue = 'triage',
    attention_triggers = '[]'::jsonb,
    status = 'needs_review',
    updated_at = now()
  WHERE id = p_work_item_id
    AND created_by = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Resolve a work item (exits both queues)
CREATE OR REPLACE FUNCTION resolve_work_item(
  p_work_item_id UUID,
  p_resolution_type TEXT,
  p_user_id UUID
) RETURNS void AS $$
BEGIN
  UPDATE work_items SET
    queue = 'none',
    status = CASE
      WHEN p_resolution_type = 'completed' THEN 'trusted'
      WHEN p_resolution_type = 'dismissed' THEN 'ignored'
      WHEN p_resolution_type = 'projected' THEN 'trusted'
      WHEN p_resolution_type = 'archived' THEN 'ignored'
      ELSE 'trusted'
    END,
    resolution_type = p_resolution_type,
    updated_at = now()
  WHERE id = p_work_item_id
    AND created_by = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Snooze a work item (always returns to attention)
CREATE OR REPLACE FUNCTION snooze_work_item(
  p_work_item_id UUID,
  p_until TIMESTAMPTZ,
  p_user_id UUID
) RETURNS void AS $$
BEGIN
  UPDATE work_items SET
    queue = 'attention',
    status = 'snoozed',
    snooze_until = p_until,
    attention_triggers = COALESCE(attention_triggers, '[]'::jsonb) ||
      jsonb_build_array(jsonb_build_object(
        'trigger_type', 'time',
        'trigger_at', p_until,
        'trigger_source', 'snooze'
      )),
    updated_at = now()
  WHERE id = p_work_item_id
    AND created_by = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Project email into task/commitment
CREATE OR REPLACE FUNCTION project_work_item(
  p_source_work_item_id UUID,
  p_new_work_item_id UUID,
  p_thread_key TEXT,
  p_user_id UUID
) RETURNS void AS $$
BEGIN
  -- Mark source as projected
  UPDATE work_items SET
    queue = 'none',
    status = 'trusted',
    resolution_type = 'projected',
    superseded_by_work_item_id = p_new_work_item_id,
    thread_key = p_thread_key,
    updated_at = now()
  WHERE id = p_source_work_item_id
    AND created_by = p_user_id;

  -- Set thread key on new item
  UPDATE work_items SET
    thread_key = p_thread_key,
    updated_at = now()
  WHERE id = p_new_work_item_id
    AND created_by = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2.3 TypeScript Types Update

**File**: `src/types/workItem.ts` (new)

```typescript
export type WorkItemQueue = 'triage' | 'attention' | 'none';
export type UrgencyBand = 'critical' | 'high' | 'medium' | 'low';
export type ResolutionType = 'completed' | 'projected' | 'dismissed' | 'archived';

export interface AttentionTrigger {
  trigger_type: 'time' | 'social' | 'explicit';
  trigger_at?: string;        // ISO timestamp
  trigger_source?: string;    // e.g., 'due_at', 'expected_by', 'vip_sender', 'snooze', 'user_pinned'
  trigger_confidence?: number; // 0-1, for AI-suggested triggers
}

export interface WorkItem {
  id: string;
  created_by: string;
  source_type: WorkItemSourceType;
  source_id: string;
  status: WorkItemStatus;
  queue: WorkItemQueue;
  reason_codes: string[];
  priority: number;
  priority_score: number | null;
  urgency_band: UrgencyBand | null;
  attention_triggers: AttentionTrigger[];
  thread_key: string | null;
  superseded_by_work_item_id: string | null;
  resolution_type: ResolutionType | null;
  snooze_until: string | null;
  last_touched_at: string | null;
  reviewed_at: string | null;
  trusted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  source_title?: string;
  source_snippet?: string;
  primary_link?: {
    target_type: string;
    target_id: string;
    link_reason: string | null;
  } | null;
  one_liner?: string | null;
}

export type WorkItemSourceType = 'email' | 'calendar_event' | 'task' | 'note' | 'reading' | 'commitment';
export type WorkItemStatus = 'needs_review' | 'enriched_pending' | 'trusted' | 'snoozed' | 'ignored';
```

### 2.4 Update Backfill Logic

**File**: `src/hooks/useBackfillWorkItems.ts` (modify)

Changes:
- New items default to `queue='triage'`
- Commitments with `due_at` or `expected_by` → `queue='attention'` with triggers populated
- Tasks with `scheduled_for` → `queue='attention'` with time trigger
- Snoozed items → `queue='attention'` (per decision #10)
- Add `thread_key` generation for new items: `{source_type}:{source_id}`

### 2.5 Update Supabase Types

**File**: `src/integrations/supabase/types.ts` (modify — or regenerate from schema)

Add new columns to `work_items` Row/Insert/Update types:
- `queue`, `attention_triggers`, `thread_key`, `superseded_by_work_item_id`, `resolution_type`, `urgency_band`

---

## 3. Phase 1: Attention Queue

**Goal**: Ship `/attention` as the sacred execution surface. This is the highest-trust surface in the system.

### 3.1 Priority Scoring v2

**File**: `src/lib/priority/priorityScoringV2.ts` (new)

```
Urgency bands (primary axis — 0.75 weight):
  critical: overdue OR due today OR meeting within 2 hours OR snooze returning now
  high:     due in 1-2 days OR snooze returns today
  medium:   due in 3-7 days
  low:      no time trigger but has explicit 'important' trigger

Within-band scoring (secondary — 0.25 weight):
  commitment direction: owed_by_me > owed_to_me
  VIP tier boost: +0.15
  user pinned/important: +0.1
  implied_urgency boost: asap|today = +0.1

Tie-breakers (deterministic):
  1. Overdue first
  2. Commitments owed_by_me
  3. VIP
  4. Effort (for "quick wins" sort mode)

Score = 0.75 * urgency_score + 0.25 * importance_score
```

Key changes from v1:
- Weight shifts from 0.6/0.4 to 0.75/0.25 (more urgency-heavy)
- Urgency bands are explicit and visible in UI
- Score is trigger-aware (uses `attention_triggers` to compute urgency)
- Band assignment stored on `work_items.urgency_band` for query efficiency

### 3.2 Attention Queue Hook

**File**: `src/hooks/useAttentionQueue.ts` (new)

```typescript
interface AttentionQueueItem extends WorkItem {
  urgencyBand: UrgencyBand;
  priorityScore: number;
  triggerChips: TriggerChip[];  // For UI display
  effortEstimate: EffortEstimate;
  // Source-specific data (loaded on demand or joined)
  sourceData?: InboxItem | Task | Commitment | CalendarEvent | ReadingItem | Note;
}

interface TriggerChip {
  label: string;       // "Due today", "VIP", "Snooze return", "Meeting in 1h"
  type: 'time' | 'social' | 'explicit';
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface AttentionSortMode {
  mode: 'recommended' | 'due_soon' | 'quick_wins' | 'by_person' | 'by_company';
}

export function useAttentionQueue(): {
  items: AttentionQueueItem[];
  counts: { total: number; byBand: Record<UrgencyBand, number> };
  isLoading: boolean;
  isEmpty: boolean;          // The "you're clear" signal
  sortMode: AttentionSortMode;
  setSortMode: (mode: AttentionSortMode) => void;
  refetch: () => Promise<unknown>;
}
```

Query:
```sql
SELECT * FROM work_items
WHERE created_by = $userId
  AND queue = 'attention'
  AND (status != 'snoozed' OR snooze_until <= now())
ORDER BY urgency_band_sort, priority_score DESC
```

Stable ordering: Re-rank on page load, after completing an item, or after explicit refresh. Not on every render.

### 3.3 Attention Queue Actions Hook

**File**: `src/hooks/useAttentionActions.ts` (new)

```typescript
export function useAttentionActions(): {
  // Core actions (available for all source types)
  resolve: (workItemId: string) => Promise<void>;       // → resolve_work_item RPC
  snooze: (workItemId: string, until: Date) => Promise<void>;  // → snooze_work_item RPC
  demoteToTriage: (workItemId: string, reason: string) => Promise<void>;  // → demote_to_triage RPC

  // Source-specific actions (delegated to existing hooks)
  completeTask: (taskId: string, workItemId: string) => Promise<void>;
  completeCommitment: (commitmentId: string, workItemId: string) => Promise<void>;
  delegateCommitment: (commitmentId: string, workItemId: string, toPersonId: string, toName: string) => Promise<void>;
  markWaitingOn: (commitmentId: string) => Promise<void>;

  // Email-specific
  markEmailReplied: (inboxItemId: string, workItemId: string) => Promise<void>;
}
```

### 3.4 Attention Page Component

**File**: `src/pages/AttentionQueue.tsx` (new)

Layout:
```
┌─────────────────────────────────────────────────┐
│ Attention                          Sort: [v]    │
│ 8 items need your attention                     │
├─────────────────────────────────────────────────┤
│                                                 │
│ ── CRITICAL ──────────────────────────────────  │
│ [commitment] Intro to Sarah by Fri  [Due today] │
│ [email]      Reply to LP update     [Overdue]   │
│                                                 │
│ ── HIGH ──────────────────────────────────────  │
│ [task]       Send updated deck      [Due Tue]   │
│ [commitment] Follow up on term...   [VIP]       │
│                                                 │
│ ── MEDIUM ────────────────────────────────────  │
│ [task]       Review portfolio co... [Due Fri]   │
│ ...                                             │
│                                                 │
├─────────────────────────────────────────────────┤
│        (empty state: "You're clear.")           │
└─────────────────────────────────────────────────┘
```

Components to build:
- `src/pages/AttentionQueue.tsx` — Page shell, sort controls, empty state
- `src/components/attention/AttentionItemRow.tsx` — Single item row with trigger chips, source icon, quick actions
- `src/components/attention/AttentionEmptyState.tsx` — "You're clear" state with ambient context (triage count, next calendar event)
- `src/components/attention/AttentionBandHeader.tsx` — Band separator ("CRITICAL", "HIGH", etc.)

Drawer components: **Reuse existing Focus drawers** (`FocusInboxDrawer`, `FocusTaskDrawer`, `FocusCommitmentDrawer`, etc.) but import them into the new page. Rename later if needed. The drawers' action callbacks will wire to `useAttentionActions` instead of `useFocusTriageActions`.

Empty state content:
```
"You're clear."
Triage: 12 items
Next event: Team standup in 2h
```

### 3.5 Route & Navigation

**File**: `src/App.tsx` (modify)

```typescript
// Add new route
<Route path="/attention" element={<AttentionQueue />} />
// Keep /focus for now (decommissioned in Phase 7)
```

**File**: `src/components/layout/NavSidebar.tsx` (modify)

```typescript
// Replace Focus nav item:
// Before: { icon: Crosshair, path: "/focus", label: "Focus" }
// After:  { icon: Zap, path: "/attention", label: "Attention" }
// Add Triage below it (Phase 2):
//         { icon: InboxIcon, path: "/triage", label: "Triage" }
```

---

## 4. Phase 2: Triage Queue

**Goal**: Ship `/triage` as the low-pressure workbench for underspecified inputs.

### 4.1 Triage Queue Hook

**File**: `src/hooks/useTriageQueue.ts` (new)

```typescript
interface TriageQueueItem extends WorkItem {
  ageInTriage: number;          // Days since created_at
  isStale: boolean;             // > N days undecided
  sourceData?: InboxItem | Task | Commitment | CalendarEvent | ReadingItem | Note;
}

interface TriageFilters {
  sourceTypes: WorkItemSourceType[];
  staleOnly: boolean;
}

interface TriageCounts {
  total: number;
  bySource: Record<WorkItemSourceType, number>;
  staleCount: number;
}

export function useTriageQueue(): {
  items: TriageQueueItem[];
  counts: TriageCounts;
  isLoading: boolean;
  isEmpty: boolean;
  filters: TriageFilters;
  toggleSourceType: (type: WorkItemSourceType) => void;
  toggleStaleOnly: () => void;
  clearFilters: () => void;
  refetch: () => Promise<unknown>;
}
```

Query:
```sql
SELECT * FROM work_items
WHERE created_by = $userId
  AND queue = 'triage'
ORDER BY created_at DESC  -- Newest first by default
```

Ordering: Newest first (default). Optional "Worth triaging" view sorted by inferred importance + age. Never labeled "priority."

### 4.2 Triage Actions Hook

**File**: `src/hooks/useTriageActions.ts` (new)

```typescript
export function useTriageActions(): {
  // Promotion (requires trigger)
  promoteToAttention: (workItemId: string, triggers: AttentionTrigger[]) => Promise<void>;

  // Resolution
  dismiss: (workItemId: string) => Promise<void>;         // queue='none', no trigger needed
  markReference: (workItemId: string) => Promise<void>;    // queue='none', kept as reference

  // Projection (email → task/commitment)
  projectToTask: (params: {
    workItemId: string;
    taskContent: string;
    taskPriority?: string;
    scheduledFor?: string;          // If set, task auto-gets time trigger → attention
    projectId?: string;
    keepInTriage?: boolean;         // Default false
  }) => Promise<void>;

  projectToCommitment: (params: {
    workItemId: string;
    title: string;
    content?: string;
    direction: 'owed_by_me' | 'owed_to_me';
    personName?: string;
    personId?: string;
    dueAt?: string;
    expectedBy?: string;
    impliedUrgency?: string;
    keepInTriage?: boolean;         // Default false
  }) => Promise<void>;

  // Snooze (returns to attention per decision #10)
  snooze: (workItemId: string, until: Date) => Promise<void>;

  // Entity linking
  linkEntity: (params: {
    workItemId: string;
    sourceType: string;
    sourceId: string;
    targetType: 'company' | 'project';
    targetId: string;
  }) => Promise<void>;

  // Batch actions
  batchSnooze: (workItemIds: string[], until: Date) => Promise<void>;
  batchDismiss: (workItemIds: string[]) => Promise<void>;

  // Reuse existing source-specific actions
  completeCommitment: (commitmentId: string, workItemId: string) => Promise<void>;
  delegateCommitment: (...) => Promise<void>;
  // ... same commitment actions as current Focus drawers
}
```

Projection flow (email → task):
1. Create task row via `useTasks().createTask()`
2. Create new work_item for task with `queue='attention'` if trigger exists, else `queue='triage'`
3. Generate `thread_key`: `thread:{uuid}`
4. Call `project_work_item` RPC to mark email work_item as superseded
5. Log `inbox_activity` entry with `action_type='projected_to_task'`
6. Invalidate relevant query keys

### 4.3 Triage Page Component

**File**: `src/pages/TriageQueue.tsx` (new)

Layout:
```
┌──────────────────────────────────────────────────────────┐
│ Triage                                    12 items       │
│ Process when you have energy                             │
├────────────────┬─────────────────────────────────────────┤
│ Summary        │                                         │
│                │ [email] LP update from Acme  [new]      │
│ Email: 5       │ [note]  Meeting notes - unlinked [3d]   │
│ Tasks: 3       │ [reading] Article on... [new]           │
│ Notes: 2       │ [commitment] Incomplete: ... [stale]    │
│ Reading: 2     │ [task] Quick add: call... [new]         │
│                │ ...                                     │
│ Stale: 3       │                                         │
│                │                                         │
│ [Batch actions]│                                         │
├────────────────┴─────────────────────────────────────────┤
```

Components to build:
- `src/pages/TriageQueue.tsx` — Page shell, filters, batch controls
- `src/components/triage/TriageItemRow.tsx` — Item row with age badge, source icon, stale indicator
- `src/components/triage/TriageSummaryPanel.tsx` — Left sidebar with counts by source, stale count
- `src/components/triage/TriageEmptyState.tsx` — "Triage is clear" state
- `src/components/triage/TriageBatchBar.tsx` — Batch action bar (snooze all, dismiss selected)

Drawer components: **Reuse existing Focus drawers** with modified action callbacks wired to `useTriageActions`. The drawers open the same source-specific detail views but now include:
- "Promote to Attention" button (requires selecting a trigger)
- "Dismiss" / "Mark Reference" options
- "Project to Task" / "Project to Commitment" for emails

Stale indicator:
- Items in Triage > 5 days get a soft "Still undecided" badge
- Not urgency — just visibility

### 4.4 Route & Navigation

**File**: `src/App.tsx` (modify)

```typescript
<Route path="/triage" element={<TriageQueue />} />
```

**File**: `src/components/layout/NavSidebar.tsx` (modify)

Sidebar order becomes:
```
Workspace:
  Dashboard
  Attention    (Zap icon)
  Triage       (Filter icon or ListChecks icon)
  Inbox
  Tasks
  Projects
  Obligations
  Pipeline
  Portfolio
```

Triage nav item should show count badge: `Triage: 12`

---

## 5. Phase 3: Dashboard Redesign

**Goal**: Transform Dashboard from a summary hub into a snapshotted start-of-day briefing.

### 5.1 Dashboard Briefing Data

**File**: `src/hooks/useDashboardBriefing.ts` (new)

```typescript
interface DashboardBriefing {
  snapshotAt: string;                    // "As of 9:14am"
  attentionCount: number;
  triageCount: number;
  triageOldestDays: number;

  // "Am I at risk?"
  overdueCommitments: number;
  commitmentsDueToday: number;
  atRiskObligations: Commitment[];       // Max 5

  // "What's coming today?"
  meetingsToday: CalendarEvent[];
  meetingsPrepRequired: number;          // Events with linked tasks/commitments

  // "What carried over?"
  snoozeReturningToday: number;
  itemsWaitingOnOthers: number;

  // "Quietly escalating?"
  staleWaitingOns: number;              // Waiting > N days
  pipelineNudges: number;              // Companies needing attention
}
```

This hook runs once on page load and caches the result. It does NOT live-update (per decision: Dashboard is snapshotted).

### 5.2 Dashboard Page Redesign

**File**: `src/pages/Dashboard.tsx` (modify)

New layout:
```
┌─────────────────────────────────────────┬──────────────┐
│ Good morning, Harrison                  │  Calendar    │
│ As of 9:14am                            │  sidebar     │
│                                         │  (unchanged) │
│ ── TODAY AT A GLANCE ─────────────────  │              │
│ 3 meetings today (1 needs prep)         │  Events...   │
│ 5 items in Attention                    │              │
│ 2 commitments due today                 │  Nonneg...   │
│ 1 snooze returning                      │              │
│                                         │              │
│ ── SYSTEM SIGNALS ────────────────────  │              │
│ ⚠ 3 commitments at risk     [→]        │              │
│   5 items waiting on others  [→]        │              │
│   12 items in triage (oldest: 5d) [→]   │              │
│                                         │              │
│ ── AMBIENT CONTEXT ───────────────────  │              │
│ Pipeline: 2 companies need check-in     │              │
│ Reading: 4 items queued                 │              │
│                                         │              │
└─────────────────────────────────────────┴──────────────┘
```

Key changes:
- Remove `DashboardPrioritySection` (replaced by Attention route)
- Remove `InboxPanel` (Inbox is its own surface; triage handles front-door)
- Remove `TodayTasksSection` (tasks are in Attention or Triage)
- Remove `CommitmentsPanel` as a separate section (folded into "System Signals")
- Keep `ObligationsPanel` but refactor as "At Risk" section within briefing
- Keep `CalendarSidebar` unchanged (with nonnegotiables)
- Keep `CompaniesCommandPane` or fold into "Ambient Context"
- Add "As of {time}" snapshot header
- All items are **navigational** — clicking goes to Attention, Triage, Obligations, etc. No inline resolution.

Components to modify:
- `src/pages/Dashboard.tsx` — New layout orchestration
- `src/components/dashboard/DashboardMainContent.tsx` — Major restructure into briefing sections
- `src/components/dashboard/DashboardHeroBand.tsx` — Simplify to greeting + snapshot time + key counts
- `src/components/dashboard/DashboardBriefingSection.tsx` (new) — "Today at a Glance"
- `src/components/dashboard/DashboardSignalsSection.tsx` (new) — "System Signals" with navigational links
- `src/components/dashboard/DashboardAmbientSection.tsx` (new) — "Ambient Context"

Components to remove/deprecate:
- `src/components/dashboard/DashboardPrioritySection.tsx` — No longer needed
- `src/components/dashboard/InboxPanel.tsx` — No longer needed
- `src/components/dashboard/TodayTasksSection.tsx` — If it exists as separate

---

## 6. Phase 4: Projection & Threading

**Goal**: Implement the email → task/commitment projection flow with thread identity and bidirectional links.

### 6.1 Projection Flow

When user clicks "Create Task" or "Create Commitment" from an email in Triage:

1. **Create the target object** (task or commitment) using existing hooks
2. **Create a new work_item** for the target:
   - `queue='attention'` if target has a trigger (due date, expected_by)
   - `queue='triage'` if target is incomplete
3. **Generate thread_key**: `thread:{uuidv4()}`
4. **Call `project_work_item` RPC**:
   - Source email work_item → `queue='none'`, `resolution_type='projected'`, `superseded_by=new_work_item_id`
   - Both items get same `thread_key`
5. **Log inbox_activity**:
   - `action_type='projected_to_task'` or `'projected_to_commitment'`
   - `target_id=task_id` or `commitment_id`
   - `target_type='task'` or `'commitment'`

### 6.2 Inbox "Handled" Display

**File**: `src/components/inbox/InboxHandledBadge.tsx` (new)

When viewing an email in Inbox that has `resolution_type='projected'`:
```
┌──────────────────────────────────┐
│ ✓ Handled                        │
│ Created: Task — Send updated deck │
│          Feb 3, 2026 · by you    │
│ [Reopen to Triage]               │
└──────────────────────────────────┘
```

Query: Join `work_items` where `source_type='email'` and `source_id=email_id` to find `superseded_by_work_item_id`, then join to get the target work_item's source details.

### 6.3 Source Provenance in Drawers

When viewing a task or commitment that was projected from an email:

**File**: Modify existing task/commitment drawers

Add a "Source" section:
```
Source: Email — "RE: LP Update Q4" (link to Inbox detail)
```

Query: Join `work_items` where `thread_key` matches and `resolution_type='projected'` to find the original email.

### 6.4 Edge Case: Email Spawns Both Task and Commitment

Flow:
1. User creates commitment from email (commitment becomes canonical)
2. User creates task as supporting task for the commitment
3. Email work_item `superseded_by` → commitment work_item
4. Task linked to commitment via existing `commitment_id` on tasks table (or via thread_key)
5. Task does NOT get its own Attention row (per decision #7 — commitment is the row, tasks are in drawer)

---

## 7. Phase 5: AI Suggestions

**Goal**: Passive AI suggestions during Triage — pre-filled triggers, projected objects, suggested metadata.

### 7.1 Suggestion Generation

**File**: `supabase/functions/triage-suggest/index.ts` (new edge function)

Input: work_item with source data (email body, note content, task content)

Output:
```typescript
interface TriageSuggestion {
  suggested_trigger?: {
    type: 'time' | 'social' | 'explicit';
    label: string;           // "This email likely needs a reply"
    confidence: number;      // 0-1
  };
  suggested_projection?: {
    type: 'task' | 'commitment' | 'reference';
    title: string;           // "Send updated deck"
    confidence: number;
  };
  suggested_metadata?: {
    due_date?: string;
    direction?: 'owed_by_me' | 'owed_to_me';
    person_name?: string;
    company_name?: string;
    effort_estimate?: 'quick' | 'medium' | 'long';
  };
}
```

Use existing email enrichment logic as the foundation. Extend with:
- Reply detection heuristics (questions in body, "can you...", "please...")
- Commitment language detection ("I'll", "I will", "by Friday", "I owe you")
- Person/company extraction from email headers and body

### 7.2 Suggestion UI in Triage Drawers

**File**: `src/components/triage/TriageSuggestionBar.tsx` (new)

Display inside source-specific drawers when a suggestion exists:
```
┌──────────────────────────────────────────────────┐
│ 💡 Suggested: This looks like a commitment       │
│    owed by you, due next week                    │
│                                                  │
│    [✔ Accept]  [✎ Edit]  [✕ Dismiss]            │
└──────────────────────────────────────────────────┘
```

- Accept: Pre-fills the projection/promotion form
- Edit: Opens form with suggested values editable
- Dismiss: Hides suggestion for this item, does not re-suggest

### 7.3 Suggestion Caching

Store suggestions in `item_extracts` table:
- `extract_type = 'triage_suggestion'`
- `content = { suggestion JSON }`

Fetch on drawer open. Cache indefinitely unless source data changes.

---

## 8. Phase 6: Pipeline Nudges & Polish

**Goal**: Pipeline companies surface proactively via staleness and close date proximity.

### 8.1 Pipeline Staleness Detection

**File**: `src/hooks/usePipelineNudges.ts` (new) or add to backfill

Logic:
- Query `pipeline_companies` where:
  - No `inbox_items`, `commitments`, `tasks`, or `inbox_activity` linked in last N days (default: 30)
  - OR `expected_close_date` is within 14 days
- For each qualifying company, ensure a `work_item` exists:
  - `source_type = 'pipeline_company'` (new source type — or use a synthetic source)
  - `queue = 'triage'`
  - `reason_codes = ['stale_pipeline']` or `['approaching_close']`

Note: This requires adding `'pipeline_company'` to the source_type options, or using a different mechanism (e.g., creating a synthetic task that represents the nudge).

**Alternative**: Create a lightweight `pipeline_nudge` task automatically:
- Task content: "Review: No contact with {Company} in 30 days"
- Task linked to pipeline company via `pipeline_company_id`
- Work item for this task enters Triage

### 8.2 Triage Hygiene: Stale Badges

**File**: `src/components/triage/TriageItemRow.tsx`

Items in Triage > 5 days show: `Still undecided (5d)`

Items in Triage > 14 days show: `Still undecided (14d)` with slightly more prominent styling

This is purely visual — no auto-escalation.

### 8.3 Global Triage Count

**File**: `src/components/layout/NavSidebar.tsx` (modify)

Triage nav item always shows count badge. Query:
```sql
SELECT count(*) FROM work_items
WHERE created_by = $userId AND queue = 'triage'
```

This count is always visible, informational, not a failure signal.

### 8.4 Attention Empty State Enhancement

When Attention is empty, show:
```
You're clear.

Triage: 12 items waiting
Next event: Team standup at 2:00pm
```

Light, ambient. Not a call to action.

---

## 9. Phase 7: Decommission Focus

**Goal**: Remove `/focus` route once Triage and Attention are stable.

### 9.1 Redirect

**File**: `src/App.tsx` (modify)

```typescript
// Replace:
<Route path="/focus" element={<FocusQueue />} />
// With:
<Route path="/focus" element={<Navigate to="/attention" replace />} />
// Also keep legacy redirect:
<Route path="/priority" element={<Navigate to="/attention" replace />} />
```

### 9.2 Cleanup (After Confidence Period)

Files to remove:
- `src/pages/FocusQueue.tsx`
- `src/components/focus/FocusSummaryPanel.tsx`
- `src/components/focus/FocusItemRow.tsx`
- `src/components/focus/FocusEmptyState.tsx`
- `src/hooks/useFocusQueue.ts`
- `src/hooks/useFocusTriageActions.ts`

Files to keep (reused by Triage/Attention):
- `src/components/focus/FocusInboxDrawer.tsx` → Rename to `src/components/shared/InboxDetailDrawer.tsx`
- `src/components/focus/FocusTaskDrawer.tsx` → Rename to `src/components/shared/TaskDetailDrawer.tsx`
- `src/components/focus/FocusCommitmentDrawer.tsx` → Rename to `src/components/shared/CommitmentDetailDrawer.tsx`
- `src/components/focus/FocusEventModal.tsx` → Rename to `src/components/shared/EventDetailModal.tsx`
- `src/components/focus/FocusReadingSheet.tsx` → Rename to `src/components/shared/ReadingDetailSheet.tsx`
- `src/components/focus/FocusGenericSheet.tsx` → Rename to `src/components/shared/GenericDetailSheet.tsx`

### 9.3 Remove Legacy Status Dependencies

Audit all code that references `status = 'trusted'` or `status = 'enriched_pending'` as queue-like filters. Replace with `queue` column checks.

---

## 10. File Index

### New Files

| File | Phase | Purpose |
|------|-------|---------|
| `supabase/migrations/..._attention_system_v2_schema.sql` | 0 | Schema changes |
| `supabase/migrations/..._attention_system_v2_rpcs.sql` | 0 | RPC gatekeepers |
| `src/types/workItem.ts` | 0 | TypeScript types for new schema |
| `src/lib/priority/priorityScoringV2.ts` | 1 | New ranking algorithm |
| `src/hooks/useAttentionQueue.ts` | 1 | Attention queue data |
| `src/hooks/useAttentionActions.ts` | 1 | Attention queue actions |
| `src/pages/AttentionQueue.tsx` | 1 | Attention page |
| `src/components/attention/AttentionItemRow.tsx` | 1 | Attention item row |
| `src/components/attention/AttentionEmptyState.tsx` | 1 | "You're clear" state |
| `src/components/attention/AttentionBandHeader.tsx` | 1 | Urgency band separator |
| `src/hooks/useTriageQueue.ts` | 2 | Triage queue data |
| `src/hooks/useTriageActions.ts` | 2 | Triage queue actions |
| `src/pages/TriageQueue.tsx` | 2 | Triage page |
| `src/components/triage/TriageItemRow.tsx` | 2 | Triage item row |
| `src/components/triage/TriageSummaryPanel.tsx` | 2 | Triage sidebar |
| `src/components/triage/TriageEmptyState.tsx` | 2 | Triage clear state |
| `src/components/triage/TriageBatchBar.tsx` | 2 | Batch action bar |
| `src/hooks/useDashboardBriefing.ts` | 3 | Dashboard briefing data |
| `src/components/dashboard/DashboardBriefingSection.tsx` | 3 | "Today at a Glance" |
| `src/components/dashboard/DashboardSignalsSection.tsx` | 3 | "System Signals" |
| `src/components/dashboard/DashboardAmbientSection.tsx` | 3 | "Ambient Context" |
| `src/components/inbox/InboxHandledBadge.tsx` | 4 | "Handled by" display |
| `supabase/functions/triage-suggest/index.ts` | 5 | AI suggestion edge function |
| `src/components/triage/TriageSuggestionBar.tsx` | 5 | Suggestion UI |
| `src/hooks/usePipelineNudges.ts` | 6 | Pipeline staleness detection |

### Modified Files

| File | Phase | Changes |
|------|-------|---------|
| `src/integrations/supabase/types.ts` | 0 | Add new columns to work_items types |
| `src/hooks/useBackfillWorkItems.ts` | 0 | Default to `queue='triage'`, auto-promote with triggers |
| `src/hooks/useEnsureWorkItem.ts` | 0 | Set queue based on trigger presence |
| `src/App.tsx` | 1, 2, 7 | Add routes, redirects |
| `src/components/layout/NavSidebar.tsx` | 1, 2, 6 | New nav items, triage count badge |
| `src/pages/Dashboard.tsx` | 3 | Briefing layout |
| `src/components/dashboard/DashboardMainContent.tsx` | 3 | Major restructure |
| `src/components/dashboard/DashboardHeroBand.tsx` | 3 | Simplify |
| `src/pages/Inbox.tsx` | 4 | Show "Handled" badge for projected emails |
| Focus drawer components | 1, 2 | Reuse in both surfaces, eventually rename |

### Removed Files (Phase 7)

| File | Replaced By |
|------|------------|
| `src/pages/FocusQueue.tsx` | `AttentionQueue.tsx` + `TriageQueue.tsx` |
| `src/components/focus/FocusSummaryPanel.tsx` | `TriageSummaryPanel.tsx` |
| `src/components/focus/FocusItemRow.tsx` | `AttentionItemRow.tsx` + `TriageItemRow.tsx` |
| `src/components/focus/FocusEmptyState.tsx` | `AttentionEmptyState.tsx` + `TriageEmptyState.tsx` |
| `src/hooks/useFocusQueue.ts` | `useAttentionQueue.ts` + `useTriageQueue.ts` |
| `src/hooks/useFocusTriageActions.ts` | `useAttentionActions.ts` + `useTriageActions.ts` |
| `src/lib/priority/priorityScoringV1.ts` | `priorityScoringV2.ts` |

---

## Build Order Summary

```
Phase 0: Data migration (schema + RPCs + types)
   ↓
Phase 1: /attention (new page + hook + scoring v2)
   ↓
Phase 2: /triage (new page + hook + actions)
   ↓
Phase 3: Dashboard redesign (briefing layout)
   ↓
Phase 4: Projection & threading (email → task/commitment flow)
   ↓
Phase 5: AI suggestions (passive, edge function)
   ↓
Phase 6: Pipeline nudges + polish (staleness, badges, counts)
   ↓
Phase 7: Decommission /focus (redirects, cleanup)
```

Each phase is independently shippable. The system remains functional between phases because:
- `/focus` keeps working until Phase 7
- Domain surfaces (Inbox, Obligations, Tasks, etc.) are never broken
- Data migration is additive (new columns, not changed columns)
- RPCs are new functions, not replacements

---

## System Contract (Reference)

```
Capture is instant.
Triage creates meaning.
Attention demands action.
Clearing Attention means safety.
```
