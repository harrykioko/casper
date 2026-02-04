

# Fix Task Triage Entry Criteria and Task Update Persistence

## Problem Summary

The user has identified **two distinct issues**:

1. **Wrong Triage Entry Criteria**: Tasks with deadlines (`scheduled_for`) and other enrichment context are appearing in the Triage queue when they shouldn't. The current logic only checks if a task is "unlinked" (no project/company), but doesn't consider whether the task is already enriched with useful metadata.

2. **Task Updates Not Persisting**: When editing a task in the Triage drawer (adding project, category, deadline, company), clicking "Save Changes" doesn't actually persist these updates to the database. The task remains unchanged in the main Tasks list.

---

## Root Cause Analysis

### Issue 1: Triage Entry Criteria Too Broad

**Current trigger logic** (in `supabase/migrations/20260130200000_focus_auto_ingest_triggers.sql`):
```sql
IF NEW.project_id IS NULL AND NEW.company_id IS NULL AND NEW.pipeline_company_id IS NULL THEN
  -- Create work_item with 'unlinked_company' reason
```

**Problem**: This only checks for entity links, ignoring whether the task has:
- A `scheduled_for` date (deadline)
- A `priority` set
- A `category_id` assigned

Tasks with these properties are already "enriched" and shouldn't require triage just because they lack a company/project link.

### Issue 2: Task Update Data Transformation Bug

**The flow**:
1. `TriageTaskDrawer.tsx` calls `useTaskDetails()` hook which tracks form state
2. On save, it calls `createUpdatedTask()` which returns a `Task` object with:
   - `project: { id, name, color }` (object)
   - `category: "Category Name"` (string name)
3. `TriageQueue.tsx` passes this to `updateTask(id, updates)` from raw `useTasks` hook
4. `transformTaskForDatabase()` runs and:
   - Looks for `projectId` (camelCase) → not found, so `project_id` never set
   - The `project` object is passed through to Supabase → rejected as invalid column
   - Deletes `category` string → but never resolves it to `category_id`

**Contrast with Tasks page**: The Tasks page uses `useTasksManager.tsx` which:
- Correctly extracts `project?.id` to `project_id`
- Calls `getCategoryIdByName(category)` to resolve to `category_id`

---

## Solution

### Part 1: Smarter Triage Entry Criteria

Update the PostgreSQL trigger to skip creating work_items for tasks that are already "enriched" with metadata.

**New criteria**: Only create a work_item if the task:
1. Has no project link AND no company link AND no pipeline company link, **AND**
2. Has no `scheduled_for` date (deadline), **AND**
3. Has no `priority` set

If a task has a deadline or priority, it's considered "planned" and doesn't need triage.

**File: New migration** `supabase/migrations/[timestamp]_smarter_task_triage_criteria.sql`

```sql
CREATE OR REPLACE FUNCTION public.trigger_ingest_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create work_item for tasks that are:
  -- 1. Not linked to a project or company
  -- 2. Not already enriched with deadline or priority
  IF NEW.project_id IS NULL 
     AND NEW.company_id IS NULL 
     AND NEW.pipeline_company_id IS NULL
     AND NEW.scheduled_for IS NULL
     AND NEW.priority IS NULL
  THEN
    INSERT INTO public.work_items (created_by, source_type, source_id, status, reason_codes, priority)
    VALUES (
      NEW.created_by,
      'task',
      NEW.id,
      'needs_review',
      ARRAY['unlinked_company'],
      2
    )
    ON CONFLICT (source_type, source_id, created_by) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
```

Also update the backfill logic in `useBackfillWorkItems.ts` to match:

```typescript
// Only backfill tasks that are unlinked AND unenriched
if (!task.project_id && !task.company_id && !task.pipeline_company_id 
    && !task.scheduled_for && !task.priority) {
  const result = await ensureWorkItem("task", task.id, userId);
  if (result?.isNew) created++;
}
```

### Part 2: Add Auto-Exit Trigger When Task Becomes Enriched

Create a new trigger that marks work_items as "trusted" when a task gets enriched (project linked, deadline set, etc.).

**File: New migration** (same file as above)

