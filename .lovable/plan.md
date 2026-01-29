

# Add Logo and Navigation to Calendar Event Linked Companies

## Summary

Enhance the calendar event modal's "Linked Company" section to:
1. Display the company logo instead of the generic Building2 icon
2. Make the linked company clickable to navigate to its detail page
3. Store logo URL when linking so it's available on future opens

## Current State

In `EventDetailsModal.tsx` (lines 277-291):
- Uses a static `Building2` icon for all linked companies
- The linked company badge is not clickable
- `LinkedCompany` interface only stores: `companyId`, `companyName`, `companyType`
- Does NOT store `companyLogoUrl`

The `calendar_event_links` table columns:
- `company_id`, `company_type`, `company_name`
- No `company_logo_url` column

The `CompanySearchResult` interface (line 46-52 of `calendarLinking.ts`) already has `logoUrl: string | null`.

## Solution

Similar to the inbox linked entities enhancement:

1. **Add `company_logo_url` column** to `calendar_event_links` table
2. **Update types** to include logo URL in `LinkedCompany`
3. **Update hook** to persist logo when linking
4. **Update UI** to show logo and enable navigation

---

## File Changes

### 1. Database Migration

Add column to `calendar_event_links` table:

```sql
ALTER TABLE calendar_event_links 
ADD COLUMN company_logo_url TEXT;
```

### 2. Update `src/types/calendarLinking.ts`

Add `companyLogoUrl` to the `LinkedCompany` interface:

```typescript
export interface LinkedCompany {
  id: string;
  calendarEventId: string;
  companyId: string;
  companyType: 'pipeline' | 'portfolio';
  companyName: string;
  companyLogoUrl: string | null;  // NEW
  linkedBy: 'auto' | 'manual';
  confidence: number | null;
  createdBy: string;
  createdAt: string;
}
```

### 3. Update `src/hooks/useCalendarEventLinking.ts`

**Update `fetchLink` function (lines 38-49):**
Include the new logo field when mapping:

```typescript
if (data) {
  setLinkedCompany({
    id: data.id,
    calendarEventId: data.calendar_event_id,
    companyId: data.company_id,
    companyType: data.company_type as 'pipeline' | 'portfolio',
    companyName: data.company_name,
    companyLogoUrl: data.company_logo_url || null,  // NEW
    linkedBy: data.linked_by as 'auto' | 'manual',
    confidence: data.confidence,
    createdBy: data.created_by,
    createdAt: data.created_at,
  });
}
```

**Update `linkCompany` function (lines 222-258):**
Persist the logo URL when creating/updating the link:

```typescript
const linkCompany = useCallback(async (company: CompanySearchResult) => {
  if (!event?.id || !user) return;

  try {
    const { data, error } = await supabase
      .from('calendar_event_links')
      .upsert({
        calendar_event_id: event.id,
        company_id: company.id,
        company_type: company.type,
        company_name: company.name,
        company_logo_url: company.logoUrl || null,  // NEW
        linked_by: 'manual',
        confidence: 1.0,
        created_by: user.id,
      }, { onConflict: 'calendar_event_id,company_id,company_type' })
      .select()
      .single();

    if (error) throw error;

    setLinkedCompany({
      id: data.id,
      calendarEventId: data.calendar_event_id,
      companyId: data.company_id,
      companyType: data.company_type as 'pipeline' | 'portfolio',
      companyName: data.company_name,
      companyLogoUrl: data.company_logo_url || null,  // NEW
      linkedBy: data.linked_by as 'auto' | 'manual',
      confidence: data.confidence,
      createdBy: data.created_by,
      createdAt: data.created_at,
    });
    // ... rest unchanged
  }
}, [event?.id, user]);
```

### 4. Update `src/components/dashboard/EventDetailsModal.tsx`

**Add navigation import:**
```typescript
import { useNavigate } from "react-router-dom";
```

**Add navigation handler (inside component):**
```typescript
const navigate = useNavigate();

const handleCompanyClick = () => {
  if (linkedCompany) {
    const path = linkedCompany.companyType === 'pipeline' 
      ? `/pipeline/${linkedCompany.companyId}`
      : `/portfolio/${linkedCompany.companyId}`;
    navigate(path);
    onClose(); // Close modal after navigation
  }
};
```

