
# Portfolio Company Detail Layout V2 (Cabana-style)

## Problem Summary

The current Portfolio Company Detail page (`/portfolio/:companyId`) has a flat, sparse layout with floating cards (Founders, Notes & Interactions, Tasks, Timeline) on a blank canvas. This lacks the workspace density and organized feel of the Cabana reference design and the existing Pipeline Deal Room pattern.

---

## Solution Overview

Transform the Portfolio Company Detail into a 3-panel workspace layout matching the established Pipeline Deal Room pattern:

1. **Sticky Hero** - Gradient background with company identity, metadata chips, and quick actions
2. **Left Mode Nav** - Vertical tab selector for different workspace modes
3. **Main Content** - Mode-driven content area (Overview, People, Notes, Tasks, etc.)
4. **Right Context Rail** - Persistent relationship summary, next actions, and activity feed

---

## Layout Architecture

```text
+----------------------------------------------------------+
|  HERO (sticky)                                            |
|  [Logo] Company Name [Status] | metadata chips | Actions  |
+----------------------------------------------------------+
|  Mode Nav  |     Main Content           |  Context Rail   |
|  (col-2)   |     (col-7)                |  (col-3)        |
|            |                            |                 |
|  Overview  |  [Mode-specific content]   | Relationship    |
|  People    |                            | Summary         |
|  Notes     |                            |                 |
|  Tasks     |                            | Next Actions    |
|  Emails    |                            |                 |
|  Meetings  |                            | Activity Feed   |
|  Files     |                            |                 |
+----------------------------------------------------------+
```

---

## Implementation Plan

### Part 1: New Layout Components

#### 1.1 PortfolioCompanyLayout.tsx (NEW)

Create a reusable layout wrapper based on `DealRoomLayout`:

```text
interface PortfolioCompanyLayoutProps {
  hero: ReactNode;
  nav: ReactNode;
  content: ReactNode;
  rail: ReactNode;
}

- Sticky hero at top with gradient background
- 12-column grid below: col-span-2 (nav), col-span-7 (content), col-span-3 (rail)
- Left nav and right rail are sticky below hero
- Max-width 1800px with 24px gutters
```

#### 1.2 PortfolioCompanyHero.tsx (NEW)

Create a hero component matching the DealRoomHero pattern:

**Structure:**
- **Left cluster:**
  - Company logo/avatar (larger: 56x56px)
  - Company name + status badge (Active/Watching/Exited/Archived)
  - Metadata row: Website link, Last interaction, Open tasks count
  
- **Right cluster (actions):**
  - Primary: "Add Task", "Add Note" buttons
  - Secondary: Edit, External Link icons

**Styling:**
- Soft gradient background (reuse Casper hero gradient tokens)
- Glass panel overlay for metadata strip
- Subdued borders, calm visual presence

#### 1.3 PortfolioModeNav.tsx (NEW)

Vertical mode selector based on `DealRoomTabs`:

**Modes:**
| Mode | Icon | Count Source |
|------|------|--------------|
| Overview | LayoutDashboard | - |
| People | Users | founders.length |
| Notes | FileText | interactions.length |
| Tasks | CheckSquare | openTasks.length |
| Emails | Mail | (placeholder: 0) |
| Meetings | Calendar | (placeholder: 0) |
| Files | Paperclip | (placeholder: 0) |

**Behavior:**
- Store mode in query param: `?mode=overview|people|notes|tasks|emails|meetings|files`
- Default to "overview" if no param
- Active state: left border accent, background highlight
- Show count badges for non-zero items

---

### Part 2: Context Rail Components

#### 2.1 PortfolioContextRail.tsx (NEW)

Container component that stacks:
1. RelationshipSummaryCard (reuse existing from pipeline-detail/shared)
2. NextActionsCard (adapted for portfolio tasks)
3. ActivityCard (adapted timeline)

#### 2.2 Adapt Existing Components

**RelationshipSummary** (already exists at `src/components/pipeline-detail/shared/RelationshipSummary.tsx`):
- Can be reused directly with portfolio data
- Props: openTasksCount, notesCount, filesCount, commsCount, lastActivityAt

**NextActionsCard** (already exists at `src/components/pipeline-detail/shared/NextActionsCard.tsx`):
- Reuse with portfolio tasks
- Show top 3 open tasks with due dates
- "Complete" quick action per row

**ActivityCard** (adapt from ActivityFeed):
- Reuse `ActivityFeed` component from pipeline-detail/shared
- Pass portfolio timeline events
- "View full timeline" navigates to Timeline mode (if implemented) or scrolls

---

### Part 3: Mode Views

#### 3.1 PortfolioOverviewMode.tsx (NEW)

The "command center summary" mode. Structure:

**Section A: At a Glance (2-column mini cards)**
- Open Tasks card: count + preview of 2 tasks, "View all" link
- Recent Notes card: count + preview of 2 notes, "View all" link

**Section B: Key People**
- Compact list of founders/contacts (reuse CompanyFoundersPanel content)
- Quick actions: email, copy

**Section C: Latest Interaction**
- Show most recent note/meeting content in larger card
- "Add note" inline CTA

**Empty States:**
- Each section shows calm inline empty state if no data
- Never show giant blank blocks

#### 3.2 PortfolioPeopleMode.tsx (NEW)

Full founders/contacts view:
- Reuse content from `CompanyFoundersPanel`
- Display as list with more details visible
- Actions: Email, Copy, Edit contact

#### 3.3 PortfolioNotesMode.tsx (NEW)

Notes workspace:
- Composer at top (reuse from `CompanyInteractionsSection`)
- Chronological list below
- Interaction type selector (Note, Call, Meeting, Email, Update)
- Delete action per item

