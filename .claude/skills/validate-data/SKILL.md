---
name: validate-data
description: "Verify feature data layer against real database content. Use after implementing hooks, queries, edge functions, or RLS policies. Auto-invoke when implementing data-dependent features or when debugging empty/missing data."
---

# Real Data Validation Skill

After implementing a data layer (hooks, queries, edge functions, RLS policies), run this verification BEFORE building UI components on top of it.

## Step 1: Identify Expected Data
- What records should this feature return for existing users/entities?
- What tables/views are being queried?
- What joins, filters, or RLS policies are applied?

## Step 2: Query Real Data
Use Supabase MCP (if available) or write a quick verification script to:
- Query the target table(s) directly, bypassing the application layer
- Confirm that at least 2-3 real records exist that match the feature's criteria
- If querying via the application's hooks/functions, compare results to direct database queries

## Step 3: Verify Access
- Test that RLS policies allow the intended access for the relevant user roles
- Confirm that joins resolve correctly (no silent failures from missing foreign keys)
- Check that triggers produce valid, non-empty data for downstream consumers

## Step 4: Diagnose or Proceed
**If results are empty when data should exist:**
- Check RLS policies first (most common cause)
- Check join conditions (are foreign keys populated?)
- Check filter logic (is matching too strict?)
- Check if backfill is needed for existing data
- FIX the data layer issue before building any UI

**If results are correct:**
- Proceed to UI implementation with confidence
- Note the verified query in the implementation plan for future reference
