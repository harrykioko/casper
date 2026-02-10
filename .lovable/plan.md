

# Fix: Pipeline Company Not Showing in Context Rail

## Root Cause

`useEnrichedTasks` relies on `useDashboardPipelineFocus` to build its pipeline company lookup map. That hook only fetches companies with `is_top_of_mind = true`. PandoAlts has `is_top_of_mind = false`, so it's missing from the map entirely and gets silently skipped during enrichment.

## Solution

Update `useEnrichedTasks` to fetch its own complete set of pipeline companies (by collecting the `pipeline_company_id` values from the tasks and querying them directly), rather than depending on the dashboard-scoped hook that filters by top-of-mind.

## File Changes

### `src/hooks/useEnrichedTasks.ts`
- Remove dependency on `useDashboardPipelineFocus`
- Instead, collect all unique `pipeline_company_id` values from the input tasks
- Use a small `useEffect` + Supabase query to fetch those specific pipeline companies (only the ones actually referenced by tasks)
- Similarly, collect all unique `company_id` values and fetch those portfolio companies directly, removing the dependency on `useDashboardPortfolioCompanies`
- This ensures enrichment works for ALL linked companies, not just those that happen to be "top of mind" or in the dashboard's top-10 list

### No other files change
- `TodayRail.tsx` and `Home.tsx` already pass and render `linkedEntities` correctly

## Technical Detail

```typescript
// Pseudocode for the new approach
const pipelineIds = [...new Set(tasks.map(t => t.pipeline_company_id).filter(Boolean))];
const portfolioIds = [...new Set(tasks.map(t => t.company_id).filter(Boolean))];

// Fetch only the companies we actually need
const { data: pipelineData } = await supabase
  .from('pipeline_companies')
  .select('id, company_name, logo_url')
  .in('id', pipelineIds);

const { data: portfolioData } = await supabase
  .from('companies')
  .select('id, name, logo_url')
  .in('id', portfolioIds);
```

This is a targeted fix -- fetch exactly the companies referenced by tasks, regardless of their top-of-mind or dashboard status.
