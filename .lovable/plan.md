

# Fix: Show All Linked Entities in Focus Mode Context Rail

## Problem

The `useEnrichedTasks` hook assigns a single `linkedEntity` to each task using a priority chain (pipeline > portfolio > project > email). The "Follow up with Cash Lafferty" task has both a pipeline company (PandoAlts) and a source email, but only the pipeline company would be selected -- and even that isn't appearing in the Context section.

## Solution

Add a new `linkedEntities` (plural) array to `EnrichedTask` that captures ALL linked entities for a task, then pass this array to `TodayRail`.

## File Changes

### 1. `src/hooks/useEnrichedTasks.ts`
- Add `linkedEntities: LinkedEntity[]` field to `EnrichedTask`
- Build an array of all applicable entities (pipeline company, portfolio company, project, email) instead of picking just one
- Keep the existing singular `linkedEntity` (first item) for backward compatibility with other components like `EntityPill`

### 2. `src/components/home/TodayRail.tsx`
- Change prop from `linkedEntity?: LinkedEntity` to `linkedEntities?: LinkedEntity[]`
- Render all entities in the Context section (up to 6)
- Show the section only when the array is non-empty

### 3. `src/pages/Home.tsx`
- Pass `spotlightTask?.linkedEntities` (plural) to `TodayRail` instead of `spotlightTask?.linkedEntity`

## Technical Detail

The enrichment will collect entities into an array like:

```typescript
const entities: LinkedEntity[] = [];
if (task.pipeline_company_id) { /* push pipeline entity */ }
if (task.company_id) { /* push portfolio entity */ }
if (task.project) { /* push project entity */ }
if (task.source_inbox_item_id) { /* push email entity */ }
return { ...task, linkedEntities: entities, linkedEntity: entities[0] };
```

This preserves backward compatibility while enabling the Context rail to show all linked items.

