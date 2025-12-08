# Priority System v1 - Tuning Guide

**Document Version:** 1.0
**Last Updated:** 2025-12-08
**Status:** Implementation Complete - Ready for Tuning

---

## Table of Contents

1. [Overview](#overview)
2. [Accessing the Debug Panel](#accessing-the-debug-panel)
3. [Understanding the Scores](#understanding-the-scores)
4. [Expected Score Distributions](#expected-score-distributions)
5. [Tuning Checklist](#tuning-checklist)
6. [Common Issues & Solutions](#common-issues--solutions)
7. [Rollout Plan](#rollout-plan)

---

## Overview

This guide provides instructions for observing, tuning, and validating the v1 unified priority system before full rollout.

### v1 Scope Reminder

**Data Sources (3):**
- Tasks (all incomplete tasks)
- Inbox items (unread/unresolved)
- Calendar events (today + next 48 hours)

**Scoring (2D):**
- Urgency: 60%
- Importance: 40%
- **NOT USED:** Recency, Commitment, Effort

**Selection:**
- Top 8 items
- No diversity rules
- No score thresholds

---

## Accessing the Debug Panel

### Method 1: URL Parameter (Recommended)

Add `?debug_priority=1` to any URL:

```
http://localhost:8080/dashboard?debug_priority=1
```

The debug panel will appear below the priority items list.

### Method 2: Browser Console

Open DevTools console and look for logs prefixed with `[Priority v1]`:

```
[Priority v1] Distribution: {
  totalItems: 47,
  selected: 8,
  bySource: { task: 5, inbox: 2, calendar_event: 1 },
  avgScore: "0.76",
  scoreRange: ["0.64", "0.94"]
}
```

---

## Understanding the Scores

### Score Components

Each priority item has 3 key scores:

1. **Urgency Score (0-1)** - Time sensitivity
2. **Importance Score (0-1)** - Explicit priority / flags
3. **Priority Score (0-1)** - Final computed score: `0.6 * urgency + 0.4 * importance`

### Urgency Scoring Breakdown

#### Tasks
| Condition | Urgency Score | Description |
|-----------|--------------|-------------|
| Overdue 5+ days | 1.00 | Max urgency (capped) |
| Overdue 3 days | 0.96 | 0.9 + (3 * 0.02) |
| Overdue 1 day | 0.92 | 0.9 + (1 * 0.02) |
| Due today | 0.90 | High urgency |
| Due tomorrow | 0.70 | Medium-high urgency |
| Due in 2-3 days | 0.50 | Medium urgency |
| Due in 4-7 days | 0.30 | Low-medium urgency |
| Due in 8+ days | 0.10 | Low urgency |
| No due date | 0.20 | Default low |

#### Inbox
| Condition | Urgency Score | Description |
|-----------|--------------|-------------|
| <4 hours old | 1.00 | Very recent |
| <24 hours old | 0.80 | Same day |
| 1-2 days old | 0.60 | Recent |
| 2-3 days old | 0.40 | Getting stale |
| 3+ days old | 0.20 | Stale |

#### Calendar
| Condition | Urgency Score | Description |
|-----------|--------------|-------------|
| <1 hour | 1.00 | Starting very soon |
| 1-2 hours | 0.95 | Starting soon |
| 2-4 hours | 0.80 | Today, soon |
| 4-24 hours | 0.60 | Today |
| 24-48 hours | 0.40 | Tomorrow |
| 48+ hours | 0.20 | 2+ days away |

### Importance Scoring Breakdown

#### Tasks
| Condition | Importance Score |
|-----------|-----------------|
| High priority | 1.00 |
| Medium priority | 0.60 |
| Low priority | 0.30 |
| No priority | 0.50 (default) |

#### Inbox
| Condition | Importance Score |
|-----------|-----------------|
| Unread | 0.90 |
| Read | 0.70 |

#### Calendar
| Condition | Importance Score |
|-----------|-----------------|
| All events | 0.80 (fixed) |

### Priority Score Examples

| Item | Urgency | Importance | Priority Score | Calculation |
|------|---------|-----------|----------------|-------------|
| Overdue high-priority task | 1.00 | 1.00 | **1.00** | 0.6*1.0 + 0.4*1.0 = 1.0 |
| Due today medium-priority task | 0.90 | 0.60 | **0.78** | 0.6*0.9 + 0.4*0.6 = 0.78 |
| Unread email (4h old) | 1.00 | 0.90 | **0.96** | 0.6*1.0 + 0.4*0.9 = 0.96 |
| Calendar event in 1 hour | 1.00 | 0.80 | **0.92** | 0.6*1.0 + 0.4*0.8 = 0.92 |
| Due tomorrow low-priority task | 0.70 | 0.30 | **0.54** | 0.6*0.7 + 0.4*0.3 = 0.54 |

---

## Expected Score Distributions

Use these as benchmarks to validate the system is working correctly.

### Healthy Distribution

A well-tuned v1 system should show:

```
TOP 8 ITEMS SCORE DISTRIBUTION:
├─ Very urgent (>0.85): 1-2 items
│  └─ Overdue high-priority tasks, events <2h, urgent unread emails
├─ Urgent (0.70-0.85): 2-4 items
│  └─ Due today tasks, recent inbox, events today
├─ Moderate (0.50-0.70): 2-3 items
│  └─ Due soon tasks, older inbox
└─ Lower (<0.50): Should NOT appear in top 8

SOURCE DISTRIBUTION:
├─ Tasks: 3-5 items (most common)
├─ Inbox: 1-3 items (varies with email volume)
└─ Calendar: 0-2 items (depends on time of day)

AVERAGE SCORE: 0.70-0.85 (healthy range)
MIN SCORE: 0.50-0.65 (items at threshold)
MAX SCORE: 0.90-1.00 (highest urgency items)
```

### Unhealthy Distributions

#### Problem 1: All High Scores (>0.90)

```
Symptoms:
- Avg score > 0.90
- Min score > 0.80
- All items marked urgent

Cause: Too many overdue/urgent items (need to clear backlog)
Action: Work down the list, mark tasks complete
```

#### Problem 2: All Low Scores (<0.60)

```
Symptoms:
- Avg score < 0.60
- Max score < 0.75
- Nothing feels urgent

Cause: No upcoming deadlines or inbox activity
Action: Normal - system is working correctly (low workload)
```

#### Problem 3: Inbox Dominates (6+ inbox items)

```
Symptoms:
- 6+ inbox items in top 8
- Tasks pushed out
- All inbox items are old (3+ days)

Cause: Inbox importance weight too high OR stale email backlog
Action: Either:
  1. Clear old emails (resolve/snooze)
  2. Decrease inbox importance (tune config)
```

#### Problem 4: Calendar Dominates (4+ calendar items)

```
Symptoms:
- 4+ calendar items in top 8
- Tasks pushed out
- All events are far in future (48h away)

Cause: Calendar importance too high OR too many scheduled events
Action: Either:
  1. Reduce calendarUpcomingWindow to 24 hours
  2. Decrease calendar importance (tune config)
```

---

## Tuning Checklist

### Week 1: Enable & Observe

**Goal:** Gather data on v1 behavior without tuning.

- [ ] Enable unified priority v1 for yourself (feature flag ON)
- [ ] Add `?debug_priority=1` to dashboard URL
- [ ] Check priority list 3x per day (morning, midday, evening)
- [ ] Export debug JSON each time (use "Export JSON" button)
- [ ] Note any surprises or missing items in a doc

**What to observe:**
- Are the top 3 items actually what you'd prioritize manually?
- Are any critical items missing from the top 8?
- Are any low-priority items appearing in top 8?
- What's the average score range?

---

### Week 2: Adjust Weights (if needed)

**Goal:** Tune urgency/importance weights based on Week 1 observations.

#### Scenario A: Too Many Stale Emails

**Symptoms:** Old (3+ days) unread emails dominating top 8

**Solution:** Decrease inbox importance

```typescript
// src/types/priority.ts - V1_PRIORITY_CONFIG
weights: {
  urgency: 0.60,
  importance: 0.35,  // Decreased from 0.40
}
```

**Expected Result:** Inbox items score slightly lower, more tasks appear.

---

#### Scenario B: Missing Urgent Tasks

**Symptoms:** Critical due-today tasks not appearing in top 8

**Solution:** Increase urgency weight

```typescript
// src/types/priority.ts - V1_PRIORITY_CONFIG
weights: {
  urgency: 0.65,     // Increased from 0.60
  importance: 0.35,  // Decreased from 0.40
}
```

**Expected Result:** Due dates matter more, tasks rise to top.

---

#### Scenario C: Calendar Noise

**Symptoms:** Far-future calendar events (tomorrow, 2 days away) appearing in top 8

**Solution:** Reduce calendar window

```typescript
// src/types/priority.ts - V1_PRIORITY_CONFIG
calendarUpcomingWindow: 24,  // Decreased from 48 hours
```

**Expected Result:** Only today's events appear.

---

### Week 3: Validate with Users

**Goal:** Confirm v1 works for 5+ users.

- [ ] Enable unified priority v1 for 5 internal users
- [ ] Ask each user: "Are the top 3 items correct?"
- [ ] Collect feedback on missing items or noise
- [ ] Iterate on weights if needed
- [ ] Document final weights in this guide

**Success Criteria:**
- 4 out of 5 users confirm top 3 items are correct
- No critical items missing from top 8
- Avg score in healthy range (0.70-0.85)

---

### Week 4: Full Rollout

**Goal:** Enable v1 for all users.

- [ ] Set `ENABLE_UNIFIED_PRIORITY_V1 = true` by default
- [ ] Monitor logs for errors or unexpected scores
- [ ] Keep debug panel accessible via URL param for troubleshooting
- [ ] Deprecate old `usePriorityItems` hook (leave in place for now)

---

## Common Issues & Solutions

### Issue 1: "Unread emails from 5 days ago are top priority"

**Root Cause:** Inbox urgency score doesn't decay fast enough.

**Solution:** Modify `computeInboxUrgencyScore` in `priorityScoringV1.ts`:

```typescript
// BEFORE
else if (hoursOld < 72) {
  return 0.4; // 2-3 days old
} else {
  return 0.2; // Older than 3 days
}

// AFTER (more aggressive decay)
else if (hoursOld < 72) {
  return 0.3; // 2-3 days old
} else {
  return 0.1; // Older than 3 days (reduced)
}
```

---

### Issue 2: "No tasks appearing, only inbox and calendar"

**Root Cause:** Most tasks have no due date (urgency = 0.2) and default importance (0.5), resulting in low priority score.

**Solution:** Increase default task importance OR encourage users to set due dates.

```typescript
// src/lib/priority/priorityScoringV1.ts
export function computeTaskImportanceScore(priority) {
  if (!priority) {
    return 0.6; // Increased from 0.5 (default now medium-high)
  }
  // ...
}
```

---

### Issue 3: "Calendar event at 5 PM tomorrow is top priority, but it's 9 AM"

**Root Cause:** Calendar importance is too high (0.8), causing far-future events to dominate.

**Solution:** Decrease calendar importance OR reduce upcoming window to 24 hours.

```typescript
// src/lib/priority/priorityScoringV1.ts
export function computeCalendarImportanceScore(): number {
  return 0.6; // Decreased from 0.8
}
```

---

### Issue 4: "Debug panel shows 0 items"

**Root Cause:** All items excluded by filters (completed, resolved, snoozed).

**Check:**
1. Are there any incomplete tasks?
2. Are there any unresolved inbox items?
3. Are there any calendar events in next 48 hours?

**Solution:** If genuinely no items, system is working correctly. Otherwise, check exclusion logic in `shouldExcludeV1`.

---

## Rollout Plan

### Phase 1: Internal Testing (Week 1-2)

- **Who:** You + 1-2 other team members
- **Flag:** `?debug_priority=1` URL param
- **Goal:** Validate basic functionality, observe scores
- **Action:** Export JSON daily, note issues

### Phase 2: Tuning (Week 2-3)

- **Who:** Same internal users
- **Goal:** Adjust weights based on observations
- **Action:** Iterate on config, re-test

### Phase 3: Beta Testing (Week 3-4)

- **Who:** 5+ internal users
- **Flag:** Enable v1 by default (but old system still accessible)
- **Goal:** Validate with diverse use cases
- **Action:** Collect feedback, final tuning

### Phase 4: Full Rollout (Week 4+)

- **Who:** All users
- **Flag:** v1 becomes default, old system deprecated
- **Goal:** Production use
- **Action:** Monitor logs, keep debug panel available for troubleshooting

---

## Tuning Log Template

Use this template to track tuning decisions:

```
DATE: 2025-12-08
OBSERVER: Harry
OBSERVATION: Too many stale emails (3+ days old) in top 8
DATA: Avg score 0.82, 6 out of 8 items are inbox (all 3+ days old)
HYPOTHESIS: Inbox importance weight too high (0.40) OR urgency decay too slow
SOLUTION: Decreased inbox importance to 0.35 AND increased urgency decay for old emails
RESULT: (test and record here)
NEW AVG SCORE: (record here)
SUCCESS: Yes / No / Needs more tuning
```

---

## Next Steps After v1 Stabilizes

Once v1 is working well (Week 4+), document lessons learned and plan v2:

**v2 Roadmap:**
1. Add recency scoring (15% weight)
2. Add portfolio/pipeline companies as standalone priority items
3. Add diversity rules (max 3 per source)
4. Add score threshold (min 0.3)
5. Add commitment scoring (20% weight)

See `docs/priority_system/04_v2_roadmap.md` for detailed v2 plan.

---

## Questions?

For implementation details, see:
- `docs/priority_system/02_proposed_model.md` - Full design
- `src/types/priority.ts` - V1_PRIORITY_CONFIG
- `src/lib/priority/priorityScoringV1.ts` - Scoring functions

For tuning help, consult this guide or experiment with debug panel.
