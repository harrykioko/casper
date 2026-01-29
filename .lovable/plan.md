
# Fix: Calendar-Linked Companies Persist Through Refreshes

## Problem

When the Outlook calendar syncs, **all company links get orphaned** because:

1. The `sync-outlook-calendar` edge function **deletes all calendar_events** for the user
2. It then **inserts new events with fresh UUIDs**
3. The `calendar_event_links` table stores `calendar_event_id` (the Supabase UUID)
4. After sync, those UUIDs no longer exist - links point to nothing

```text
BEFORE SYNC:
calendar_events:  id=abc-123, microsoft_event_id="AAMk...", title="Call with ComplyCo"
calendar_event_links: calendar_event_id=abc-123, company_name="ComplyCo" ✓

AFTER SYNC:
calendar_events:  id=xyz-789 (NEW!), microsoft_event_id="AAMk...", title="Call with ComplyCo"  
calendar_event_links: calendar_event_id=abc-123 ← ORPHANED! No event with this UUID
```

## Solution

Use the stable **Microsoft Event ID** as the link key instead of the ephemeral Supabase UUID. Microsoft Event IDs are permanent and don't change across syncs.

---

## Implementation

### Part 1: Add `microsoft_event_id` column to linking tables

Add a new column to store the stable Microsoft ID alongside the existing `calendar_event_id`:

```sql
ALTER TABLE calendar_event_links 
ADD COLUMN IF NOT EXISTS microsoft_event_id TEXT;

ALTER TABLE calendar_event_link_suggestions
ADD COLUMN IF NOT EXISTS microsoft_event_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_calendar_event_links_ms_event_id 
ON calendar_event_links(microsoft_event_id);

CREATE INDEX IF NOT EXISTS idx_calendar_event_link_suggestions_ms_event_id 
ON calendar_event_link_suggestions(microsoft_event_id);
```

### Part 2: Backfill existing links with Microsoft Event IDs

```sql
-- Backfill calendar_event_links
UPDATE calendar_event_links cel
SET microsoft_event_id = ce.microsoft_event_id
FROM calendar_events ce
WHERE cel.calendar_event_id = ce.id
  AND cel.microsoft_event_id IS NULL;

-- Backfill calendar_event_link_suggestions
UPDATE calendar_event_link_suggestions cels
SET microsoft_event_id = ce.microsoft_event_id
FROM calendar_events ce
WHERE cels.calendar_event_id = ce.id
  AND cels.microsoft_event_id IS NULL;
```

### Part 3: Update TypeScript types

**File: `src/types/outlook.ts`**

Ensure `microsoftEventId` is available on the CalendarEvent type (already exists via `transformDatabaseEvent`).

**File: `src/types/calendarLinking.ts`**

```typescript
export interface LinkedCompany {
  // ... existing fields ...
  microsoftEventId?: string | null;  // NEW
}

export interface CompanySuggestion {
  // ... existing fields ...
  microsoftEventId?: string | null;  // NEW
}
```

### Part 4: Update `useCalendarEventLinking.ts` hook

**A. Pass `microsoftEventId` in the CalendarEvent interface:**

```typescript
interface CalendarEvent {
  id: string;
  microsoftEventId?: string;  // ADD THIS
  title: string;
  attendees?: Array<{ name: string; email?: string }>;
}
```

**B. Store `microsoft_event_id` when creating links:**

Update `linkCompany` function:
```typescript
const { data, error } = await supabase
  .from('calendar_event_links')
  .upsert({
    calendar_event_id: event.id,
    microsoft_event_id: event.microsoftEventId || null,  // ADD
    company_id: company.id,
    // ... rest unchanged
  }, { onConflict: 'calendar_event_id,company_id,company_type' })
```

**C. Store `microsoft_event_id` when creating suggestions:**

Update `computeSuggestions` function to include `microsoft_event_id`:
```typescript
newSuggestions.push({
  calendar_event_id: event.id,
  microsoft_event_id: event.microsoftEventId || null,  // ADD
  // ... rest unchanged
});
```

**D. Update `fetchLink` to lookup by microsoft_event_id with fallback:**

