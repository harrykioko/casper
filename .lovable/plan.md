
# Pipeline as First-Class Deal Workspace (Cabana-style Layout)

## Overview

Transform the Pipeline feature into a true first-class Deal Room with a Cabana-style full-page detail layout. This adds a new route `/pipeline/:companyId` with a sticky hero, left tab navigation, middle content area, and right context rail while preserving all existing Pipeline functionality.

## Architecture

The implementation mirrors the Cabana screenshot's layout pattern:

```text
+------------------------------------------------------------------+
|  <- Pipeline    [LOGO] Company Name [Status Pill] [Star]         |
|  Seed - Fintech - $3M - Close: Mar 2026 - website.com            |
|  Last touch: 2 days ago                         [Add Task] [Note]|
+------------------------------------------------------------------+
|  Left    |        Middle Content Panel         |   Right Rail    |
|  Tab Nav |                                      |                 |
|----------+--------------------------------------+-----------------|
| Overview |  [Tab-specific content]             | Relationship    |
| Tasks(3) |                                      | Summary         |
| Notes(5) |                                      |-----------------|
| Files(2) |                                      | Next Actions    |
| Comms(0) |                                      |-----------------|
| Timeline |                                      | Activity        |
|          |                                      | (grouped)       |
+------------------------------------------------------------------+
```

## Implementation Steps

### Step 1: Create Route + Layout Scaffolding

**New Files:**
- `src/pages/PipelineCompanyDetail.tsx` - Main page component
- `src/components/pipeline-detail/DealRoomLayout.tsx` - 3-region layout wrapper
- `src/components/pipeline-detail/DealRoomHero.tsx` - Sticky hero header
- `src/components/pipeline-detail/DealRoomTabs.tsx` - Left tab navigation
- `src/components/pipeline-detail/DealRoomContextRail.tsx` - Right sticky rail

**Modified Files:**
- `src/App.tsx` - Add route `/pipeline/:companyId`

### Step 2: Hero Component

Sticky header with:
- Back link to `/pipeline`
- Company logo (with fallback initial)
- Company name + status pill + top-of-mind star toggle
- Metadata row: Round, Sector, Raise (formatted), Close date, Website link, Last touch
- Quick action buttons (right side):
  - Primary: Add Task, Add Note, Upload File
  - Secondary icons: Log Call, Draft Email (placeholder), Edit (opens existing modal)

### Step 3: Tab Navigation

Left column tabs (icon + label + count chip):
- Overview (default)
- Tasks (count of open tasks)
- Notes (count of pipeline_interactions with type='note')
- Files (count of attachments)
- Comms (count, placeholder for now)
- Timeline

Selected state with subtle accent background and left border indicator.

### Step 4: Content Panels per Tab

#### Overview Tab
- **Next Steps Card** - Editable textarea with autosave (uses existing `next_steps` field on pipeline_companies)
- **Open Tasks Preview** - Top 5 open tasks with quick add input, "View all" link to Tasks tab
- **Recent Notes Preview** - Last 3 notes with timestamps, "View all" link to Notes tab
- **Recent Files Preview** - Last 3 files with type icons, "View all" link to Files tab
- **Communications Preview** - Placeholder empty state until comms are wired

#### Tasks Tab
- Full task list using existing `usePipelineTasks` hook
- Quick add row at top
- Status toggle, due date, priority badges
- "Mark complete" action per row

#### Notes Tab
- Composer card at top (multiline input + type dropdown: Note/Call/Diligence/Update + Save button)
- Uses existing `usePipelineInteractions` hook (interaction_type in ['note', 'call', 'meeting', 'update'])
- Notes feed (most recent first) with type badge, timestamp, content

#### Files Tab (New)
- **Requires new database table and storage bucket**
- Upload zone with file picker
- Files list with filename, type, uploaded_at, size
- Download/open action per file
- Empty state: "No files yet. Upload a deck, memo, or screenshot."

#### Comms Tab
- Placeholder card: "Connect emails and meetings to see them here."
- Uses existing `useCompanyLinkedCommunications` hook when domain is available

#### Timeline Tab
- Full unified feed using existing `usePipelineTimeline` hook
- Displays: notes, tasks created/completed, files uploaded (when implemented)

### Step 5: Context Rail (Right Sticky)

Three stacked cards:

**A. Relationship Summary**
- Title: "Relationship Summary"
- Chips/counts: Open tasks, Notes, Files, Comms
- "Last activity" timestamp

**B. Next Actions**
- 3-6 priority-ordered action items derived from:
  1. Overdue tasks first
  2. Nearest upcoming due date tasks
  3. Fallback to `next_steps` text if no tasks
- Each row: title, due date, overdue badge, "Complete" button

**C. Activity**
- Grouped by: Today / Yesterday / This Week
- Compact timeline event rows pulled from timeline data

### Step 6: Database Schema Changes

#### New Table: `pipeline_attachments`
```sql
CREATE TABLE pipeline_attachments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_company_id uuid NOT NULL REFERENCES pipeline_companies(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  file_type text,
  file_size integer,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS Policies
ALTER TABLE pipeline_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments for their companies"
  ON pipeline_attachments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM pipeline_companies
    WHERE pipeline_companies.id = pipeline_attachments.pipeline_company_id
    AND pipeline_companies.created_by = auth.uid()
  ));

CREATE POLICY "Users can create attachments for their companies"
  ON pipeline_attachments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM pipeline_companies
    WHERE pipeline_companies.id = pipeline_attachments.pipeline_company_id
    AND pipeline_companies.created_by = auth.uid()
  ));

CREATE POLICY "Users can delete attachments for their companies"
  ON pipeline_attachments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM pipeline_companies
    WHERE pipeline_companies.id = pipeline_attachments.pipeline_company_id
    AND pipeline_companies.created_by = auth.uid()
  ));

-- Index for fast lookups
CREATE INDEX idx_pipeline_attachments_company ON pipeline_attachments(pipeline_company_id);
```

