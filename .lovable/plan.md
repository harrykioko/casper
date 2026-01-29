

# Fix: Logo Not Displaying for Linked Calendar Event Companies

## Problem

The ComplyCo link shows initials instead of the logo because:

1. **Database shows NULL logo**: The `calendar_event_links` row has `company_logo_url = NULL`
2. **Link was created before logo support**: This link was created before we added the `company_logo_url` column
3. **`acceptSuggestion` bug**: When accepting suggestions, the code passes `logoUrl: null` instead of fetching the actual logo

## Database Evidence

```
calendar_event_links:
- company_name: ComplyCo
- company_logo_url: NULL  ← Missing!

pipeline_companies:
- company_name: ComplyCo  
- logo_url: https://www.google.com/s2/favicons?domain=complyco.com&sz=128  ← Logo exists!
```

## Solution

### Part A: Fix the `acceptSuggestion` function

When accepting a suggestion, fetch the company's logo before creating the link.

**File: `src/hooks/useCalendarEventLinking.ts`**

Update the `acceptSuggestion` function (around line 285-307):

```typescript
const acceptSuggestion = useCallback(async (suggestion: CompanySuggestion) => {
  if (!event?.id || !user) return;

  try {
    // Update suggestion status
    await supabase
      .from('calendar_event_link_suggestions')
      .update({ status: 'accepted' })
      .eq('id', suggestion.id);

    // Fetch the company's logo before linking
    let logoUrl: string | null = null;
    if (suggestion.companyType === 'pipeline') {
      const { data } = await supabase
        .from('pipeline_companies')
        .select('logo_url')
        .eq('id', suggestion.companyId)
        .single();
      logoUrl = data?.logo_url || null;
    } else {
      const { data } = await supabase
        .from('companies')
        .select('logo_url')
        .eq('id', suggestion.companyId)
        .single();
      logoUrl = data?.logo_url || null;
    }

    // Create the actual link with the logo
    await linkCompany({
      id: suggestion.companyId,
      name: suggestion.companyName,
      type: suggestion.companyType,
      primaryDomain: suggestion.matchedDomain,
      logoUrl: logoUrl,  // Now includes actual logo!
    });
  } catch (err) {
    console.error('Error accepting suggestion:', err);
    toast.error('Failed to accept suggestion');
  }
}, [event?.id, user, linkCompany]);
```

### Part B: Add fallback in display logic

When rendering the linked company, if `companyLogoUrl` is null, look it up from the parent company table as a fallback.

**File: `src/components/dashboard/EventDetailsModal.tsx`**

Add a fallback logo fetch when the linked company doesn't have a stored logo:

```typescript
// Add state for fallback logo
const [fallbackLogoUrl, setFallbackLogoUrl] = useState<string | null>(null);

// Fetch fallback logo if linkedCompany has no logo
useEffect(() => {
  if (linkedCompany && !linkedCompany.companyLogoUrl) {
    const fetchFallbackLogo = async () => {
      const table = linkedCompany.companyType === 'pipeline' 
        ? 'pipeline_companies' 
        : 'companies';
      const { data } = await supabase
        .from(table)
        .select('logo_url')
        .eq('id', linkedCompany.companyId)
        .single();
      if (data?.logo_url) {
        setFallbackLogoUrl(data.logo_url);
      }
    };
    fetchFallbackLogo();
  } else {
    setFallbackLogoUrl(null);
  }
}, [linkedCompany]);

// Use in Avatar
const displayLogoUrl = linkedCompany?.companyLogoUrl || fallbackLogoUrl;
```

Then update the Avatar to use `displayLogoUrl`:

```tsx
<Avatar className="h-5 w-5">
  <AvatarImage 
    src={displayLogoUrl || undefined} 
    alt={linkedCompany.companyName} 
  />
  <AvatarFallback className="text-[9px] bg-background border border-border">
    {linkedCompany.companyName.slice(0, 2).toUpperCase()}
  </AvatarFallback>
</Avatar>
```

### Part C: Backfill existing links (one-time data fix)

Run a migration to update existing links with their company logos:

```sql
-- Backfill pipeline company logos
UPDATE calendar_event_links cel
SET company_logo_url = pc.logo_url
FROM pipeline_companies pc
WHERE cel.company_id = pc.id
  AND cel.company_type = 'pipeline'
  AND cel.company_logo_url IS NULL
  AND pc.logo_url IS NOT NULL;

-- Backfill portfolio company logos  
UPDATE calendar_event_links cel
SET company_logo_url = c.logo_url
FROM companies c
WHERE cel.company_id = c.id
  AND cel.company_type = 'portfolio'
  AND cel.company_logo_url IS NULL
  AND c.logo_url IS NOT NULL;
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/useCalendarEventLinking.ts` | Fix `acceptSuggestion` to fetch logo before linking |
| `src/components/dashboard/EventDetailsModal.tsx` | Add fallback logo fetch for existing links |
| `supabase/migrations/xxx_backfill_calendar_link_logos.sql` | Backfill existing links with logos |

## Expected Result

- ComplyCo (and other existing links) will display their logos immediately after the backfill
- Future links created via suggestion acceptance will include the logo
- The UI has a fallback mechanism to fetch logos for any links that don't have them stored

