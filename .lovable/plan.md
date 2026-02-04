

# Rename Focus to Triage and Formalize Triage Invariants

## Overview

This plan renames the "Focus" surface to "Triage" and reframes it as a judgment and approval layer. The goal is semantic clarity and intentionality around clearing items, without introducing new workflows, schemas, or UI complexity.

---

## Part 1: Rename Files and Components

### 1.1 Rename Page File
| Current | New |
|---------|-----|
| `src/pages/FocusQueue.tsx` | `src/pages/TriageQueue.tsx` |

### 1.2 Rename Component Files
All files in `src/components/focus/` will be renamed:

| Current | New |
|---------|-----|
| `FocusItemRow.tsx` | `TriageItemRow.tsx` |
| `FocusSummaryPanel.tsx` | `TriageSummaryPanel.tsx` |
| `FocusTriageBar.tsx` | `TriageActionsBar.tsx` |
| `FocusEmptyState.tsx` | `TriageEmptyState.tsx` |
| `FocusFiltersPanel.tsx` | `TriageFiltersPanel.tsx` |
| `FocusInboxDrawer.tsx` | `TriageInboxDrawer.tsx` |
| `FocusTaskDrawer.tsx` | `TriageTaskDrawer.tsx` |
| `FocusCommitmentDrawer.tsx` | `TriageCommitmentDrawer.tsx` |
| `FocusEventModal.tsx` | `TriageEventModal.tsx` |
| `FocusGenericSheet.tsx` | `TriageGenericSheet.tsx` |
| `FocusReadingSheet.tsx` | `TriageReadingSheet.tsx` |

Note: The directory itself will remain at `src/components/focus/` to avoid excessive import path changes. We could rename to `src/components/triage/` in a future cleanup pass.

### 1.3 Rename Hook Files
| Current | New |
|---------|-----|
| `src/hooks/useFocusQueue.ts` | `src/hooks/useTriageQueue.ts` |
| `src/hooks/useFocusTriageActions.ts` | `src/hooks/useTriageActions.ts` |
| `src/hooks/useFocusReadingActions.ts` | `src/hooks/useTriageReadingActions.ts` |

---

## Part 2: Update Routing and Navigation

### 2.1 App.tsx Route Changes
```tsx
// Before
<Route path="/priority" element={<Navigate to="/focus" replace />} />
<Route path="/focus" element={<FocusQueue />} />

// After
<Route path="/priority" element={<Navigate to="/triage" replace />} />
<Route path="/focus" element={<Navigate to="/triage" replace />} />
<Route path="/triage" element={<TriageQueue />} />
```

### 2.2 NavSidebar.tsx Changes
Update the navigation item:
```tsx
// Before
{
  icon: Crosshair,
  path: "/focus",
  label: "Focus",
  active: location.pathname.startsWith("/focus") || location.pathname.startsWith("/priority")
}

// After
{
  icon: Crosshair,
  path: "/triage",
  label: "Triage",
  active: location.pathname.startsWith("/triage") || location.pathname.startsWith("/focus") || location.pathname.startsWith("/priority")
}
```

---

## Part 3: Update UI Copy and Labels

### 3.1 Page Header (TriageQueue.tsx)
```tsx
// Before
<h1 className="text-xl font-semibold text-foreground">Focus</h1>
<p className="text-sm text-muted-foreground">
  {isAllClear
    ? "All clear"
    : `${counts.total} item${counts.total !== 1 ? "s" : ""} need review`}
</p>

// After
<h1 className="text-xl font-semibold text-foreground">Triage</h1>
<p className="text-sm text-muted-foreground">
  {isAllClear
    ? "All clear"
    : `${counts.total} item${counts.total !== 1 ? "s" : ""} awaiting triage`}
</p>
```

Add a subtitle below the header:
```tsx
<span className="text-xs text-muted-foreground">
  Review, enrich, and clear incoming items
</span>
```

### 3.2 Summary Panel Header (TriageSummaryPanel.tsx)
```tsx
// Before
<h2 className="font-semibold text-foreground">Focus Command</h2>
<p className="text-xs text-muted-foreground">
  {isAllClear
    ? "Everything is accounted for"
    : `${counts.total} item${counts.total !== 1 ? "s" : ""} need review`}
</p>

// After
<h2 className="font-semibold text-foreground">Triage Queue</h2>
<p className="text-xs text-muted-foreground">
  {isAllClear
    ? "Everything is accounted for"
    : `${counts.total} item${counts.total !== 1 ? "s" : ""} awaiting judgment`}
</p>
```

