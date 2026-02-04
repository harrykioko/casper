
# One-Tap High-Confidence Entity Link Approval

## Overview

This plan introduces a lightweight "Suggested Links" section in the email drawer that allows users to accept or reject high-confidence entity link suggestions with a single tap, without opening any forms or modals.

---

## Current Behavior

1. When AI suggests a `LINK_COMPANY` action, clicking "Link" opens the `InlineLinkCompanyForm` composer
2. This is too heavy for high-confidence matches where the user just wants to confirm
3. All link suggestions (regardless of confidence) go through the same workflow

---

## Proposed Behavior

1. **High-confidence** `LINK_COMPANY` suggestions (confidence = "high") are displayed in a new "Suggested Links" section with accept/reject buttons
2. **Accept**: Immediately creates the link, updates UI, logs activity
3. **Reject**: Dismisses the suggestion, logs activity
4. **Lower-confidence** suggestions remain in "Suggested Actions" and open the link composer when clicked

---

## Technical Implementation

### 1. Update Activity Types

**File: `src/types/inboxActivity.ts`**

Add two new action types for tracking suggested link decisions:

```typescript
export type InboxActivityActionType =
  | 'link_company'
  | 'create_task'
  | 'create_commitment'
  | 'create_pipeline_company'
  | 'mark_complete'
  | 'archive'
  | 'snooze'
  | 'dismiss_suggestion'
  | 'add_note'
  | 'save_attachments'
  | 'accept_suggested_link'    // NEW
  | 'reject_suggested_link';   // NEW
```

**File: `src/hooks/useInboxItemActivity.ts`**

Add labels for the new action types:

```typescript
const ACTION_LABELS: Record<InboxActivityActionType, string> = {
  // ... existing labels ...
  accept_suggested_link: 'Linked via suggestion',
  reject_suggested_link: 'Dismissed suggested link',
};
```

### 2. Create SuggestedLinkCard Component

**New File: `src/components/inbox/SuggestedLinkCard.tsx`**

A compact approval card with:
- Entity name and type badge (pipeline/portfolio)
- Confidence indicator
- Optional one-line rationale (muted text)
- Accept button (check icon)
- Reject button (x icon)

```text
+-----------------------------------------------+
| [Building2] OatFi              Pipeline  High |
| Matched via domain: oatfi.com                 |
|                           [check] [x]         |
+-----------------------------------------------+
```

Key props:
- `companyId: string`
- `companyName: string`
- `companyType: "pipeline" | "portfolio"`
- `confidence: "high" | "medium" | "low"`
- `rationale?: string`
- `onAccept: () => void`
- `onReject: () => void`

Uses icon buttons with tooltips ("Link to [company]", "Dismiss suggestion").

### 3. Update InlineActionPanel

**File: `src/components/inbox/InlineActionPanel.tsx`**

#### A. Filter suggestions into two groups:

```typescript
const { highConfidenceLinkSuggestions, otherSuggestions } = useMemo(() => {
  const highConfLinks: StructuredSuggestion[] = [];
  const others: StructuredSuggestion[] = [];
  
  for (const s of suggestions) {
    // High-confidence LINK_COMPANY that is not already linked
    if (
      s.type === "LINK_COMPANY" &&
      s.confidence === "high" &&
      s.company_id &&
      s.company_id !== item.relatedCompanyId // Not already linked
    ) {
      highConfLinks.push(s);
    } else {
      others.push(s);
    }
  }
  
  return { highConfidenceLinkSuggestions: highConfLinks, otherSuggestions: others };
}, [suggestions, item.relatedCompanyId]);
```

#### B. Add "Suggested Links" section (above or below Suggested Actions):

```typescript
{/* Suggested Links Section */}
{highConfidenceLinkSuggestions.length > 0 && (
  <div>
    <SectionHeader>Suggested Links</SectionHeader>
    <div className="space-y-2">
      {highConfidenceLinkSuggestions.slice(0, 3).map((suggestion) => (
        <SuggestedLinkCard
          key={suggestion.id}
          companyId={suggestion.company_id!}
          companyName={suggestion.company_name!}
          companyType={suggestion.company_type!}
          confidence={suggestion.confidence}
          rationale={suggestion.rationale}
          onAccept={() => handleAcceptSuggestedLink(suggestion)}
          onReject={() => handleRejectSuggestedLink(suggestion)}
        />
      ))}
      {highConfidenceLinkSuggestions.length > 3 && (
        <p className="text-[10px] text-muted-foreground">
          +{highConfidenceLinkSuggestions.length - 3} more
        </p>
      )}
    </div>
    <div className="border-t border-border my-3" />
  </div>
)}
```

