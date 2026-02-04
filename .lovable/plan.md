
# Email Drawer Action UI Refactor

## Overview

This plan refactors the Email Detail Drawer to support inline, confirmable actions without detached modals. The key changes are:
1. Widen the drawer to accommodate form-based actions
2. Replace the Action Rail with an Inline Action Panel that expands to show forms
3. Ensure AI suggestions reuse the same inline action composer
4. Maintain the principle that actions do not automatically clear emails

---

## Part 1: Widen the Email Drawer

### Current State
- Default width: 720px
- Min width: 600px
- Max width: 1200px
- Two-column layout: Content (flexible) + Action Rail (240px/280px)

### Changes

**Files: `src/components/inbox/GlobalInboxDrawerOverlay.tsx` and `src/components/focus/TriageInboxDrawer.tsx`**

Update width constants:
```text
DEFAULT_WIDTH: 720 → 900
MIN_WIDTH: 600 → 800
MAX_WIDTH: 1200 → 1400
```

**File: `src/components/inbox/InboxDetailWorkspace.tsx`**

Update action panel width:
```text
w-[240px] xl:w-[280px] → w-[320px] xl:w-[380px]
```

---

## Part 2: Create Inline Action Panel Component

### New Component Structure

Create a new component that replaces `InboxActionRail` with an expandable inline action system.

**New File: `src/components/inbox/InlineActionPanel.tsx`**

This component will:
1. Display a collapsed "Take Action" section with canonical action buttons
2. When an action is selected, expand an inline form below the action list
3. Only one action may be active at a time
4. Include Confirm and Cancel buttons within the form

### Component Architecture

```text
InlineActionPanel
├── ActionHeader (collapsed state)
│   └── Action buttons: Create Task, Add Note, Link Company, etc.
├── ActiveActionForm (expanded when action selected)
│   ├── Form fields based on action type
│   ├── Confirm button
│   └── Cancel button
├── AI Suggestions Section
│   └── SuggestionCard (clicking prefills the form)
└── Activity Section (unchanged)
```

### State Management

```tsx
interface InlineActionPanelState {
  activeAction: ActionType | null;  // null = collapsed
  formData: Record<string, unknown>;
  isSubmitting: boolean;
  successResult: ActionResult | null;  // For success state with link
}

type ActionType = 
  | "create_task"
  | "add_note"
  | "link_company"
  | "create_pipeline"
  | "save_attachments";
```

---

## Part 3: Implement Action-Specific Inline Forms

### 3.1 Create Task Form

Reuse form logic from `AddTaskDialog.tsx`:
- Task title input (prefilled from email subject or suggestion)
- Initial note textarea
- Company selector (reuse `CompanySelector` component)

### 3.2 Link Company Form

Adapt from `LinkCompanyModal.tsx`:
- Search input
- Scrollable company list (pipeline + portfolio)
- Selected company indicator

### 3.3 Create Pipeline Company Form

Adapt from `CreatePipelineFromInboxModal.tsx`:
- Company name input
- Domain input
- Stage selector
- Primary contact fields
- Notes textarea

### 3.4 Add Note Form

Simple form:
- Note content textarea
- Optional: link to company

### 3.5 Save Attachments Form

Adapt from `SaveAttachmentsModal.tsx`:
- Attachment checkboxes
- Company selector (if not already linked)

---

## Part 4: Create Inline Form Components

**New File: `src/components/inbox/inline-actions/InlineTaskForm.tsx`**

```tsx
interface InlineTaskFormProps {
  emailItem: InboxItem;
  prefill?: { title?: string; description?: string; companyId?: string };
  onConfirm: (taskData: TaskCreateData) => Promise<void>;
  onCancel: () => void;
}
```

**New File: `src/components/inbox/inline-actions/InlineLinkCompanyForm.tsx`**

**New File: `src/components/inbox/inline-actions/InlineCreatePipelineForm.tsx`**

**New File: `src/components/inbox/inline-actions/InlineNoteForm.tsx`**

**New File: `src/components/inbox/inline-actions/InlineSaveAttachmentsForm.tsx`**

---

## Part 5: Update InboxDetailWorkspace

