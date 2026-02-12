---
name: plan
description: "Run a structured requirements interview and produce a phased implementation plan. Use when starting any new feature, system redesign, or multi-file change. Auto-invoke when the user says 'plan', 'let's build', 'new feature', 'implement', or 'requirements'."
---

# Implementation Planning Skill

You are conducting a structured planning session for a TypeScript/Supabase/React project.

## Phase 1: Codebase Review
1. Read the relevant existing code files to understand current architecture
2. Identify all files, hooks, edge functions, and database tables that will be affected
3. Note existing patterns and conventions from similar features

## Phase 2: Requirements Interview
Ask the user 5-10 clarifying questions covering:
- **Data model**: What new tables, columns, or relationships are needed?
- **UI behavior**: What should the user see and interact with? What existing layout elements must be preserved?
- **Edge cases**: What happens with empty states, errors, permissions?
- **Existing data**: Is there data that needs to be migrated or backfilled into new structures?
- **Integration points**: Which existing hooks, edge functions, or components are affected?
- **Design intent**: What visual style should this match? What must NOT change?

**STOP and wait for the user's answers before proceeding.**

## Phase 3: Implementation Plan
Produce a phased plan and save it to `docs/plans/<feature-name>.md` with:

1. **Phase 1 — Database Layer**: Migrations, RLS policies, triggers
2. **Phase 2 — Data Migration** (if applicable): Backfill scripts for existing data into new structures
3. **Phase 3 — Edge Functions**: Server-side logic, API endpoints
4. **Phase 4 — Hooks & State**: React Query hooks, state management
5. **Phase 5 — UI Components**: Pages, components, styling
6. **Phase 6 — Verification**: Specific scenarios to test against real data, including:
   - Query actual database to confirm real results for 2-3 existing records
   - Verify RLS policies allow intended access
   - Confirm triggers produce valid data for downstream consumers
   - Run `npm run build` for clean compilation

Each phase should list the specific files to create or modify.
