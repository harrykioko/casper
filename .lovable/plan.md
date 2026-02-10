

# Fix: `pipelineMap.get is not a function` Runtime Error

## Problem

Despite initializing `pipelineMap` and `portfolioMap` as `new Map()`, a race condition or React batching issue causes `pipelineMap` to not be a `Map` instance when the `useMemo` runs, crashing the page with a blank screen.

## Solution

Add defensive guards at the top of the `useMemo` in `useEnrichedTasks.ts` to ensure both maps are valid `Map` instances before calling `.get()`.

## File Change

### `src/hooks/useEnrichedTasks.ts`

At the start of the `useMemo` callback (around line 65), add:

```typescript
const safePipelineMap = pipelineMap instanceof Map ? pipelineMap : new Map();
const safePortfolioMap = portfolioMap instanceof Map ? portfolioMap : new Map();
```

Then use `safePipelineMap.get(...)` and `safePortfolioMap.get(...)` instead of calling `.get()` directly on the state variables.

This is a one-line-per-map defensive fix -- no architectural changes needed.