**File: `src/components/inbox/InboxDetailWorkspace.tsx`**

Replace `InboxActionRail` with `InlineActionPanel`:

```tsx
// Before
<InboxActionRail
  item={item}
  onCreateTask={onCreateTask}
  // ...modal-triggering handlers
/>

// After
<InlineActionPanel
  item={item}
  attachmentCount={attachmentCount}
  // Pass data hooks directly for inline operations
/>
```

The key change: instead of passing modal-triggering handlers, the panel will handle all operations internally and show success states inline.

---

## Part 6: Success State Component

**New File: `src/components/inbox/inline-actions/ActionSuccessState.tsx`**

After successful action completion:
- Show checkmark icon + success message
- Include link to created object (e.g., "View Task →")
- "Do Another" button to reset form
- Auto-dismiss after 3 seconds (optional)

```tsx
interface ActionSuccessStateProps {
  actionType: ActionType;
  result: {
    id: string;
    name: string;
    link?: string;
  };
  onDismiss: () => void;
  onDoAnother: () => void;
}
```

---

## Part 7: AI Suggestions Integration

**File: `src/components/inbox/InlineActionPanel.tsx`**

When a suggestion is clicked:
1. Determine the corresponding action type
2. Set `activeAction` to that type
3. Prefill form fields from suggestion data
4. Display rationale and confidence below form fields

```tsx
const handleSuggestionSelect = (suggestion: StructuredSuggestion) => {
  switch (suggestion.type) {
    case "CREATE_FOLLOW_UP_TASK":
    case "CREATE_PERSONAL_TASK":
    case "CREATE_INTRO_TASK":
      setActiveAction("create_task");
      setFormData({
        title: suggestion.title,
        rationale: suggestion.rationale,
        confidence: suggestion.confidence,
      });
      break;
    case "LINK_COMPANY":
      setActiveAction("link_company");
      setFormData({ preselectedCompanyId: suggestion.company_id });
      break;
    // ... other cases
  }
};
```

AI suggestions never auto-confirm. Users must explicitly click "Confirm" after reviewing the prefilled form.

---

## Part 8: Update Handler Architecture

### Current Flow (Modal-Based)
```text
User clicks "Create Task" → Opens AddTaskDialog modal → User fills form → Submits → Modal closes
```

### New Flow (Inline)
```text
User clicks "Create Task" → Form expands inline → User fills/edits → Clicks "Confirm" → Success state shown inline → User can dismiss or do another action
```

### Changes to Parent Components

**File: `src/pages/Inbox.tsx`**

Remove modal state management for:
- `isTaskDialogOpen`, `taskPrefill`
- `linkCompanyItem`
- `saveAttachmentsItem`
- `pipelineModalItem`

Remove modal rendering at bottom of component.

**File: `src/components/focus/TriageInboxDrawer.tsx`**

Same cleanup - remove modal state and modal components.

---

## Part 9: File Changes Summary

### New Files
| File | Purpose |
|------|---------|
| `src/components/inbox/InlineActionPanel.tsx` | Main action panel component |
| `src/components/inbox/inline-actions/InlineTaskForm.tsx` | Task creation form |
| `src/components/inbox/inline-actions/InlineLinkCompanyForm.tsx` | Company linking form |
| `src/components/inbox/inline-actions/InlineCreatePipelineForm.tsx` | Pipeline company creation |
| `src/components/inbox/inline-actions/InlineNoteForm.tsx` | Note creation form |
| `src/components/inbox/inline-actions/InlineSaveAttachmentsForm.tsx` | Attachment saving form |
| `src/components/inbox/inline-actions/ActionSuccessState.tsx` | Success state display |
| `src/components/inbox/inline-actions/index.ts` | Barrel export |

### Modified Files
| File | Changes |
|------|---------|
| `src/components/inbox/GlobalInboxDrawerOverlay.tsx` | Increase width constants |
| `src/components/focus/TriageInboxDrawer.tsx` | Increase width constants, remove modals |
| `src/components/inbox/InboxDetailWorkspace.tsx` | Replace ActionRail with InlineActionPanel, update widths |
| `src/pages/Inbox.tsx` | Remove modal state and rendering |
| `src/contexts/GlobalInboxDrawerContext.tsx` | Simplify handler interface (fewer modal triggers) |