**Update Linked Company Section (lines 276-291):**

Replace the current static badge with a clickable card showing logo:

```tsx
{/* Linked Company Section */}
{linkedCompany && (
  <div className="space-y-2">
    <p className="text-xs uppercase tracking-wide font-medium text-muted-foreground">Linked Company</p>
    <div className="flex items-center gap-2">
      <div 
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
        onClick={handleCompanyClick}
      >
        <Avatar className="h-5 w-5">
          <AvatarImage 
            src={linkedCompany.companyLogoUrl || undefined} 
            alt={linkedCompany.companyName} 
          />
          <AvatarFallback className="text-[9px] bg-background border border-border">
            {linkedCompany.companyName.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-foreground">
          {linkedCompany.companyName}
        </span>
        <span className="text-xs text-muted-foreground">({linkedCompany.companyType})</span>
      </div>
      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={unlinkCompany}>
        <Unlink className="h-3 w-3 text-muted-foreground" />
      </Button>
    </div>
  </div>
)}
```

### 5. Update Search Results Display (lines 338-356)

Also update the company search results to show logos:

```tsx
{searchResults.map(r => (
  <button
    key={`${r.type}-${r.id}`}
    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
    onClick={() => {
      linkCompany(r);
      setShowCompanySearch(false);
      setCompanyQuery('');
    }}
  >
    <Avatar className="h-5 w-5 flex-shrink-0">
      <AvatarImage src={r.logoUrl || undefined} alt={r.name} />
      <AvatarFallback className="text-[8px] bg-muted">
        {r.name.slice(0, 2).toUpperCase()}
      </AvatarFallback>
    </Avatar>
    <span className="text-sm truncate">{r.name}</span>
    <Badge variant="outline" className="text-[10px] px-1.5 py-0 ml-auto">{r.type}</Badge>
  </button>
))}
```

### 6. Update Suggestion Cards (lines 294-322)

Update suggestions to show logos from the company when available. Since suggestions don't have logos stored, we can show initials:

```tsx
{suggestions.map(s => (
  <div key={s.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-background/50 border border-muted/30">
    <div className="flex items-center gap-2 min-w-0">
      <Avatar className="h-6 w-6 flex-shrink-0">
        <AvatarFallback className="text-[9px] bg-muted">
          {s.companyName.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{s.companyName}</p>
        <p className="text-xs text-muted-foreground">
          {s.matchReason === 'domain_match' ? `Domain: ${s.matchedDomain}` : 'Title match'}
          {' '}<span className="text-muted-foreground/60">({s.companyType})</span>
        </p>
      </div>
    </div>
    {/* ... buttons unchanged */}
  </div>
))}
```

---

## Files Changed Summary

| File | Change |
|------|--------|
| `supabase/migrations/xxx_add_calendar_link_logo.sql` | Add `company_logo_url` column |
| `src/types/calendarLinking.ts` | Add `companyLogoUrl` to `LinkedCompany` interface |
| `src/hooks/useCalendarEventLinking.ts` | Persist and read logo URL |
| `src/components/dashboard/EventDetailsModal.tsx` | Add navigation, show logo, make clickable |

---

## Visual Design

```text
Before:
┌─────────────────────────────────────────────┐
│  LINKED COMPANY                             │
│  ┌────────────────────────────────────┐     │
│  │ [Building2] ComplyCo (pipeline) [x]│     │
│  └────────────────────────────────────┘     │
└─────────────────────────────────────────────┘

After:
┌─────────────────────────────────────────────┐
│  LINKED COMPANY                             │
│  ┌────────────────────────────────────┐     │
│  │ [LOGO] ComplyCo (pipeline)      [x]│     │
│  └────────────────────────────────────┘     │
│         ↑ clickable, navigates to           │
│           /pipeline/{companyId}             │
└─────────────────────────────────────────────┘
```

---

## Expected Result

1. **Logo display** - Company logo shown (Avatar with initials fallback) instead of Building2 icon
2. **Clickable navigation** - Clicking linked company navigates to `/pipeline/:id` or `/portfolio/:id`
3. **Modal closes** - Modal closes automatically after navigation
4. **Persisted logos** - Logo URL stored in database so it's available on future opens
5. **Consistent UX** - Matches the inbox linked entities pattern

