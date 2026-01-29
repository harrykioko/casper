
# Pipeline Detail Overview Redesign

## Current State Analysis

The existing Overview tab consists of 5 stacked GlassPanel cards:
1. **Next Steps** - Large textarea for freeform notes
2. **Open Tasks Preview** - Quick add input + up to 5 tasks in subcards
3. **Recent Notes Preview** - Up to 3 notes in subcards
4. **Recent Files Preview** - Up to 3 files or large empty state with illustration
5. **Communications Preview** - Always shows "Connect emails..." placeholder

**Right rail** duplicates some content with 3 more cards:
- RelationshipSummary (counts + last activity)
- NextActionsCard (tasks + next steps fallback)
- ActivityFeed (timeline preview)

**Problems identified:**
- 8 total cards between main content and rail = visual overwhelm
- Empty states announce absence loudly ("No notes yet", file illustration)
- Redundancy between main content and rail (tasks appear twice, next steps shown twice)
- Fixed card heights waste space when empty
- Feels like a form, not a workspace

---

## New Architecture

### Zone 1: Deal Snapshot (Top - replaces current implicit hero metadata)

Currently, the hero (`DealRoomHero.tsx`) shows company info but in a generic "back + name + actions" pattern. We'll enhance the hero when viewing Overview to include a **Deal Snapshot** section that appears just below the existing header row.

**Data displayed (only if present - no placeholders):**
- Status pill (already in hero)
- Stage/Round (already in hero)
- Sector (already in hero)
- Raise amount (already in hero)
- Close date (already in hero)
- Website (already in hero)
- **NEW: Editable one-line thesis** - inline text input, autosaves on blur
- **Last touched** relative timestamp (already in hero)

**Implementation:** Add a `thesis` or `working_summary` field display below the existing metadata row in the hero, shown only on Overview tab. This requires passing `activeTab` to DealRoomHero or creating a conditional "snapshot" slot.

### Zone 2: Momentum Panel (Primary focus - single card)

Replaces: Next Steps, Open Tasks Preview, NextActionsCard (from rail)

**Component:** `MomentumPanel.tsx` (new)

**Structure:**
```text
┌────────────────────────────────────────────────────┐
│ Momentum                                           │
│ What's next for this deal?                         │
│                                                    │
│ ┌────────────────────────────────────────────────┐ │
│ │ ⊕  Capture your next step or takeaway...      │ │
│ └────────────────────────────────────────────────┘ │
│                                                    │
│ ○ Follow up on term sheet questions        Due Fri│
│ ○ Schedule partner meeting                Tomorrow │
│                                                    │
│ [View all tasks →]                                │
└────────────────────────────────────────────────────┘
```

**Behavior:**
- Input field always visible at top (supports task creation on Enter)
- Shows max 2-3 open tasks with due dates (sorted by urgency)
- Falls back to `next_steps` freeform text if no tasks exist
- "View all tasks" link navigates to Tasks tab
- No nested cards inside - flat list with dividers

### Zone 3: Deal Signals (Compressed evidence)

Replaces: Recent Notes Preview, Recent Files Preview, Communications Preview

**Component:** `DealSignals.tsx` (new)

**Conditions:** Only renders if any signal exists. If empty, entire section is omitted.

**Structure:**
```text
Signals
──────────────────────────────────────────────────────
📝 "Call with Alex - discussed timeline..."    2 days ago  → Notes
📎 pitch_deck_v3.pdf                           Yesterday   → Files  
✉️ "Re: Partnership discussion"                3 days ago  → Comms
✓  Sent follow-up email                        4 days ago  → Tasks
──────────────────────────────────────────────────────
```

**Data sources:**
- Most recent note (from `interactions` where type is note/call/meeting)
- Most recent file (from `attachments`)
- Most recent comms item (from `linkedCommunications`)
- Last completed task (from `tasks` where completed=true)

**Behavior:**
- Max 5 rows total
- Each row is a single line with icon, title (truncated), timestamp, and click-to-navigate
- No empty state - if no signals, section doesn't render
- Flat list with hairline dividers, no card wrapping per item

---

## Right Rail Refinement

### Replace current 3 cards with 2 lightweight sections

**A. Status Snapshot** (compact metrics)
```text
┌────────────────────────────────────┐
│ ○ 3 open tasks                     │
│ ○ 5 notes                          │
│ ○ 2 files                          │
│ ○ 4 days since last activity       │
└────────────────────────────────────┘
```
- Icon + label + value on single line each
- Borderless or very subtle container
- Replaces RelationshipSummary card