### Files to Deprecate (can be removed later)
| File | Reason |
|------|--------|
| `src/components/inbox/InboxActionRail.tsx` | Replaced by InlineActionPanel |

Note: Keep `LinkCompanyModal.tsx`, `SaveAttachmentsModal.tsx`, `CreatePipelineFromInboxModal.tsx`, and `AddTaskDialog.tsx` for now as they may be used elsewhere. Mark as candidates for removal in future cleanup.

---

## Part 10: Implementation Order

1. Create inline-actions directory and base components
2. Build `InlineTaskForm` (most common action)
3. Build `ActionSuccessState` component
4. Create `InlineActionPanel` with task form integration
5. Update `InboxDetailWorkspace` to use new panel
6. Test task creation flow end-to-end
7. Build remaining inline forms (link company, pipeline, note, attachments)
8. Integrate AI suggestions with form prefilling
9. Update width constants in drawer components
10. Clean up modal state from parent components
11. Update handler interfaces

---

## Technical Details

### Form Validation
Each inline form will handle its own validation:
- Required field checks before enabling Confirm button
- Error states displayed inline below fields
- No blocking alerts

### Keyboard Navigation
- Escape key cancels active form and returns to collapsed state
- Enter key submits form (when valid)
- Tab navigation through form fields

### Animations
- Use Framer Motion for smooth expand/collapse transitions
- Match existing glassmorphic design language
- Subtle fade-in for success state

### Mobile Behavior
Note from memory: This is a desktop-focused application. The inline action panel will work at 1280px+ widths. On narrower viewports, the drawer may need to be near-full-width to accommodate the wider action panel.

---

## Visual Design

### Collapsed State
```text
┌─────────────────────────────────────────┐
│ TAKE ACTION                             │
├─────────────────────────────────────────┤
│ [🗒️ Create Task]  [📝 Add Note]         │
│ [🏢 Link Company] [💾 Save Files]       │
│ [➕ Add to Pipeline]                     │
├─────────────────────────────────────────┤
│ ─────────────────────────────────────── │
├─────────────────────────────────────────┤
│ ✨ SUGGESTED ACTIONS (3)         [AI]   │
│ ┌───────────────────────────────────┐   │
│ │ [Task] Follow up on intro         │   │
│ │ ~5min • medium confidence         │   │
│ │ [Create] [Edit] [×]               │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Expanded State (Task Form Active)
```text
┌─────────────────────────────────────────┐
│ TAKE ACTION                             │
├─────────────────────────────────────────┤
│ [🗒️ Create Task ●]  [📝] [🏢] [💾]      │
├─────────────────────────────────────────┤
│ ┌───────────────────────────────────┐   │
│ │ Task                              │   │
│ │ ┌─────────────────────────────┐   │   │
│ │ │ Follow up on intro          │   │   │
│ │ └─────────────────────────────┘   │   │
│ │                                   │   │
│ │ Initial note (optional)          │   │
│ │ ┌─────────────────────────────┐   │   │
│ │ │                             │   │   │
│ │ └─────────────────────────────┘   │   │
│ │                                   │   │
│ │ Company                          │   │
│ │ [Acme Corp ▾]                    │   │
│ │                                   │   │
│ │        [Cancel]  [✓ Confirm]     │   │
│ └───────────────────────────────────┘   │
├─────────────────────────────────────────┤
│ ─────────────────────────────────────── │
│ ✨ SUGGESTED ACTIONS...                 │
└─────────────────────────────────────────┘
```

### Success State
```text
┌─────────────────────────────────────────┐
│ ┌───────────────────────────────────┐   │
│ │ ✓ Task created                    │   │
│ │                                   │   │
│ │ "Follow up on intro"              │   │
│ │                                   │   │
│ │ [View Task →]  [Do Another]       │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## Non-Goals Preserved

- No new action types introduced
- No data schema changes
- No new modal patterns (removing modals, not adding)
- No changes to unrelated surfaces
- Clearing behavior unchanged (separate explicit action)
