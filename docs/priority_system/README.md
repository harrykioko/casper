# Priority System Documentation

This directory contains the design documentation and implementation plan for CASPER's unified priority system.

## Overview

CASPER currently has a **dual priority system**:
1. **Priority Items** (task + company centric) - Shows overdue tasks, due today tasks, and stale companies
2. **Company Attention Grid** - Shows all companies with color-coded attention status

This documentation proposes a **unified priority model** that integrates all data sources (tasks, inbox, portfolio, pipeline, calendar, reading, nonnegotiables) into a single, multi-dimensional priority scoring system.

---

## Documents

### 01_current_state.md
**Comprehensive analysis of the existing priority system**

Contents:
- Current priority implementation (`usePriorityItems` and `useCompanyAttention` hooks)
- Full inventory of all 13 data sources with schemas and fields
- Current priority logic (overdue > due today > stale)
- Strengths & weaknesses analysis
- 12 identified failure modes (blind spots, noise, staleness, fragmentation)

**Key Findings:**
- Current system only surfaces company-linked tasks (standalone tasks invisible)
- Inbox, calendar, reading, nonnegotiables not integrated
- No importance weighting (task priority field ignored)
- No recency decay (old stale tasks linger)
- No explainability (users don't know why items are prioritized)

---

### 02_proposed_model.md
**Unified priority model design and implementation plan**

Contents:
- Vision & objectives: Answer "What are my 5–10 highest-leverage next actions?"
- Unified `PriorityItem` interface (multi-dimensional scoring)
- Source-to-PriorityItem mapping rules for each data type (7 sources)
- Scoring function with configurable weights (urgency, importance, recency, commitment)
- Rules & filters (exclusions, always-include, diversity, score thresholds)
- UX & system behavior (interaction model, time dynamics, explainability)
- 4-phase implementation approach

**Key Design Principles:**
- **Multi-dimensional:** Urgency (35%), Importance (30%), Recency (15%), Commitment (20%)
- **Explainable:** Every item includes reasoning + signal breakdown
- **Adaptive:** Learns from user behavior (snoozes, completions)
- **Focused:** 5–10 items max with source diversity

---

## Implementation Status

### Phase 1: Foundation (CURRENT - COMPLETED)
✅ Document current state (`01_current_state.md`)
✅ Design unified model (`02_proposed_model.md`)
✅ Create TypeScript types (`src/types/priority.ts`)
✅ Create skeleton utility files:
   - `src/lib/priority/priorityMapping.ts` - Source-to-PriorityItem mappers (stubbed)
   - `src/lib/priority/priorityScoring.ts` - Scoring functions (stubbed)
   - `src/lib/priority/priorityRules.ts` - Filtering rules (stubbed)
✅ Add comments to existing hooks pointing to new design

**No runtime behavior changes in Phase 1**

---

### Phase 2: Parallel Implementation (TODO)
- [ ] Implement `useUnifiedPriority()` hook
- [ ] Complete all mapping functions (7 source types)
- [ ] Complete scoring functions (4 dimensions)
- [ ] Complete filtering & selection logic
- [ ] Add feature flag: `ENABLE_UNIFIED_PRIORITY`
- [ ] Create debug view (side-by-side comparison)
- [ ] Add unit tests for scoring edge cases

---

### Phase 3: Gradual Rollout (TODO)
- [ ] Enable feature flag for internal testing
- [ ] Add reasoning UI (show why items are prioritized)
- [ ] Implement snooze persistence
- [ ] Add feedback mechanisms (thumbs up/down)
- [ ] Monitor user behavior (completion rates, snooze patterns)
- [ ] Iterate on weights based on feedback
- [ ] Full rollout: Remove feature flag, deprecate old hooks

---

### Phase 4: Learning & Optimization (TODO)
- [ ] Track user actions in database
- [ ] Store interaction history (shown, acted on, snoozed)
- [ ] Train lightweight model to adjust weights per user
- [ ] Implement A/B testing for weight variations
- [ ] Continuous refinement based on aggregate behavior

---

## File Structure

```
casper/
├── docs/
│   └── priority_system/
│       ├── README.md               # This file
│       ├── 01_current_state.md     # Current system analysis
│       └── 02_proposed_model.md    # Unified model design
│
├── src/
│   ├── types/
│   │   └── priority.ts             # PriorityItem, PriorityConfig, PrioritySignal interfaces
│   │
│   ├── lib/
│   │   └── priority/
│   │       ├── priorityMapping.ts  # Source-to-PriorityItem mappers (Phase 2)
│   │       ├── priorityScoring.ts  # Multi-dimensional scoring (Phase 2)
│   │       └── priorityRules.ts    # Filtering & selection rules (Phase 2)
│   │
│   └── hooks/
│       ├── usePriorityItems.ts     # Current priority system (Phase 0) - will be deprecated
│       ├── useCompanyAttention.ts  # Current attention system (Phase 0) - will be integrated
│       └── useUnifiedPriority.ts   # New unified hook (Phase 2) - TODO
```

---

## Quick Reference

### Current Priority Logic (Phase 0)

**usePriorityItems:**
- Overdue tasks (linked to companies) → Priority 0
- Due today tasks (linked to companies) → Priority 1
- Stale companies (>14 days no interaction) → Priority 2
- Display limit: 4 items

**useCompanyAttention:**
- Signal weights: 0.9 (no interaction >30d), 0.5 (stale 14-30d), 0.8 (no next step + tasks), 0.3 (no next step)
- Status: red (≥1.2), yellow (≥0.4), green (<0.4)
- Displays all companies in grid

---

### Proposed Unified Model (Phase 2+)

**PriorityItem Scoring:**
```
priorityScore = 0.35 * urgencyScore +
                0.30 * importanceScore +
                0.15 * recencyScore +
                0.20 * commitmentScore
```

**Data Sources:**
1. Tasks (all, not just company-linked)
2. Inbox items (unresolved)
3. Portfolio companies (stale + open tasks)
4. Pipeline companies (stale + close dates)
5. Calendar events (upcoming in 48 hours)
6. Reading items (unread, project-linked)
7. Nonnegotiables (today's active habits)

**Rules:**
- Always include: Overdue high-priority tasks, calendar events <2 hours, today's nonnegotiables
- Diversity: Max 3 items per source type
- Score threshold: Min 0.3 priority score
- Display limit: 5–10 items total

---

## Design Rationale

### Why Multi-Dimensional Scoring?

**Problem with current system:**
- All overdue tasks treated equally (admin task = critical decision)
- Freshly created tasks = 6-month-old tasks
- No distinction between quick wins and heavy lifts

**Solution:**
- **Urgency (35%):** Time pressure (deadlines, events)
- **Importance (30%):** Strategic value (explicit priority, company links)
- **Recency (15%):** Freshness (recently created/updated)
- **Commitment (20%):** Explicit promises (calendar, nonnegotiables)

### Why Explainability?

Users need to understand *why* something is prioritized to trust the system.

**Example reasoning:**
> "Overdue by 3 days. High priority. Linked to Acme. Priority score: 0.92"

**Signal breakdown:**
- Urgency: 0.96 (overdue deadline)
- Importance: 1.0 (high priority + company-linked)
- Recency: 0.5 (updated 3 days ago)
- Commitment: 0.4 (task commitment)

---

## Related Files

**Current Implementation:**
- `src/hooks/usePriorityItems.ts` - Current priority hook
- `src/hooks/useCompanyAttention.ts` - Current attention hook
- `src/components/dashboard/DashboardPrioritySection.tsx` - Priority UI
- `src/components/dashboard/CompaniesCommandPane.tsx` - Company grid UI

**New Types:**
- `src/types/priority.ts` - Unified priority interfaces

**New Utilities (stubbed):**
- `src/lib/priority/priorityMapping.ts` - Mappers
- `src/lib/priority/priorityScoring.ts` - Scoring
- `src/lib/priority/priorityRules.ts` - Rules

---

## Next Steps (For Implementation)

1. **Read the design docs** (01_current_state.md, 02_proposed_model.md)
2. **Understand the current system** (run the app, inspect priority items and company grid)
3. **Implement Phase 2**:
   - Start with one data source (e.g., tasks)
   - Implement mapping → scoring → filtering
   - Add unit tests
   - Wire into new `useUnifiedPriority()` hook
   - Add feature flag to toggle between old and new
4. **Test with real data** (compare old vs new priority lists)
5. **Iterate on weights** based on user feedback

---

## Questions?

For questions or clarifications, see:
- Full design: `02_proposed_model.md`
- Current system analysis: `01_current_state.md`
- Type definitions: `src/types/priority.ts`

**Key Decision Points:**
- Weight tuning (urgency: 0.35, importance: 0.30, recency: 0.15, commitment: 0.20)
- Display limits (max 10 items, max 3 per source type)
- Staleness thresholds (14 days for companies, 7 days for tasks)
- Score threshold (0.3 minimum priority score)

These are all configurable in `PriorityConfig` interface.
