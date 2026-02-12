---
name: fix-round-2
description: "Analyze why a first fix didn't work before attempting a second fix. Use when the initial fix was insufficient, when the same issue recurs, or when the user reports the problem isn't solved. Auto-invoke when the user says 'still broken', 'didn't fix it', 'same issue', 'still not working', or 'try again'."
---

# Root Cause Analysis Before Retry

The first fix didn't work. Before attempting another fix, you MUST complete this analysis.

## Step 1: Document the First Attempt
- What did the first fix change?
- What was the hypothesis behind it?
- What is the user still observing?

## Step 2: Examine Real Data
Do NOT re-read code and theorize. Instead:
- Look at actual input data flowing through the system
- Look at actual output/results being produced
- Compare expected vs. actual at each stage of the pipeline

## Step 3: Categorize the Real Problem
Is this actually a:
- **Data problem**: The right code is running on the wrong/missing data
- **Logic problem**: The algorithm/matching/filtering is fundamentally wrong
- **Prompt engineering problem**: An LLM prompt needs restructuring, not more guards
- **Integration problem**: Components aren't connected correctly
- **Permissions problem**: RLS/auth is blocking valid access

## Step 4: Propose a Different Approach
The second fix MUST be fundamentally different from the first.
- If the first fix added guards/filters → the second should examine the data pipeline
- If the first fix tweaked parameters → the second should restructure the approach
- If the first fix was additive → the second should consider removing/replacing

State clearly: "The first fix failed because [X]. The real issue is [Y]. The new approach is [Z]."

## Step 5: Get Approval
Present the new approach to the user before implementing.