#### New Storage Bucket: `pipeline-attachments`
```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('pipeline-attachments', 'pipeline-attachments', false);

-- RLS for storage
CREATE POLICY "Users can upload pipeline attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pipeline-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view their pipeline attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pipeline-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their pipeline attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'pipeline-attachments' AND auth.role() = 'authenticated');
```

### Step 7: New Hooks

**`src/hooks/usePipelineAttachments.ts`**
- CRUD operations for `pipeline_attachments` table
- Upload to storage bucket
- Returns attachments, loading, createAttachment, deleteAttachment

### Step 8: Update Existing Components

**`src/components/pipeline/PipelineDetailModal.tsx`**
- Add "Open full page" button in header that navigates to `/pipeline/:companyId`

**`src/components/command-pane/PipelineCommandHeader.tsx`**
- Update "Full page" link to point to `/pipeline/:companyId`

**`src/pages/Pipeline.tsx`**
- Keep existing behavior (modal opens on card click)
- No changes to list/board/grid views

### Step 9: Shared Components

Create reusable components for both the full page and the existing command pane:

**`src/components/pipeline-detail/shared/NextStepsEditor.tsx`**
- Autosave textarea for next_steps field

**`src/components/pipeline-detail/shared/TaskListPreview.tsx`**
- Compact task list with quick add

**`src/components/pipeline-detail/shared/ActivityFeed.tsx`**
- Grouped activity display (Today/Yesterday/This Week)

## File Summary

| File | Action | Description |
|------|--------|-------------|
| `src/pages/PipelineCompanyDetail.tsx` | Create | Main Deal Room page |
| `src/components/pipeline-detail/DealRoomLayout.tsx` | Create | 3-region layout |
| `src/components/pipeline-detail/DealRoomHero.tsx` | Create | Sticky hero header |
| `src/components/pipeline-detail/DealRoomTabs.tsx` | Create | Left tab navigation |
| `src/components/pipeline-detail/DealRoomContextRail.tsx` | Create | Right context rail |
| `src/components/pipeline-detail/tabs/OverviewTab.tsx` | Create | Overview content |
| `src/components/pipeline-detail/tabs/TasksTab.tsx` | Create | Tasks full list |
| `src/components/pipeline-detail/tabs/NotesTab.tsx` | Create | Notes with composer |
| `src/components/pipeline-detail/tabs/FilesTab.tsx` | Create | File attachments |
| `src/components/pipeline-detail/tabs/CommsTab.tsx` | Create | Communications |
| `src/components/pipeline-detail/tabs/TimelineTab.tsx` | Create | Full timeline |
| `src/components/pipeline-detail/shared/NextStepsEditor.tsx` | Create | Autosave editor |
| `src/components/pipeline-detail/shared/ActivityFeed.tsx` | Create | Grouped activity |
| `src/components/pipeline-detail/shared/RelationshipSummary.tsx` | Create | Summary card |
| `src/components/pipeline-detail/shared/NextActionsCard.tsx` | Create | Priority actions |
| `src/hooks/usePipelineAttachments.ts` | Create | Attachments CRUD |
| `src/App.tsx` | Modify | Add route |
| `src/components/pipeline/PipelineDetailModal.tsx` | Modify | Add full page link |
| `src/components/command-pane/PipelineCommandHeader.tsx` | Modify | Update full page link |
| Migration file | Create | Add pipeline_attachments table + bucket |

## Styling Guidelines

- Use existing `GlassPanel`, `GlassPanelHeader`, `GlassSubcard` components
- Match Casper glassmorphic design system (rounded-2xl, backdrop-blur, border-white/10)
- Sticky positioning for hero, tabs, and context rail
- Framer Motion for tab transitions
- Consistent badge styling for status, counts, overdue indicators
- Empty states with icon + friendly text + primary CTA button

## Acceptance Criteria

1. `/pipeline/:companyId` renders Cabana-style Deal Room with sticky hero, left tabs, middle content, right rail
2. Hero displays company info with quick actions (Add Task, Add Note, Upload File, Edit)
3. Overview tab shows editable Next Steps, open tasks preview, notes preview, files preview
4. Tasks tab shows full filtered list with CRUD operations
5. Notes tab has composer + feed (reuses existing pipeline_interactions)
6. Files tab supports upload to storage + list display
7. Comms tab shows linked communications or placeholder
8. Timeline tab shows unified event feed
9. Context rail shows Relationship Summary, Next Actions, grouped Activity
10. Existing Pipeline page modal flow unchanged
11. Command pane "Full page" link navigates to new route
12. Top of Mind drawer continues working

## Phased Implementation

**Phase 1: Route + Layout + Hero + Tabs Shell**
- Create all structural components with placeholder content
- Wire up routing and navigation

**Phase 2: Overview Tab + Context Rail**
- Next Steps editor with autosave
- Task/Notes/Files previews
- All three context rail cards

**Phase 3: Tasks + Notes + Timeline Tabs**
- Full task list with existing hook
- Notes composer + feed with existing hook
- Timeline with existing hook

**Phase 4: Files Tab + Schema**
- Database migration for attachments table
- Storage bucket setup
- File upload/download UI

**Phase 5: Integration + Polish**
- Update command pane links
- Add "Open full page" to modal
- Refactor shared components
- Animation polish

