
# Enhance Calendar Event Cards with Company Logos

## Problem Summary

Calendar events linked to companies currently show a `Building2` icon with the company name. The user wants to display the actual company logo when available (e.g., "Capitolis" should show the Capitolis logo).

## Current State Analysis

The data flow is partially correct:
- `CalendarSidebar.tsx` already fetches `company_logo_url` and stores it in a map with structure `{ name: string, logo: string | null }`
- However, `EventGroup.tsx` has a type mismatch (expects `Map<string, string>` instead of the object)
- `EventGroup.tsx` only passes the company name, not the logo
- `EventCard.tsx` only accepts `linkedCompanyName` and shows a static `Building2` icon

## Solution

Fix the data flow through the component chain and update `EventCard` to display company logos.

---

## Implementation Plan

### Part 1: Fix EventGroup Type Definition

**File: `src/components/dashboard/EventGroup.tsx`**

Update the `linkedCompanyMap` type in the props interface to match what `CalendarSidebar` actually sends:

```text
// Line 28 - Change from:
linkedCompanyMap?: Map<string, string>;

// To:
linkedCompanyMap?: Map<string, { name: string; logo: string | null }>;
```

Update the linked company extraction logic (lines 126 and 147) to pass both name and logo:

```text
// Extract the linked info object
const linkedInfo = linkedCompanyMap?.get(event.id) || 
  (event.microsoftEventId ? linkedCompanyMap?.get(event.microsoftEventId) : undefined);

// Pass to EventCard
<EventCard
  ...
  linkedCompanyName={linkedInfo?.name}
  linkedCompanyLogo={linkedInfo?.logo}
/>
```

### Part 2: Update EventCard to Display Logos

**File: `src/components/dashboard/EventCard.tsx`**

Add new prop for logo URL:

```text
interface EventCardProps {
  ...
  linkedCompanyName?: string;
  linkedCompanyLogo?: string | null;  // NEW
}
```

Import Avatar components and update the badge rendering:

```text
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Replace the current Badge content (lines 123-128):
{linkedCompanyName && (
  <Badge 
    variant="secondary" 
    className="text-[10px] px-1.5 py-0.5 mb-1.5 inline-flex items-center gap-1.5"
  >
    {linkedCompanyLogo ? (
      <Avatar className="h-3.5 w-3.5 flex-shrink-0">
        <AvatarImage src={linkedCompanyLogo} alt={linkedCompanyName} />
        <AvatarFallback className="text-[6px] bg-muted">
          {linkedCompanyName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    ) : (
      <Building2 className="h-2.5 w-2.5" />
    )}
    {linkedCompanyName}
  </Badge>
)}
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/EventGroup.tsx` | Fix type definition, pass logo prop |
| `src/components/dashboard/EventCard.tsx` | Add logo prop, render Avatar with fallback |

---

## Visual Result

**Before:**
```text
[Building2 icon] Capitolis
```

**After (with logo):**
```text
[Capitolis logo] Capitolis
```

**After (no logo available):**
```text
[Building2 icon] Company Name
```

---

## Technical Notes

1. The `Avatar` component with `AvatarFallback` handles broken image URLs gracefully
2. The logo size (3.5x3.5 / 14px) is small enough to fit in the compact badge
3. Fallback shows first 2 characters of company name in uppercase
4. No database or API changes needed - data is already being fetched
