---
name: audit
description: "Run a structured product/UX audit on a section of the codebase. Use when reviewing UI quality, checking for regressions, or doing periodic product reviews. Auto-invoke when the user says 'audit', 'review the UX', 'check for issues', or 'product review'."
---

# Product & UX Audit Skill

## Step 1: Scope
Ask the user which area to audit, or audit the area they've specified.
Read all relevant component files, styles, and related hooks.

## Step 2: Systematic Review
Check each component/page for:

### Visual Consistency
- Light mode AND dark mode rendering (check for white slabs, missing transparency, contrast issues)
- Consistent spacing, typography, and color usage across components
- Ambient vs. opaque backgrounds — flag any sterile/boxy layouts

### Functional Completeness
- Empty states handled
- Loading states present
- Error states handled gracefully
- Responsive behavior

### Data Integration
- Hooks returning expected data
- RLS policies not hiding intended content
- Edge cases with missing or null data

### UX Quality
- Interactive elements have proper hover/focus states
- Navigation is intuitive
- Actions are discoverable (not hidden)

## Step 3: Report
Save findings to `docs/audits/<area>-audit-<date>.md` with:

### P0 — Critical (fix immediately)
[Issues that break functionality or severely degrade UX]

### P1 — Important (fix this sprint)
[Issues that noticeably hurt quality]

### P2 — Nice to Have (backlog)
[Polish items and minor improvements]

## Step 4: Ask
Ask the user if they want to implement any P0 fixes immediately.
