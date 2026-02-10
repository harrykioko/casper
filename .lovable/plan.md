

# Focus Mode Home Page — Implementation Plan

## Overview

Create a new `/home` route hosting a calm, premium Focus Mode dashboard. This replaces the widget-dense current Dashboard with a three-column execution surface. Two additional modes (Command Stream, Executive Overview) are scaffolded as placeholders behind a segmented control.

## Layout Architecture

```text
+---------------------------------------------------------------+
|            [ Focus Mode | Command Stream | Executive ]         |
+---------------------------------------------------------------+
|   Tuesday, February 10, 2026                                  |
|        Good morning, Harry.                                    |
+---------------------------------------------------------------+
| LEFT RAIL (200px) | CENTER COLUMN (flex-1)  | RIGHT RAIL (240px)|
|                   |                          |                   |
| TODAY             | FOCUS SPOTLIGHT          | TODAY'S FLOW      |
| Day + Date        | [Urgency] [Overdue 5d]   | Timeline events   |
| City              | Task Title (large)       | Now indicator     |
| Weather icon+temp | [Mark Complete] [Snooze] |                   |
|                   |                          |                   |
| CONTEXT           | UP NEXT                  | NON-NEGOTIABLES   |
| Linked entities   | 3-5 flat rows            | Checkbox items    |
| for focus item    | Overdue / Commitment     |                   |
|                   | labels only              |                   |
+---------------------------------------------------------------+
```

Max content width: ~1280px, centered. Soft gradient background. No hard dividers.

## Data Sources (All Existing Hooks)

| Data | Hook | Usage |
|------|------|-------|
| Tasks | `useTasks` + `useEnrichedTasks` | Focus Spotlight + Up Next |
| Calendar | `useOutlookCalendar` | Right rail timeline |
| Non-negotiables | `useNonnegotiables` | Right rail bottom |
| User profile | `useUserProfile` + `useAuth` | Greeting |
| Commitments | `useCommitments` | Up Next labels |

No new hooks or database changes needed.

## File Changes

### New Files

| File | Purpose |
|------|---------|
| `src/pages/Home.tsx` | Page component, data orchestration, mode state |
| `src/components/home/FocusModeLayout.tsx` | Three-column grid container |
| `src/components/home/ModeToggle.tsx` | Segmented control (Focus/Command/Executive) |
| `src/components/home/FocusGreeting.tsx` | "Good morning, Harry." + date |
| `src/components/home/FocusSpotlight.tsx` | Hero card for #1 task |
| `src/components/home/FocusUpNext.tsx` | Flat row list of 3-5 next tasks |
| `src/components/home/FocusUpNextRow.tsx` | Single row in Up Next list |
| `src/components/home/TodayRail.tsx` | Left rail: date, weather, context |
| `src/components/home/TimeRail.tsx` | Right rail: timeline + non-negotiables |
| `src/components/home/TimelineEvent.tsx` | Single event in the vertical timeline |
| `src/components/home/PlaceholderMode.tsx` | "Coming soon" placeholder for other modes |

### Modified Files

| File | Change |
|------|--------|
| `src/App.tsx` | Add `/home` route |
| `src/components/layout/NavSidebar.tsx` | Add "Home" nav item pointing to `/home` |

## Component Details

### ModeToggle
- Segmented control with 3 buttons: Focus Mode, Command Stream, Executive Overview
- Rounded-full container with subtle border, pill-style active indicator
- Active mode uses `bg-card shadow-sm`, inactive uses `text-muted-foreground`
- Returns `mode` state, only "focus" triggers real content

### FocusGreeting
- Time-of-day greeting: "Good morning/afternoon/evening, {firstName}."
- Date below: "Tuesday, February 10, 2026" in `text-muted-foreground`
- Title: `text-3xl font-serif` or `text-3xl font-light tracking-tight` for premium feel
- Centered above the three columns

### FocusSpotlight
- Reuses the same task selection logic from `UpNextSection` (overdue > today > high priority tomorrow)
- Takes the single top task
- Large card: rounded-2xl, subtle shadow, optional very faint gradient border
- Content:
  - Urgency pill top-left (e.g., "Critical" in rose if overdue, "Due Today" in amber)
  - Overdue indicator top-right ("Overdue 5 days" in rose text)
  - Task title: `text-2xl font-medium` — visually dominant
  - Actions row: "Mark Complete" solid button, "Snooze" ghost/text button
- No checkbox — uses button-based completion

### FocusUpNext
- Header: "UP NEXT" in `text-xs uppercase tracking-widest text-muted-foreground`
- Right side: summary like "3 Priority . 2 Commitments" in muted text
- List of 3-5 `FocusUpNextRow` items

### FocusUpNextRow
- Clean, flat row:
  - Open circle checkbox (left)
  - Task/commitment title (center, `text-sm`)
  - Metadata below title: overdue indicator (rose text), commitment label (blue dot + "Commitment" + person name)
  - Chevron right (far right, muted)
- Subtle hover: `bg-muted/30`
- Clicking row opens task detail (existing `TaskDetailsDialog`)
- Commitments from `useCommitments` mixed into the list, sorted by urgency alongside tasks

### TodayRail (Left)
- **Today section**: Day name, date, static city text, weather placeholder (sun icon + "62 F . Clear")
  - Weather is static/placeholder for MVP — no weather API call
- **Context section**: Header "CONTEXT"
  - Shows entities linked to the current focus task (from `linkedEntity` on the enriched task)
  - Icon-first rows: company logo/icon + name
  - Max 3-6 items
  - If no linked entities, section is hidden

### TimeRail (Right)
- **Today's Flow**: Header "TODAY'S FLOW" in uppercase muted text
  - Vertical timeline with dots and connecting line
  - Past events: muted opacity (same pattern from CalendarSidebar)
  - "Now" indicator: filled blue dot + "(Now)" label
  - Next 1-3 events: normal opacity
  - Each event: time + title + optional type pill (e.g., "Video Call")
- **Non-Negotiables**: Reuses existing `Nonnegotiables` component with data from `useNonnegotiables`

### PlaceholderMode
- Simple centered card: "Command Stream — coming soon" / "Executive Overview — coming soon"
- Muted text, no UI elements
- Subtle `bg-muted/5` container

## Routing & Navigation

- New route: `/home` in `MainContent` routes
- NavSidebar: Add a "Home" item at the top of workspace items (before Dashboard), using a `Home` icon from lucide
- Existing `/dashboard` route remains unchanged for now

## Styling Approach

- Background: subtle radial gradient `bg-gradient-to-br from-background via-background to-muted/20`
- No hard borders between columns — spacing and whitespace create separation
- Typography hierarchy:
  - Greeting: `text-3xl font-semibold`
  - Focus task title: `text-2xl font-medium`
  - Section headers: `text-xs uppercase tracking-widest text-muted-foreground`
  - Up Next rows: `text-sm`
- One accent color: primary blue for active states
- Rose reserved strictly for urgency (overdue pills)
- Animations: fade-in only (`motion.div` with `initial={{ opacity: 0 }}`)
- WCAG AA contrast maintained

## What Is NOT Included

- No inbox previews
- No portfolio/pipeline metrics
- No reading list
- No counts, KPIs, summaries
- No full calendar view
- No weather API integration (static placeholder)
- No Command Stream or Executive Overview UI beyond placeholders