#### 3.4 PortfolioTasksMode.tsx (NEW)

Tasks workspace:
- Task input at top (reuse from `CompanyTasksSection`)
- Open tasks first, completed collapsible
- Quick complete/delete actions

#### 3.5 PortfolioEmptyMode.tsx (NEW)

Placeholder for unimplemented modes (Emails, Meetings, Files):
- Calm empty state with icon, title, 1-2 line description
- Optional disabled CTA ("Coming soon")
- Consistent styling across all placeholder modes

---

### Part 4: Page Updates

#### 4.1 PortfolioCompanyDetail.tsx (UPDATE)

Refactor to use new layout structure:

```text
// State management
const [mode, setMode] = useState(() => getQueryParam('mode') || 'overview');

// Sync mode to URL query param
useEffect(() => setQueryParam('mode', mode), [mode]);

// Existing hooks remain unchanged:
useCompany, useCompanyContacts, useCompanyInteractions, useCompanyTasks, useCompanyTimeline

// Render structure
return (
  <PortfolioCompanyLayout
    hero={<PortfolioCompanyHero company={company} onEdit={...} onAddTask={...} />}
    nav={<PortfolioModeNav mode={mode} onModeChange={setMode} counts={...} />}
    content={renderModeContent(mode)}
    rail={<PortfolioContextRail company={company} tasks={tasks} interactions={interactions} timeline={timeline} />}
  />
);
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/portfolio-detail/PortfolioCompanyLayout.tsx` | Layout wrapper (hero + 3-col grid) |
| `src/components/portfolio-detail/PortfolioCompanyHero.tsx` | Sticky hero with gradient |
| `src/components/portfolio-detail/PortfolioModeNav.tsx` | Left vertical tab nav |
| `src/components/portfolio-detail/PortfolioContextRail.tsx` | Right rail container |
| `src/components/portfolio-detail/modes/OverviewMode.tsx` | Overview dashboard |
| `src/components/portfolio-detail/modes/PeopleMode.tsx` | Founders/contacts view |
| `src/components/portfolio-detail/modes/NotesMode.tsx` | Notes workspace |
| `src/components/portfolio-detail/modes/TasksMode.tsx` | Tasks workspace |
| `src/components/portfolio-detail/modes/EmptyMode.tsx` | Placeholder for future modes |
| `src/components/portfolio-detail/overview/AtAGlanceCard.tsx` | Mini summary cards |
| `src/components/portfolio-detail/overview/LatestInteractionCard.tsx` | Recent note display |

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/PortfolioCompanyDetail.tsx` | Refactor to use new layout and mode routing |

## Files to Reuse (No Changes)

| File | Reuse Purpose |
|------|---------------|
| `src/components/pipeline-detail/shared/ActivityFeed.tsx` | Activity timeline in rail |
| `src/components/pipeline-detail/overview/StatusSnapshot.tsx` | Pattern reference for relationship summary |
| `src/components/ui/glass-panel.tsx` | Glass panel styling |
| `src/hooks/useCompany.ts` | Company data fetching |
| `src/hooks/useCompanyContacts.ts` | Founders/contacts |
| `src/hooks/useCompanyInteractions.ts` | Notes/interactions |
| `src/hooks/useCompanyTasks.ts` | Tasks |
| `src/hooks/useCompanyTimeline.ts` | Timeline events |

---

## Technical Notes

### Query Param Mode Routing

```typescript
// Helper to sync mode with URL
function usePortfolioMode() {
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'overview';
  
  const setMode = useCallback((newMode: PortfolioMode) => {
    setSearchParams({ mode: newMode }, { replace: true });
  }, [setSearchParams]);
  
  return [mode as PortfolioMode, setMode] as const;
}
```

### Mode Types

```typescript
type PortfolioMode = 
  | 'overview' 
  | 'people' 
  | 'notes' 
  | 'tasks' 
  | 'emails' 
  | 'meetings' 
  | 'files';
```

### Empty Mode Props

```typescript
interface EmptyModeProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaDisabled?: boolean;
}
```

---

## Visual Specifications

### Hero Gradient (Reuse Casper tokens)

Light mode: Soft sky blue through periwinkle to lavender
Dark mode: Deep navy through indigo to plum

Glass overlay at 15% opacity to let gradient show through.

### Spacing & Sizing

- Hero height: ~120px content area
- Mode nav width: col-span-2 (~180px)
- Context rail width: col-span-3 (~320px)
- Card padding: 16-24px
- Card border-radius: 16-20px
- Section gaps: 24px

### Typography Hierarchy

- Company name: text-2xl font-semibold
- Section headers: text-sm font-medium uppercase tracking-wide text-muted-foreground
- Body text: text-sm
- Metadata: text-xs text-muted-foreground

### Empty States

Calm, compact, reassuring:
- Icon: 32x32 muted color
- Title: text-sm font-medium
- Description: text-xs text-muted-foreground
- Max 60px height per empty state

---

## Non-Goals (Confirmed)

- No new backend tables
- No changes to portfolio list page
- No mobile-specific layouts
- No new route paths (keep `/portfolio/:companyId`)
- No redesign of task/note creation logic (just relocate into new UI)

---

## Acceptance Criteria

1. Portfolio company detail renders with gradient hero
2. Left mode nav with all 7 modes listed (5 functional, 2 placeholder)
3. Mode switching via nav updates content area and URL query param
4. Right context rail shows relationship summary, next actions, activity
5. Overview mode displays at-a-glance cards, key people, latest interaction
6. Notes mode has composer + chronological list
7. Tasks mode has input + open/completed sections
8. Placeholder modes (Emails, Meetings, Files) show calm empty state
9. Edit company, add note/task, toggle complete still work
10. Timeline data populates activity feed in right rail