```sql
CREATE OR REPLACE FUNCTION public.trigger_auto_exit_enriched_task()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- If task now has a link or enrichment, exit from triage
  IF (NEW.project_id IS NOT NULL AND OLD.project_id IS NULL)
     OR (NEW.company_id IS NOT NULL AND OLD.company_id IS NULL)
     OR (NEW.pipeline_company_id IS NOT NULL AND OLD.pipeline_company_id IS NULL)
     OR (NEW.scheduled_for IS NOT NULL AND OLD.scheduled_for IS NULL)
  THEN
    UPDATE public.work_items
    SET status = 'trusted',
        trusted_at = now(),
        reviewed_at = now(),
        last_touched_at = now(),
        updated_at = now(),
        reason_codes = ARRAY[]::text[]
    WHERE source_type = 'task'
      AND source_id = NEW.id
      AND created_by = NEW.created_by
      AND status NOT IN ('trusted', 'ignored');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_exit_enriched_task ON public.tasks;
CREATE TRIGGER trg_auto_exit_enriched_task
  AFTER UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_auto_exit_enriched_task();
```

### Part 3: Fix Task Update Persistence in Triage Drawer

Update `TriageTaskDrawer.tsx` to properly transform the task data before calling `updateTask`.

**File: `src/components/focus/TriageTaskDrawer.tsx`**

Current flow:
```typescript
const handleSave = () => {
  const updatedTask = createUpdatedTask();
  onUpdateTask(task.id, updatedTask); // Passes raw Task object
};
```

New flow using proper transformation:
```typescript
const handleSave = async () => {
  if (!task) return;
  
  // Build the proper database update payload
  const updates = {
    content,
    status,
    completed: status === "done",
    priority,
    scheduled_for: scheduledFor?.toISOString() || null,
    project_id: selectedProject?.id || null,
    company_id: companyLink?.type === 'portfolio' ? companyLink.id : null,
    pipeline_company_id: companyLink?.type === 'pipeline' ? companyLink.id : null,
  };
  
  onUpdateTask(task.id, updates);
  onClose();
  toast({ title: "Task updated" });
};
```

**Alternative approach**: Modify `TriageQueue.tsx` to use `useTasksManager` instead of raw `useTasks`:

```typescript
// Before
const { tasks, updateTask, deleteTask, archiveTask, unarchiveTask } = useTasks();

// After
const { tasks, handleUpdateTask, handleArchiveTask, handleUnarchiveTask, handleDeleteTask } = useTasksManager();
```

Then pass `handleUpdateTask` to the drawer, which already handles the transformation correctly.

### Part 4: Handle Category Resolution

The category field needs to be resolved from name to ID. Two options:

**Option A: Add category resolution in the drawer**
Import `useCategories` and resolve before save:

```typescript
const { getCategoryIdByName } = useCategories();

const handleSave = () => {
  const categoryId = category ? getCategoryIdByName(category) : null;
  
  onUpdateTask(task.id, {
    // ... other fields
    category_id: categoryId,
  });
};
```

**Option B: Use `useTasksManager` (recommended)**
Since `useTasksManager.handleUpdateTask` already handles this, switching to it is cleaner.

---

## Files Changed

| File | Changes |
|------|---------|
| `supabase/migrations/[timestamp]_smarter_task_triage.sql` | Create - New trigger logic for smarter triage entry + auto-exit on enrichment |
| `src/hooks/useBackfillWorkItems.ts` | Modify - Add `scheduled_for` and `priority` checks to task backfill filter |
| `src/components/focus/TriageTaskDrawer.tsx` | Modify - Fix `handleSave` to properly transform data before calling update |
| `src/pages/TriageQueue.tsx` | Modify - Switch from `useTasks` to `useTasksManager` for consistent task handling |

---

## Technical Notes

- The existing `trigger_auto_exit_task` handles completed/archived tasks
- The new `trigger_auto_exit_enriched_task` handles linked/scheduled tasks
- Both triggers check `status NOT IN ('trusted', 'ignored')` to avoid redundant updates
- The backfill query needs to fetch `scheduled_for` and `priority` columns (currently only fetches `id, project_id, company_id, pipeline_company_id`)
- Using `useTasksManager` in TriageQueue provides consistency with the Tasks page and handles all edge cases

---

## Expected Behavior After Fix

1. **New tasks with deadlines or priorities** → Don't appear in Triage queue
2. **Editing task in Triage** (adding project, deadline, category) → Persists to database immediately
3. **Task with deadline added in Triage** → Automatically exits Triage queue
4. **Task with project linked in Triage** → Automatically exits Triage queue
5. **Tasks list reflects changes** → Updates immediately visible