#### C. Add accept/reject handlers:

```typescript
const handleAcceptSuggestedLink = async (suggestion: StructuredSuggestion) => {
  if (!suggestion.company_id || !suggestion.company_name || !suggestion.company_type) return;
  
  // 1. Create the link immediately
  linkCompany(
    item.id,
    suggestion.company_id,
    suggestion.company_name,
    suggestion.company_type,
    null // logo URL - could be fetched if needed
  );
  
  // 2. Log activity
  await logActivity({
    inboxItemId: item.id,
    actionType: "accept_suggested_link",
    targetId: suggestion.company_id,
    targetType: suggestion.company_type === "pipeline" ? "pipeline_company" : "company",
    metadata: { companyName: suggestion.company_name },
  });
  refetchActivity();
  
  // 3. Dismiss the suggestion
  dismissSuggestion(suggestion.id);
  
  // 4. Show success toast
  toast.success(`Linked to ${suggestion.company_name}`);
};

const handleRejectSuggestedLink = async (suggestion: StructuredSuggestion) => {
  // 1. Dismiss the suggestion
  dismissSuggestion(suggestion.id);
  
  // 2. Log activity
  await logActivity({
    inboxItemId: item.id,
    actionType: "reject_suggested_link",
    targetId: suggestion.company_id || undefined,
    targetType: suggestion.company_type === "pipeline" ? "pipeline_company" : "company",
    metadata: { 
      companyName: suggestion.company_name,
      reason: "user_dismissed"
    },
  });
  refetchActivity();
};
```

#### D. Update "Suggested Actions" to use filtered list:

Change from:
```typescript
{suggestions.map((suggestion) => (
```

To:
```typescript
{otherSuggestions.map((suggestion) => (
```

### 4. Already-Linked Handling

The filtering logic already handles this:
```typescript
s.company_id !== item.relatedCompanyId
```

If the email is already linked to the suggested company, that suggestion will not appear in the "Suggested Links" section.

---

## UI Layout

The right panel will now have this structure:

```text
+----------------------------------+
| TAKE ACTION                      |
| [Create Task]                    |
| [Track Obligation]               |
| [Add Note]                       |
| [Link Company] -> Linked: Foo    |
| [Add to Pipeline]                |
| [Snooze v]                       |
| -------------------------------- |
| [Complete]  [Archive]            |
+----------------------------------+
| SUGGESTED LINKS                  |  <-- NEW
| +------------------------------+ |
| | OatFi           Pipeline High| |
| | Matched via domain           | |
| |                    [v] [x]   | |
| +------------------------------+ |
+----------------------------------+
| SUGGESTED ACTIONS                |
| (other suggestions here)         |
+----------------------------------+
| ACTIVITY                         |
+----------------------------------+
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/types/inboxActivity.ts` | Add `accept_suggested_link` and `reject_suggested_link` action types |
| `src/hooks/useInboxItemActivity.ts` | Add labels for new action types |
| `src/components/inbox/SuggestedLinkCard.tsx` | **NEW** - Compact approval card component |
| `src/components/inbox/InlineActionPanel.tsx` | Filter suggestions, add Suggested Links section, add accept/reject handlers |

---

## Activity Log Examples

**After accepting a suggested link:**
```
Linked via suggestion: OatFi (pipeline) - 2 minutes ago
```

**After rejecting a suggested link:**
```
Dismissed suggested link: OatFi - 2 minutes ago
```

---

## Edge Cases

1. **Email already linked to same company**: Suggestion hidden (via filter)
2. **Email already linked to different company**: Suggested Links still shows; accepting replaces the existing link
3. **No high-confidence link suggestions**: "Suggested Links" section not rendered
4. **More than 3 high-confidence suggestions**: Show first 3, display "+N more" indicator
5. **Suggestion has missing company_id**: Filtered out (won't appear in Suggested Links)

---

## What Stays the Same

- Manual "Link Company" button and `InlineLinkCompanyForm` workflow unchanged
- Low/medium confidence `LINK_COMPANY` suggestions still open the composer
- All other suggestion types (tasks, pipeline creation, etc.) unchanged
- Existing activity logging patterns preserved
