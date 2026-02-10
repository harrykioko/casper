

# Command Stream Right Rail Redesign

## Problem

The current right rail renders two disconnected small cards ("Assist" placeholder and "Today") that feel decorative. They need to become one cohesive panel with a dominant chat-like Assist section and a supporting availability section.

## Changes

### `src/components/home/CommandAssistPanel.tsx` -- Full Rewrite

Replace the two disconnected cards with a single cohesive container:

**Container**: One `rounded-2xl border border-border bg-card shadow-sm` panel, sticky, with `flex flex-col` filling available height via `h-[calc(100vh-12rem)]`.

**Section 1 -- Assist (top, dominant, flex-1)**
- Header row: "Assist" label with a small Sparkles icon, `text-sm font-semibold`
- Scrollable message area (`flex-1 overflow-y-auto`) with a clean empty state:
  - A centered muted icon and short line like "What would you like to do?" (no generic "AI suggestions" copy)
- 2-3 suggested prompt chips below the empty state text:
  - "Summarize what's urgent"
  - "What can I do in 15 min?"
  - "Draft a reply"
- Chips styled as small rounded pills (`text-xs px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted`) in a flex-wrap layout
- Pinned input row at bottom of the Assist section: a disabled input with placeholder "Ask Casper what to do next..." and a muted send icon button
- Soft separator (`border-t border-border/40`) between Assist and Availability

**Section 2 -- Today's Availability (bottom, supporting, shrink-0)**
- Header: "Today" with Clock icon, `text-[11px] uppercase tracking-wider`
- **Prominent countdown**: "Next meeting in Xh Ym" as `text-sm font-medium` -- computed from time until next event
- Next meeting title + time range on one line, `text-xs text-muted-foreground`
- 2-4 available windows as compact rows: time range + duration badge (`text-xs`)
- No meeting state: "No more meetings today" muted text
- Overall height ~180-200px, the rest goes to Assist

### No other files change

`CommandStreamMode.tsx` already passes `events` to `CommandAssistPanel` -- no prop changes needed.

## Technical Details

- Uses existing `date-fns` utilities and `CalendarEvent` type -- no new dependencies
- `differenceInMinutes` from date-fns for the countdown calculation
- All prompt chips are non-functional (just visual) -- click handlers can be wired later
- Input is `disabled` with `opacity-50 cursor-not-allowed`
- Keeps the existing `useMemo` logic for `todayEvents`, `nextMeeting`, and `availableWindows`

