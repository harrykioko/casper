---
name: implement-parallel
description: "Implement multi-layer features using parallel sub-agents. Use for large features spanning database, edge functions, hooks, and UI. Auto-invoke when the user says 'implement in parallel', 'parallel build', or references a plan with 4+ phases across different layers."
---

# Parallel Sub-Agent Implementation

For features spanning multiple layers, use Task sub-agents to build simultaneously.

## Step 1: Layer Assignment
Split the implementation plan into parallel tracks:

- **Task 1 — Database Layer**: Supabase migration, RLS policies, triggers, type definitions
- **Task 2 — Edge Functions**: Server-side logic following existing edge function conventions
- **Task 3 — Hooks Layer**: React Query hooks (CRUD) following patterns from `src/hooks/`
- **Task 4 — UI Components**: Page and sub-components following patterns from `src/components/`

## Step 2: Convention Matching
Each sub-agent MUST read at least 3 existing files of its type before writing anything:
- Database: Read 3 existing migration files
- Edge functions: Read 3 existing edge functions
- Hooks: Read 3 existing hook files
- UI: Read 3 existing component files of similar complexity

## Step 3: Parallel Execution
Spawn all 4 Task sub-agents simultaneously. Each should:
- Follow the conventions learned from existing files
- Use shared type definitions from the database layer
- Handle empty states and error states

## Step 4: Integration Verification
After all sub-agents complete:
1. Run `npm run build` to verify integration
2. If the build fails, diagnose which layer caused the issue
3. Fix the integration issue
4. Run the build again until clean
5. Commit the working state

## Step 5: Data Verification
Run the `/validate-data` skill to confirm the feature works against real data.
