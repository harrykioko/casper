

# Add "Add to Pipeline" Action to Email Drawer

## Problem

The inline action panel in the email drawer is missing a button to create a new pipeline company. The screenshot shows actions for:
- Create Task
- Add Note  
- Link Company
- Snooze
- Complete
- Archive

But there's no "Add to Pipeline" action for when a user receives an intro email about a company they want to add to their deal pipeline.

## Solution

Add the "Add to Pipeline" action button and create an inline form component that mirrors the existing modal functionality but fits within the new inline action pattern.

---

## Changes Required

### 1. Create `InlineCreatePipelineForm` Component

**New File:** `src/components/inbox/inline-actions/InlineCreatePipelineForm.tsx`

This form will be an inline version of the existing `CreatePipelineFromInboxModal.tsx` with these fields:
- **Company Name** (required)
- **Domain** (optional)
- **Stage/Round** (dropdown: Seed, Series A, B, C, etc.)
- **Source** (prefilled from email context)
- **Primary Contact** (name and email)
- **Notes** (textarea for context)

The form will:
- Prefill from AI-extracted metadata when available
- Create the pipeline company via `usePipeline` hook
- Create a primary contact via `pipeline_contacts` table
- Create an initial note via `pipeline_interactions` table
- Show AI rationale if triggered from a suggestion
- Auto-link the email to the new company after creation

### 2. Update Barrel Export

**File:** `src/components/inbox/inline-actions/index.ts`

Add export for the new component:
```typescript
export { InlineCreatePipelineForm } from "./InlineCreatePipelineForm";
```

### 3. Add Action Button to `InlineActionPanel`

**File:** `src/components/inbox/InlineActionPanel.tsx`

Add import for `Plus` icon and the new form component.

Add a new action button after "Link Company":
```tsx
<ActionButton
  icon={Plus}
  label="Add to Pipeline"
  onClick={() => handleSelectAction("create_pipeline")}
  isActive={activeAction === "create_pipeline"}
/>

{/* Inline Create Pipeline Form */}
<AnimatePresence>
  {activeAction === "create_pipeline" && (
    <InlineCreatePipelineForm
      emailItem={item}
      prefill={prefillData as any}
      suggestion={activeSuggestion}
      onConfirm={handleConfirmCreatePipeline}
      onCancel={handleCancelAction}
    />
  )}
</AnimatePresence>
```

### 4. Add Handler for Pipeline Creation

**File:** `src/components/inbox/InlineActionPanel.tsx`

Add the `handleConfirmCreatePipeline` function that:
1. Creates the pipeline company using `usePipeline` hook
2. Creates the primary contact if provided
3. Creates initial note if provided
4. Links the inbox item to the new company
5. Shows success state with link to pipeline detail page

```tsx
const handleConfirmCreatePipeline = async (data: {
  companyName: string;
  domain?: string;
  stage: RoundEnum;
  source?: string;
  contactName?: string;
  contactEmail?: string;
  notes?: string;
}) => {
  // 1. Create company
  const newCompany = await createCompany({...});
  
  // 2. Create contact if provided
  if (data.contactName) { ... }
  
  // 3. Create initial note if provided
  if (data.notes) { ... }
  
  // 4. Link email to new company
  linkCompany(item.id, newCompany.id, data.companyName, "pipeline", null);
  
  // 5. Show success state
  handleActionSuccess("create_pipeline", {
    id: newCompany.id,
    name: data.companyName,
    link: `/pipeline/${newCompany.id}`,
  });
};
```

### 5. Update Suggestion Handler

**File:** `src/components/inbox/InlineActionPanel.tsx`

Update the `CREATE_PIPELINE_COMPANY` case in `handleSuggestionSelect` to:
1. Set the active action to `"create_pipeline"`
2. Prefill form data from the suggestion metadata:
   - `extracted_company_name`
   - `extracted_domain`
   - `primary_contact_name`
   - `primary_contact_email`
   - `description_oneliner`
   - `notes_summary`
   - `intro_source`

Current placeholder code:
```tsx
case "CREATE_PIPELINE_COMPANY":
  // For now, open link company - full pipeline form TBD
  setActiveAction("link_company");
  toast.info("Add to Pipeline feature coming soon - use Link Company for now");
  break;
```

New implementation:
```tsx
case "CREATE_PIPELINE_COMPANY":
  setActiveAction("create_pipeline");
  const metadata = suggestion.metadata as CreatePipelineCompanyMetadata;
  setPrefillData({
    companyName: metadata?.extracted_company_name || "",
    domain: metadata?.extracted_domain || "",
    contactName: metadata?.primary_contact_name || "",
    contactEmail: metadata?.primary_contact_email || "",
    notes: metadata?.notes_summary || "",
    source: metadata?.intro_source || "",
    rationale: suggestion.rationale,
    confidence: suggestion.confidence,
  });
  break;
```

---

## Form Design

The inline form will be compact but complete:

```
┌─────────────────────────────────────────┐
│ + Add to Pipeline                       │
│                                         │
│ [AI Rationale if from suggestion]       │
│                                         │
│ Company Name *                          │
│ ┌─────────────────────────────────────┐ │
│ │ Pine                                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Domain          Stage                   │
│ ┌──────────┐   ┌──────────────────┐    │
│ │pine.com  │   │ Series B ▾       │    │
│ └──────────┘   └──────────────────┘    │
│                                         │
│ ─── Primary Contact ───                 │
│ Name            Email                   │
│ ┌──────────┐   ┌──────────────────┐    │
│ │Seth      │   │ seth@pine.com    │    │
│ └──────────┘   └──────────────────┘    │
│                                         │
│ Notes (optional)                        │
│ ┌─────────────────────────────────────┐ │
│ │ Series B intro from Harrison       │ │
│ └─────────────────────────────────────┘ │
│                                         │
│        [Cancel]  [✓ Add to Pipeline]    │
└─────────────────────────────────────────┘
```

---

## Files Summary

| File | Action |
|------|--------|
| `src/components/inbox/inline-actions/InlineCreatePipelineForm.tsx` | Create |
| `src/components/inbox/inline-actions/index.ts` | Modify |
| `src/components/inbox/InlineActionPanel.tsx` | Modify |

---

## Technical Notes

- Reuse `usePipeline` hook for company creation
- Reuse `RoundEnum` type for stage dropdown
- Direct Supabase calls for contact and interaction creation (same pattern as modal)
- Form follows same motion animation pattern as other inline forms
- Keyboard shortcuts: Escape to cancel, Cmd+Enter to submit

