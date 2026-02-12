# Casper — Product Goals Baseline

**Last updated**: 2026-02-12
**Owner**: Harrison Kioko

---

## Vision

A sleek command center that captures everything you commit to, everything you consume, and everything you're tracking — then turns that messy inflow into a clear, prioritized "what to do next" view. The single system across portfolio management, deal pipeline, and personal productivity.

## The Funnel Model

```
INTAKE (wide funnel) → ENRICHMENT → PRIORITIZATION → [EXECUTION (future phase)]
   Quick tasks            Entity linking    Focus queue       Send emails
   Emails                 Summaries         Daily clarity     Review data rooms
   Notes                  Domain matching   Smart nudges      Follow up on intros
   Links                  Context linking   Batch surfacing   Book reservations
   Pipeline tracking      Extracted actions
   Relationship signals
```

**Phase 1 priority**: Perfect the intake → enrichment → prioritization funnel. Execution happens elsewhere for now, but the foundation should support eventual on-platform execution for select actions.

## Five Core Goals

### 1. Frictionless capture from a very wide funnel
One place to dump any input fast — tasks, emails, notes, links, pipeline updates, reminders. Minimal ceremony. The system meets you where you are, regardless of which context you're in.

**Current assessment (Feb 2026)**: Task capture exists but quick entry lacks confidence feedback. Email requires manual forwarding. No notes system yet. Links require manual paste. Pipeline entry is manual. The funnel is narrower than it should be.

### 2. Daily clarity, not just storage
Answer "What matters today? What's overdue? What's waiting? What can I close in 5 minutes?" — a curated focus set, not an infinite list. Reduce the cognitive load of constant context-switching.

**Current assessment (Feb 2026)**: Dashboard shows ~50 data points at a glance. Priority panel and obligations exist. But no morning briefing ritual, triage is a separate page, and there's no synthesized "day plan" across all contexts.

### 3. Context preservation across work
Everything linkable to projects, companies, people, prior threads. Progress accumulates across the portfolio/pipeline/personal divide. Not disconnected lists.

**Current assessment (Feb 2026)**: STRONGEST AREA. Tasks link to projects, portfolio, and pipeline companies. People directory with roles. Pipeline companies accumulate interactions, tasks, communications. Reading items link to projects. Entity enrichment on emails. Cross-entity navigation works. Institutional memory compounds over time at the company and project level.

### 4. Action intelligence
Time-aware nudges, suggested next moves, enrichment, prioritization. Assistive, skimmable, easy to accept or dismiss. Helps you switch contexts without losing the thread.

**Current assessment (Feb 2026)**: WEAKEST AREA. Overdue detection exists. Pipeline stale detection (14-day threshold) works. Email suggestions are VC-intent-aware. But no proactive nudges, no "you haven't followed up with X," no smart batching of quick tasks, no time-of-day awareness, no auto-prioritization beyond basic overdue bubbling.

### 5. Premium, delightful experience
Modern, glassy, calm UI. Fast, dense, beautiful. A cockpit that makes you want to come back every day.

**Current assessment (Feb 2026)**: STRONG. Glassmorphic design system is well-executed. Space Grotesk + Inter typography. Framer Motion animations are snappy. Information density is well-calibrated. Dark mode is polished. Feels premium. Quick task entry feedback could be stronger.

## Success Criteria

- **Daily habit + trust**: First and last tab you open. Canonical source of truth for all commitments.
- **Nothing slips**: Intros become tracked actions, meetings generate follow-ups, emails become tasks, reading becomes reusable context.
- **Lower cognitive load**: Less time scanning, sorting, re-finding. More time executing.
- **Faster throughput on small stuff**: Quick replies and micro-tasks cleared in batches.
- **Compounding workspace**: Each company/project/person page gets denser and more valuable over time.
- **Confidence**: If it's in Casper, it will get done. If it's not in Casper, it doesn't need to get done.

## North Star Metric

**"Nothing falls through the cracks."** Total confidence that every commitment — across portfolio, pipeline, and personal — is captured and will surface at the right time.

## Desired New Functional Areas

- **Notes & writing**: Quick notes, meeting notes, long-form writing — beyond just tasks

## Goal Priority Order (Feb 2026)

1. **Goal 4: Action intelligence** — Biggest gap. Without nudges and smart prioritization, things fall through despite being captured.
2. **Goal 1: Frictionless capture** — Funnel needs widening (email sync, notes, capture confidence).
3. **Goal 2: Daily clarity** — Dashboard is good but not a daily ritual driver yet.
4. **Goal 3: Context preservation** — Already strong. Maintain and extend.
5. **Goal 5: Premium experience** — Already strong. Polish as other goals advance.
