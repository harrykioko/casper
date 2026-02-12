---
name: checkpoint
description: "Implement features in committed phases with rollback safety. Use for any multi-file or multi-phase implementation. Auto-invoke when the user says 'implement the plan', 'build this feature', 'multi-phase', or references an implementation plan."
---

# Phase-Based Checkpoint Implementation

## Workflow
For each phase in the implementation plan:

### 1. Implement
Complete all work for this phase only. Do not touch files belonging to future phases.

### 2. Verify
Run `npm run build` (or the project's build command).
If the build fails:
- Fix the issue within this phase's scope
- Run the build again
- If you cannot fix it without modifying earlier phases, STOP and tell the user

### 3. Commit
Once the build passes, commit with a descriptive message:
git add -A && git commit -m "feat(<feature>): phase N - <description>"

Example messages:
- `feat(focus-queue): phase 1 - database migration and RLS policies`
- `feat(focus-queue): phase 2 - backfill existing emails into queue`
- `feat(focus-queue): phase 3 - React Query hooks for CRUD`
- `feat(focus-queue): phase 4 - UI components and page layout`

### 4. Proceed
Only after the commit succeeds, move to the next phase.

## Critical Rules
- NEVER start phase N+1 until phase N is committed
- NEVER modify files from a previous phase without explicit user approval
- If a later phase reveals issues in an earlier phase, tell the user before making changes
- Each commit should represent a working (buildable) state