**B. Recent Activity** (timeline preview)
```text
┌────────────────────────────────────┐
│ Activity                           │
│ ─────────────────────────────────  │
│ Today                              │
│   📝 Added note about pricing      │
│   ✓ Completed: Send deck           │
│ Yesterday                          │
│   📞 Call with founder             │
│                                    │
│ [View full timeline →]             │
└────────────────────────────────────┘
```
- Max 5 items
- Groups by date (Today/Yesterday/Earlier)
- Link to Timeline tab
- Replaces ActivityFeed and NextActionsCard

---

## Files Changed

| File | Change Type | Description |
|------|-------------|-------------|
| `src/components/pipeline-detail/tabs/OverviewTab.tsx` | **Major rewrite** | Replace 5 GlassPanels with MomentumPanel + DealSignals |
| `src/components/pipeline-detail/overview/MomentumPanel.tsx` | **New file** | Primary focus component with task input + preview |
| `src/components/pipeline-detail/overview/DealSignals.tsx` | **New file** | Compressed signals row list |
| `src/components/pipeline-detail/overview/StatusSnapshot.tsx` | **New file** | Compact rail metrics |
| `src/components/pipeline-detail/shared/RelationshipSummary.tsx` | Delete or deprecate | Replaced by StatusSnapshot |
| `src/components/pipeline-detail/shared/NextActionsCard.tsx` | Delete or deprecate | Functionality merged into MomentumPanel |
| `src/components/pipeline-detail/shared/ActivityFeed.tsx` | **Update** | Simplify for rail-only use, add "View full timeline" link |
| `src/components/pipeline-detail/DealRoomContextRail.tsx` | **Update** | Use StatusSnapshot + simplified ActivityFeed |
| `src/components/pipeline-detail/DealRoomHero.tsx` | **Update** | Add optional thesis/summary inline field for Overview |
| `src/pages/PipelineCompanyDetail.tsx` | **Minor update** | Pass `activeTab` to hero if needed for conditional thesis field |

---

## Component Specifications

### MomentumPanel.tsx

```typescript
interface MomentumPanelProps {
  tasks: PipelineTask[];
  nextSteps?: string | null;
  onCreateTask: (content: string) => Promise<any>;
  onViewAllTasks: () => void;
}
```

**Styling:**
- Single GlassPanel container (reduced padding: `padding="md"`)
- Header: "Momentum" with subtle subtext
- Input: inline text field with Plus icon, no button until typing
- Task rows: flex layout, checkbox-style icon, content truncated, due badge right-aligned
- Max 3 visible items
- "View all" link at bottom if more exist

### DealSignals.tsx

```typescript
interface DealSignalsProps {
  recentNote?: PipelineInteraction | null;
  recentFile?: PipelineAttachment | null;
  recentComm?: LinkedCommunication | null;
  lastCompletedTask?: PipelineTask | null;
  onNavigate: (tab: DealRoomTab) => void;
}
```

**Styling:**
- Light container (no GlassPanel, just subtle border-top or divider)
- Header: "Signals" in small caps
- Rows: icon (16px) + title (truncated) + relative time + → indicator
- Clickable rows navigate to respective tabs

### StatusSnapshot.tsx

```typescript
interface StatusSnapshotProps {
  openTasksCount: number;
  notesCount: number;
  filesCount: number;
  daysSinceLastActivity: number | null;
}
```

**Styling:**
- Minimal card (variant="subtle" or borderless)
- 4 rows max, icon + label + count
- No "Relationship Summary" header - implicit context

---

## Visual Guidelines Applied

| Guideline | Implementation |
|-----------|----------------|
| Reduce card usage by ~40% | 2 cards in main (Momentum + Signals) vs current 5 |
| Prefer dividers over borders | Signals uses hairline dividers, not subcards |
| Reduce padding by 15-20% | MomentumPanel uses `padding="md"`, Signals uses minimal wrapper |
| Typography creates hierarchy | Section headers in small caps, content in regular text |
| Empty states collapse space | DealSignals not rendered if empty, MomentumPanel adapts |
| No tables, no pagination | Flat lists with hard caps (3 tasks, 5 signals) |

---

## Success Metrics (Qualitative)

1. Overview renders shorter when empty (no "No X yet" messages)
2. Clear visual distinction from Tasks/Notes tabs (no item grids)
3. Momentum panel immediately answers "what's next?"
4. Signals provide evidence without requiring tab navigation
5. Rail feels informational, not action-heavy

---

## Technical Notes

- No database changes required
- No new routes
- No changes to left tab navigation (`DealRoomTabs.tsx` untouched)
- All data already available via existing hooks
- Existing actions (Add Task, Add Note, Upload File) preserved in hero
- Inline thesis field uses same autosave pattern as existing next_steps