### 3.3 Empty State (TriageEmptyState.tsx)
```tsx
// Before
<h3 className="text-xl font-semibold text-foreground mb-2">
  All clear
</h3>
<p className="text-sm text-muted-foreground max-w-sm">
  Everything is accounted for. New items will appear here as they arrive.
</p>

// After
<h3 className="text-xl font-semibold text-foreground mb-2">
  All clear
</h3>
<p className="text-sm text-muted-foreground max-w-sm">
  All items have been triaged. New items will appear here as they arrive.
</p>
```

### 3.4 Action Button Tooltips (TriageActionsBar.tsx and TriageItemRow.tsx)
Update action tooltips to reinforce triage semantics:

| Current | New |
|---------|-----|
| "Trusted" | "Trusted (clear from triage)" |
| "No Action" | "Dismiss (no action needed)" |
| "Snooze" | "Snooze (review later)" |
| "Mark trusted" | "Mark trusted (judgment applied)" |

---

## Part 4: Formalize Triage Invariants

### 4.1 Define the Invariant
An item may only be cleared from Triage if at least one of the following is true:
1. **Classified**: The item has a `primary_link` (linked to a company, project, etc.)
2. **Dismissed**: The user has clicked "No Action" (explicitly marking as no action required)
3. **Trusted**: The user has clicked "Trusted" (confirming it is correct as-is)

Currently, clearing already requires one of these actions, so the invariant is already enforced. The change is primarily semantic - making this explicit in the UI.

### 4.2 Visual Reinforcement of Judgment
The current quick action buttons already implement this pattern:
- "Trusted" (checkmark) = judgment applied, clear from triage
- "Snooze" = defer judgment, remove temporarily
- "No Action" / "Dismiss" = judgment applied (no action needed), clear from triage

No code changes needed here, but we will update button labels and tooltips to reinforce this.

### 4.3 Add Confirmation Semantics to Clear Actions
Update the `useTriageActions.ts` hook to use clearer method names internally:

```tsx
// Rename for clarity (internal implementation unchanged)
markTrusted → applyTrustedJudgment  // or keep markTrusted
noAction → applyDismissJudgment     // or keep noAction
```

For this pass, we will keep the existing method names but update comments to document the invariant.

---

## Part 5: Update Imports Across Codebase

### Files Requiring Import Updates
1. `src/App.tsx` - Import renamed page component
2. `src/pages/TriageQueue.tsx` (formerly FocusQueue.tsx) - Update all component imports
3. `src/components/dashboard/PriorityPanel.tsx` - If it links to Focus, update to Triage
4. Any other files that import Focus components

---

## Part 6: Update Query Keys

### In useTriageQueue.ts (formerly useFocusQueue.ts)
```tsx
// Before
const queryKey = ["focus_queue", user?.id];

// After
const queryKey = ["triage_queue", user?.id];
```

### In useTriageActions.ts (formerly useFocusTriageActions.ts)
```tsx
// Before
queryClient.invalidateQueries({ queryKey: ["focus_queue"] });

// After
queryClient.invalidateQueries({ queryKey: ["triage_queue"] });
```

---

## Part 7: Files NOT Changed

Per the non-goals, these will NOT be modified:
- Database schema (no changes to `work_items` table)
- Edge functions (`focus-enrich`, etc.) - names are internal and do not affect UI
- `useDashboardPipelineFocus.ts` - this refers to "Pipeline Focus" which is a different concept
- Any downstream surfaces (Inbox, Tasks, Notes, Reading, Pipeline)

---

## Implementation Order

1. Rename page file: `FocusQueue.tsx` → `TriageQueue.tsx`
2. Update routing in `App.tsx`
3. Update navigation in `NavSidebar.tsx`
4. Rename hook files and update query keys
5. Rename component files in `src/components/focus/`
6. Update all imports in `TriageQueue.tsx`
7. Update UI copy in all renamed components
8. Verify build passes

---

## Summary

This plan delivers:
- Complete rename from Focus to Triage across UI, navigation, and routing
- Updated copy that emphasizes judgment, review, and intentional clearing
- Preserved existing behavior - no new workflows or complexity
- Clear documentation of triage invariants through UI semantics
- Backward-compatible redirects from `/focus` and `/priority` to `/triage`

