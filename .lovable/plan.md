

# Widen Inbox Drawer Action Rail

## Problem

The action rail in the inbox drawer is currently 200px (240px on xl screens), which makes the suggested actions cards and AI-generated content feel cramped and harder to read.

## Current State

**File: `src/components/inbox/InboxDetailWorkspace.tsx` (line 54)**
```tsx
<div className="w-[200px] xl:w-[240px] flex-shrink-0 border-l border-border overflow-y-auto">
```

## Solution

Increase the default width values to give more breathing room for the action buttons, AI suggestion cards, and activity section:

| Breakpoint | Current | Proposed |
|------------|---------|----------|
| Default | 200px | 240px |
| xl (1280px+) | 240px | 280px |

## Implementation

**File: `src/components/inbox/InboxDetailWorkspace.tsx`**

Change line 54 from:
```tsx
<div className="w-[200px] xl:w-[240px] flex-shrink-0 border-l border-border overflow-y-auto">
```

To:
```tsx
<div className="w-[240px] xl:w-[280px] flex-shrink-0 border-l border-border overflow-y-auto">
```

This provides:
- **40px more width at all screen sizes**
- Better readability for suggestion card titles and descriptions
- More space for "Create", "Edit", "Dismiss" buttons in suggestion cards
- Improved visual balance between the email content and action rail

## Files to Modify

| File | Change |
|------|--------|
| `src/components/inbox/InboxDetailWorkspace.tsx` | Update action rail width from 200px/240px to 240px/280px |

