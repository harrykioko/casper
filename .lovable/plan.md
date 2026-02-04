

# Fix: Track Obligation Button Not Working

## Problem

Clicking the "Track Obligation" button in the inbox drawer does nothing because the `InlineCommitmentForm` is conditionally rendered only when **both**:

1. `activeAction === "create_commitment"` 
2. `activeSuggestion` is truthy

When clicking the button directly, `activeSuggestion` is `null`, so the form never appears.

---

## Root Cause

```tsx
// Line 593 - Current condition
{activeAction === "create_commitment" && activeSuggestion && (
  <InlineCommitmentForm ... />
)}
```

The form was designed primarily for AI suggestions, not for manual button activation.

---

## Solution

Make the `InlineCommitmentForm` work without requiring a suggestion by:

1. Making the `suggestion` prop optional
2. Creating a fallback draft builder for manual creation
3. Removing the `activeSuggestion` requirement from the render condition

---

## Technical Changes

### 1. Update InlineCommitmentForm Props

**File: `src/components/inbox/inline-actions/InlineCommitmentForm.tsx`**

Make `suggestion` optional and provide sensible defaults when creating manually:

```typescript
interface InlineCommitmentFormProps {
  emailItem: InboxItem;
  suggestion?: StructuredSuggestion | null; // Now optional
  onConfirm: (data: CommitmentFormData) => Promise<void>;
  onCancel: () => void;
}
```

Update the draft initialization to handle missing suggestion:

```typescript
// Build draft - with or without suggestion
const initialDraft = suggestion 
  ? buildCommitmentDraftFromSuggestion(emailItem, suggestion)
  : buildManualCommitmentDraft(emailItem);
```

### 2. Add Manual Draft Builder

**File: `src/lib/inbox/buildTaskDraft.ts`**

Add a new function for creating a commitment draft without a suggestion:

```typescript
export function buildManualCommitmentDraft(item: InboxItem): CommitmentDraft {
  return {
    title: "",
    content: item.preview || item.subject || "",
    context: buildCommitmentContextFromEmail(item),
    counterpartyName: item.senderName || "",
    direction: "owed_to_me",
    dueDate: null,
    companyId: item.relatedCompanyId || undefined,
    companyName: item.relatedCompanyName || undefined,
    companyType: item.relatedCompanyType || undefined,
    sourceEmailId: item.id,
    alsoCreateTask: false,
  };
}
```

### 3. Fix Render Condition

**File: `src/components/inbox/InlineActionPanel.tsx`**

Remove the `activeSuggestion` requirement:

```tsx
// Before
{activeAction === "create_commitment" && activeSuggestion && (

// After  
{activeAction === "create_commitment" && (
```

And update the component invocation to pass optional suggestion:

```tsx
<InlineCommitmentForm
  emailItem={item}
  suggestion={activeSuggestion}  // Can be null now
  onConfirm={handleConfirmCommitment}
  onCancel={handleCancelAction}
/>
```

### 4. Hide Rationale Block When No Suggestion

**File: `src/components/inbox/inline-actions/InlineCommitmentForm.tsx`**

Only show the rationale block when there is a suggestion with rationale:

```tsx
{/* Rationale from suggestion - only if present */}
{suggestion?.rationale && (
  <div className="p-2 rounded bg-background/80 border border-border">
    <p className="text-[10px] text-muted-foreground italic">
      {suggestion.rationale}
    </p>
  </div>
)}
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/inbox/inline-actions/InlineCommitmentForm.tsx` | Make `suggestion` optional, add fallback defaults, conditionally show rationale |
| `src/lib/inbox/buildTaskDraft.ts` | Add `buildManualCommitmentDraft()` function |
| `src/components/inbox/InlineActionPanel.tsx` | Remove `activeSuggestion` requirement from render condition |

---

## Result

After this fix:
- Clicking "Track Obligation" button opens an empty commitment form pre-filled with sender info
- Clicking a CREATE_WAITING_ON suggestion still opens the form with AI-extracted data and rationale
- Both paths lead to the same inline form experience

