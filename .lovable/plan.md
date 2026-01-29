
# Pipeline as First-Class Deal Workspace (Cabana-style Layout)

## Status: ✅ COMPLETE

All phases have been implemented.

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

## Completed Phases

### ✅ Phase 1: Route + Layout + Hero + Tabs Shell
- Created `src/pages/PipelineCompanyDetail.tsx`
- Created `src/components/pipeline-detail/DealRoomLayout.tsx`
- Created `src/components/pipeline-detail/DealRoomHero.tsx`
- Created `src/components/pipeline-detail/DealRoomTabs.tsx`
- Created `src/components/pipeline-detail/DealRoomContextRail.tsx`
- Added route `/pipeline/:companyId` to `src/App.tsx`

### ✅ Phase 2: Overview Tab + Context Rail
- Created `src/components/pipeline-detail/tabs/OverviewTab.tsx` with:
  - Next Steps editor with autosave
  - Open tasks preview with quick add
  - Recent notes preview
  - Recent files preview
  - Communications placeholder
- Created `src/components/pipeline-detail/shared/RelationshipSummary.tsx`
- Created `src/components/pipeline-detail/shared/NextActionsCard.tsx`
- Created `src/components/pipeline-detail/shared/ActivityFeed.tsx`

### ✅ Phase 3: Tasks + Notes + Timeline Tabs
- Created `src/components/pipeline-detail/tabs/TasksTab.tsx`
- Created `src/components/pipeline-detail/tabs/NotesTab.tsx`
- Created `src/components/pipeline-detail/tabs/TimelineTab.tsx`
- Created `src/components/pipeline-detail/tabs/CommsTab.tsx`

### ✅ Phase 4: Files Tab + Schema
- Created database migration for `pipeline_attachments` table with RLS policies
- Created `pipeline-attachments` storage bucket with RLS policies
- Created `src/hooks/usePipelineAttachments.ts`
- Updated `src/components/pipeline-detail/tabs/FilesTab.tsx` with full upload/download UI

### ✅ Phase 5: Integration + Polish
- Updated `src/components/command-pane/PipelineCommandHeader.tsx` to link to full page view
- Added "Open Full Page" button to `src/components/pipeline/PipelineDetailModal.tsx`
- Wired up files count in Overview tab and Context Rail

## Files Created/Modified

| File | Action | Description |
|------|--------|-------------|
| `src/pages/PipelineCompanyDetail.tsx` | ✅ Created | Main Deal Room page |
| `src/components/pipeline-detail/DealRoomLayout.tsx` | ✅ Created | 3-region layout |
| `src/components/pipeline-detail/DealRoomHero.tsx` | ✅ Created | Sticky hero header |
| `src/components/pipeline-detail/DealRoomTabs.tsx` | ✅ Created | Left tab navigation |
| `src/components/pipeline-detail/DealRoomContextRail.tsx` | ✅ Created | Right context rail |
| `src/components/pipeline-detail/tabs/OverviewTab.tsx` | ✅ Created | Overview content |
| `src/components/pipeline-detail/tabs/TasksTab.tsx` | ✅ Created | Tasks full list |
| `src/components/pipeline-detail/tabs/NotesTab.tsx` | ✅ Created | Notes with composer |
| `src/components/pipeline-detail/tabs/FilesTab.tsx` | ✅ Created | File attachments |
| `src/components/pipeline-detail/tabs/CommsTab.tsx` | ✅ Created | Communications |
| `src/components/pipeline-detail/tabs/TimelineTab.tsx` | ✅ Created | Full timeline |
| `src/components/pipeline-detail/shared/ActivityFeed.tsx` | ✅ Created | Grouped activity |
| `src/components/pipeline-detail/shared/RelationshipSummary.tsx` | ✅ Created | Summary card |
| `src/components/pipeline-detail/shared/NextActionsCard.tsx` | ✅ Created | Priority actions |
| `src/hooks/usePipelineAttachments.ts` | ✅ Created | Attachments CRUD |
| `src/App.tsx` | ✅ Modified | Added route |
| `src/components/pipeline/PipelineDetailModal.tsx` | ✅ Modified | Added full page link |
| `src/components/command-pane/PipelineCommandHeader.tsx` | ✅ Modified | Updated full page link |

## Database Changes

- `pipeline_attachments` table with RLS policies
- `pipeline-attachments` storage bucket with RLS policies