```typescript
const fetchLink = useCallback(async () => {
  if (!event?.id || !user) return;
  setLoading(true);

  try {
    // First try lookup by current UUID
    let { data, error } = await supabase
      .from('calendar_event_links')
      .select('*')
      .eq('calendar_event_id', event.id)
      .eq('created_by', user.id)
      .maybeSingle();

    // If no link found by UUID, try by microsoft_event_id
    if (!data && event.microsoftEventId) {
      const { data: msData } = await supabase
        .from('calendar_event_links')
        .select('*')
        .eq('microsoft_event_id', event.microsoftEventId)
        .eq('created_by', user.id)
        .maybeSingle();
      
      if (msData) {
        // Re-associate link with current UUID
        await supabase
          .from('calendar_event_links')
          .update({ calendar_event_id: event.id })
          .eq('id', msData.id);
        data = { ...msData, calendar_event_id: event.id };
      }
    }

    if (data) {
      setLinkedCompany({
        // ... transform data
      });
    } else {
      setLinkedCompany(null);
      await fetchOrComputeSuggestions();
    }
  } catch (err) {
    console.error('Error fetching event link:', err);
  } finally {
    setLoading(false);
  }
}, [event?.id, event?.microsoftEventId, user]);
```

### Part 5: Update CalendarSidebar to use microsoftEventId for lookups

**File: `src/components/dashboard/CalendarSidebar.tsx`**

Update the `fetchLinks` effect to also lookup by Microsoft Event ID:

```typescript
const eventMsIds = useMemo(() => 
  events.map(e => (e as any).microsoftEventId).filter(Boolean), 
  [events]
);

useEffect(() => {
  if (!user || events.length === 0) return;
  const fetchLinks = async () => {
    // Fetch by both UUID and microsoft_event_id
    const { data } = await supabase
      .from('calendar_event_links')
      .select('calendar_event_id, microsoft_event_id, company_name')
      .eq('created_by', user.id)
      .or(`calendar_event_id.in.(${eventIds.join(',')}),microsoft_event_id.in.(${eventMsIds.join(',')})`);
    
    if (data) {
      const map = new Map<string, string>();
      // Build lookup map by both IDs
      data.forEach(row => {
        if (row.calendar_event_id) map.set(row.calendar_event_id, row.company_name);
        if (row.microsoft_event_id) map.set(row.microsoft_event_id, row.company_name);
      });
      setLinkedCompanyMap(map);
    }
  };
  fetchLinks();
}, [user, eventIds, eventMsIds]);
```

Update the lookup in EventGroup to check both:
```typescript
const companyName = linkedCompanyMap.get(event.id) || 
  linkedCompanyMap.get((event as any).microsoftEventId) || null;
```

### Part 6: Update EventGroup to pass microsoftEventId

**File: `src/components/dashboard/EventGroup.tsx`**

Ensure the event interface includes `microsoftEventId` and the lookup checks both keys.

---

## Files Changed Summary

| File | Change |
|------|--------|
| Migration SQL | Add `microsoft_event_id` column + index + backfill |
| `src/types/calendarLinking.ts` | Add `microsoftEventId` to interfaces |
| `src/hooks/useCalendarEventLinking.ts` | Store + lookup by `microsoft_event_id` with fallback |
| `src/components/dashboard/CalendarSidebar.tsx` | Lookup links by both UUID and MS ID |
| `src/components/dashboard/EventGroup.tsx` | Check both IDs when displaying linked company |

---

## How It Works After Fix

```text
BEFORE SYNC:
calendar_events:  id=abc-123, microsoft_event_id="AAMk..."
calendar_event_links: calendar_event_id=abc-123, microsoft_event_id="AAMk...", company="ComplyCo"

AFTER SYNC:
calendar_events:  id=xyz-789 (NEW UUID), microsoft_event_id="AAMk..." (SAME!)
calendar_event_links: calendar_event_id=abc-123 (stale), microsoft_event_id="AAMk..."

LOOKUP FLOW:
1. Try calendar_event_id=xyz-789 → No match
2. Try microsoft_event_id="AAMk..." → MATCH! 
3. Update calendar_event_id to xyz-789 for future lookups
4. Display "ComplyCo" linked ✓
```

---

## Success Criteria

1. Existing calendar-company links persist through calendar refreshes
2. New links store both the UUID and Microsoft Event ID
3. Lookup works seamlessly whether UUID is current or stale
4. No data loss for existing links (backfill migration)
