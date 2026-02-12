---
name: debug
description: "Run a strict evidence-based debugging process. Use when diagnosing production failures, unexpected behavior, empty data, auth errors, or broken features. Auto-invoke when the user says 'debug', 'broken', 'not working', 'fix this bug', 'why is this failing', or 'empty results'."
---

# Evidence-Based Debugging Skill

You MUST follow this strict protocol. Do NOT speculate about causes from reading code alone.

## Step 1: REPRODUCE
- Write and run a minimal test or script that demonstrates the failure
- Show the actual error output, network response, or unexpected behavior
- If the user provided error logs, start from those — do not theorize beyond what the logs show

## Step 2: INSTRUMENT
- Add console.log or temporary logging at each step of the relevant code path
- Run again and show the actual execution trace
- For Supabase issues: query the actual database to verify data exists, RLS policies allow access, and triggers fired correctly

## Step 3: HYPOTHESIZE
- Based on the REAL execution trace (not code reading), form exactly ONE hypothesis about the root cause
- State it clearly: "Based on the trace, the failure occurs because X"

## Step 4: VERIFY
- Write a targeted test that would PASS if your hypothesis is correct and FAIL if it's wrong
- Run it and show the result
- If verification FAILS, go back to Step 2 with more granular instrumentation
- Do NOT skip to a fix

## Step 5: FIX
- Only after verification passes, implement the MINIMAL fix
- Do not refactor surrounding code, add extra error handling, or "improve" unrelated logic

## Step 6: CONFIRM
- Run the reproduction from Step 1 again to prove the fix works
- Run `npm run build` for clean compilation
- If the fix introduced new issues, go back to Step 5

## Critical Rules
- NEVER overstate problems that haven't been verified with real execution evidence
- NEVER say "this is likely the issue" without execution evidence
- NEVER skip straight to a fix without reproducing and verifying first
- At each step, show actual terminal/console output
- If you find the root cause is different from your initial hypothesis, say so explicitly
- One bug, one fix — do not bundle unrelated changes
