# Casper Product Strategy Review — 2026-02-12

---

## Executive Summary

Casper has built a **strong foundation** — the context/linking layer is genuinely impressive, the UI is premium, and the architecture is well-designed for a VC operating system. But it's not yet earning daily-driver trust because **things still fall through the cracks despite being capturable**. The core problem isn't intake (which works) or storage (which is solid) — it's that **the system doesn't actively fight for your attention on the right things at the right time**. The intelligence layer is the weakest area, and it's the one that would transform Casper from "a tool I use" to "a system I trust." The single biggest thing holding Casper back from "I can't work without this" is: **no proactive nudges or time-aware resurfacing** — items enter the system but don't reliably come back to you when they matter.

---

## Daily Driver Scorecard

| Dimension | Rating | One-Liner |
|---|---|---|
| Morning: Do I open it first? | :yellow_circle: | Dashboard is dense and informative but doesn't feel like a morning briefing — same view at 9pm as 9am |
| Context switches: Does it help me shift gears? | :yellow_circle: | Entity pages accumulate context well, but no meeting-prep or transition assistance |
| During day: Do I stay in it? | :yellow_circle: | Tasks and pipeline live here, but email requires forwarding and notes don't exist yet |
| End of day: Did it keep me honest? | :red_circle: | No proactive "you didn't do X" or "these slipped today" — you have to self-audit |
| Trust: Single source of truth? | :yellow_circle: | Most things go in, but quick capture confidence is low and some random tasks don't make it |
| Confidence: Nothing falling through cracks? | :red_circle: | Items enter but don't reliably resurface — intelligence layer too passive |

---

## Intake Funnel Scorecard

| Input Type | Capture Speed | Context Preserved | Cross-Linking | Retrieval | Action Conversion |
|---|---|---|---|---|---|
| Tasks (any context) | :green_circle: 1-step, <1s | :green_circle: Inline enrichment chips | :green_circle: Project + company + pipeline | :green_circle: Time-grouped + search + filters | :yellow_circle: Focus queue exists but passive |
| Emails | :yellow_circle: Forward-only | :green_circle: AI extraction (summary, entities, next step) | :green_circle: Domain matching to companies | :green_circle: Smart filters + suggestions | :yellow_circle: One-at-a-time processing, no batch |
| Reading/Links | :yellow_circle: Manual paste only | :green_circle: AI enrichment (topics, actionability, entities) | :yellow_circle: Project linking only, entities not linked to master records | :green_circle: Multi-view + fuzzy search + signals | :yellow_circle: Signals view exists but no auto-surfacing |
| Pipeline signals | :yellow_circle: Manual entry | :green_circle: Harmonic enrichment, interaction history | :green_circle: Tasks + calendar + email auto-linked | :green_circle: Kanban + attention badges + stale detection | :yellow_circle: Stale detection passive, no push |
| Notes/quick thoughts | :red_circle: No notes system | :red_circle: N/A | :red_circle: N/A | :red_circle: N/A | :red_circle: N/A |

---

## Intelligence Layer Scorecard

| Capability | Working? | Trusted? | Biggest Gap |
|---|---|---|---|
| Entity enrichment | :green_circle: Working (Harmonic for pipeline, AI for emails, Microlink for links) | :green_circle: Generally accurate | Enriched entities (companies/people from emails/links) not linked to master records |
| Prioritization / focus queue | :yellow_circle: Exists (Up Next + Triage) | :yellow_circle: Partially — overdue bubbles up, but no smart ranking | No urgency scoring, no effort-based batching, no "clear these 4 quick wins" |
| Contextual nudges | :red_circle: Not implemented | :red_circle: N/A | No "you haven't followed up with X," no stale commitment alerts pushed to you |
| Cross-domain linking | :green_circle: Strong within entities | :green_circle: Works well | Project ↔ Company not linked; entity_links table unused; no unified cross-domain search |

---

## Execution Readiness

| Future Capability | Data Ready? | Architecture Ready? | What's Missing |
|---|---|---|---|
| Send follow-up emails | :yellow_circle: Email data + company context exists | :yellow_circle: Microsoft auth exists for calendar, could extend | Email send scope not in OAuth; no compose UI; no template system |
| Follow up on intros | :green_circle: Intro detection in email suggestions works | :yellow_circle: Task creation from intros works | No auto-scheduling of follow-up; no relationship tracking over time for intros |
| Review data rooms | :yellow_circle: Attachments saved to companies | :red_circle: No data room viewer or structured review flow | No document classification; no checklist-based review; no annotation |
| Book reservations | :red_circle: No reservation data model | :red_circle: No integration points | Would need entirely new capability |

---

## Critical Gaps (Blocking daily-driver trust)

### Gap 1: No Proactive Nudges or Time-Aware Resurfacing
- **What**: Items enter Casper but don't come back to you. Overdue tasks are flagged visually but there's no push — no "you committed to X and it's now 3 days late," no "you haven't touched pipeline company Y in 3 weeks," no "5 quick tasks you could clear before your next meeting."
- **How it shows up**: End of day, you realize things slipped. You don't trust Casper to be the safety net because the safety net is passive — it catches but doesn't alert.
- **Recommended fix**: Build a lightweight nudge engine. Priority: (1) Overdue task alerts on dashboard load, (2) Stale pipeline company alerts, (3) "Quick wins before next meeting" based on effort_category + calendar gaps, (4) Weekly email/digest of what slipped.
- **Complexity**: Medium
- **Phase**: Prioritization / Intelligence

### Gap 2: Quick Task Capture Doesn't Inspire Confidence
- **What**: Harrison reported that "quick task entry doesn't give a ton of confidence that it's in there." The 1-step capture is fast but the feedback is minimal — a toast notification that disappears. No visual confirmation of WHERE the task landed, no preview of what it looks like in the system.
- **How it shows up**: Random tasks don't make it in because you're not sure they stuck. The trust gap starts at the very first step.
- **Recommended fix**: After quick capture, show a brief inline confirmation with the task content + a "View in Triage" link. Consider a persistent "just captured" mini-list that shows your last 3 captures. The goal: you should never wonder "did that save?"
- **Complexity**: Small
- **Phase**: Intake

### Gap 3: Email Requires Manual Forwarding
- **What**: No direct Outlook/Gmail sync. Every email that enters Casper requires you to manually forward it. Microsoft auth is configured for Calendar only.
- **How it shows up**: Important emails that should become tasks never enter Casper because forwarding adds friction. The intake funnel has a bottleneck at the widest point.
- **Recommended fix**: Extend Microsoft OAuth to include Mail.Read scope. Build background email sync (similar to calendar sync). Start with inbox scanning and let user select which emails to process, rather than processing all.
- **Complexity**: Large
- **Phase**: Intake

### Gap 4: No Notes or Quick Thought Capture
- **What**: Harrison wants notes & writing but the system has no notes functionality outside of project notes. When something comes up in a meeting, there's no fast capture path for unstructured thoughts.
- **How it shows up**: Meeting notes go to other apps. Quick thoughts get lost. The "wide funnel" has a hole for the most common input type: free-form text.
- **Recommended fix**: Add a lightweight notes system. Not a full editor — just quick capture with optional project/company linking. Could be as simple as a text field that creates a note linked to whatever context you're in.
- **Complexity**: Medium
- **Phase**: Intake

### Gap 5: No Batch Email Processing
- **What**: Inbox processes one email at a time. No multi-select, no bulk actions, no "process these 20 emails and create tasks for the ones that need them."
- **How it shows up**: Email processing is slow. A morning batch of 15-20 emails takes 15+ minutes because each requires opening, reviewing suggestions, and confirming individually.
- **Recommended fix**: Add multi-select to inbox list. Auto-generate suggestions for selected emails. Show a batch review screen: "5 tasks to create, 3 companies to link, 7 FYI-only." One-click confirm all or review individually.
- **Complexity**: Medium
- **Phase**: Intake / Enrichment

---

## High-Impact Opportunities (From "useful" to "indispensable")

### Opportunity 1: Morning Briefing View
- **What**: A time-aware dashboard mode that synthesizes your day. "You have 6 meetings today. 3 overdue tasks. 2 pipeline companies need follow-up. Here are your top 5 priorities."
- **How it shows up**: Instead of opening Casper to a dense dashboard and self-selecting what to focus on, you'd get a curated "here's your day" that accounts for calendar + tasks + pipeline + obligations.
- **Recommended fix**: New component that reads calendar events, overdue tasks, stale pipeline companies, and obligations — then synthesizes a ranked action list. Time-aware: different content at 8am vs 2pm vs 6pm.
- **Complexity**: Medium
- **Phase**: Prioritization

### Opportunity 2: Meeting Prep & Debrief Automation
- **What**: Before a meeting with Company X, auto-surface: their page context, recent interactions, open tasks, last email thread, any reading items tagged to them. After the meeting, prompt for follow-up capture.
- **How it shows up**: You stop scrambling to pull up context before meetings. Post-meeting follow-ups are captured immediately, not forgotten.
- **Recommended fix**: Calendar-triggered prep cards. When a meeting is 15 min away, surface linked company context. Post-meeting prompt: "Any follow-ups from [Meeting Name]?" with quick task creation.
- **Complexity**: Medium
- **Phase**: Enrichment / Prioritization

### Opportunity 3: Smart Effort Batching
- **What**: "You have 10 minutes before your next meeting. Here are 3 quick tasks you could close." Based on effort_category (quick = <15min) and calendar gap analysis.
- **How it shows up**: Micro-gaps between meetings become productive. Quick follow-up emails, short reads, small tasks get cleared in batches rather than accumulating.
- **Recommended fix**: Calendar gap detection + effort-filtered task queue. Surface "quick wins" when gaps detected. Include quick reading items from "up next / today" bucket.
- **Complexity**: Small-Medium
- **Phase**: Prioritization

### Opportunity 4: Unified Cross-Domain Search
- **What**: Search across everything — tasks, emails, notes, pipeline companies, reading items, projects, people — from one search bar. "Find everything related to Company X."
- **How it shows up**: Currently, search is per-section. To find everything about a company, you'd check pipeline, tasks, inbox, and reading list separately.
- **Recommended fix**: Extend the command palette (Cmd+K) to search across all entity types. Return grouped results: "3 tasks, 2 emails, 1 pipeline company, 4 reading items."
- **Complexity**: Medium
- **Phase**: Foundation

---

## Quick Wins (Noticeable improvement, low effort)

### QW1: Richer Task Capture Confirmation
- **What**: After quick task creation, show an inline confirmation card (not just a toast) with the task content, a "View" link, and the triage section count updating.
- **Impact**: Directly addresses Harrison's #1 frustration — "doesn't give confidence that it's in there."
- **Complexity**: Small (2-3 hours)
- **Phase**: Intake

### QW2: Nonnegotiables Backend Persistence
- **What**: Nonnegotiables checkboxes are local state only — they don't persist. Add database sync so streaks are real.
- **Impact**: Daily habits become trackable. Streaks create motivation loops.
- **Complexity**: Small (3-4 hours)
- **Phase**: Foundation

### QW3: Undo on Destructive Actions
- **What**: Add "Undo" buttons to Sonner toasts for task completion, archival, and deletion. Currently irreversible from the UI.
- **Impact**: Reduces anxiety about accidental clicks. Increases willingness to process quickly.
- **Complexity**: Small (2-3 hours)
- **Phase**: Experience

### QW4: "Last Captured" Persistent Mini-List
- **What**: Small floating widget (or sidebar section) showing the last 3-5 items you captured (tasks, links, emails processed). Always visible. Confirms the funnel is working.
- **Impact**: Builds confidence that items are entering the system. Doubles as a quick-access list for recent captures.
- **Complexity**: Small (3-4 hours)
- **Phase**: Intake

### QW5: Dashboard Overdue Counter with Forced Engagement
- **What**: Instead of passively showing overdue items in the priority panel, add a prominent "X items overdue" banner at the top of the dashboard that requires acknowledgment (snooze or view) to dismiss.
- **Impact**: Forces engagement with slipping items. Makes the safety net active, not passive.
- **Complexity**: Small (2-3 hours)
- **Phase**: Prioritization

### QW6: Project ↔ Company Linking
- **What**: Add optional `company_id` or `pipeline_company_id` to projects table. Allow marking a project as "related to Company X."
- **Impact**: Enables "show all projects for this company" and vice versa. Strengthens the already-strong cross-linking layer.
- **Complexity**: Small (3-4 hours)
- **Phase**: Context preservation

---

## Strategic Bets (Transformative if executed well)

### Bet 1: Intelligent Nudge Engine
- **Rationale**: This is the single highest-leverage investment. Every other improvement is amplified if the system actively surfaces the right things at the right time. Without nudges, Casper is a well-organized database. With nudges, it's an active co-pilot.
- **What it would do**: (1) Morning briefing synthesis, (2) Calendar-gap quick-win surfacing, (3) Stale relationship alerts, (4) Overdue commitment escalation, (5) Weekly digest of what slipped. All dismissable, all learning from dismissal patterns over time.
- **Phasing**: Start with rule-based nudges (overdue > 3 days, stale > 14 days, calendar gap > 15 min). Add ML scoring later if rule-based proves valuable.
- **Complexity**: Large (multi-phase)

### Bet 2: Direct Email Integration
- **Rationale**: Email is the primary input channel for a VC. Every intro, every update, every data room link, every scheduling thread comes via email. Manual forwarding means the funnel has a leak at its widest point.
- **What it would do**: Background Outlook sync → auto-scan for actionable emails → surface in inbox with suggestions → batch process.
- **Phasing**: (1) Extend OAuth for Mail.Read, (2) Background sync daemon, (3) Smart filtering (skip newsletters, auto-archive FYI), (4) Batch processing UI.
- **Complexity**: Large (multi-phase)

### Bet 3: Notes & Writing System
- **Rationale**: Harrison wants it. Meeting notes are the most common capture type for a VC. Without notes, Casper misses the majority of in-meeting capture.
- **What it would do**: Quick note capture with auto-linking to the current context (if you're on a company page, note auto-links). Meeting note template triggered by calendar events. Optional AI summarization.
- **Phasing**: (1) Basic note creation with entity linking, (2) Meeting-triggered templates, (3) AI summarization and action extraction from notes.
- **Complexity**: Medium-Large (multi-phase)

### Bet 4: Relationship Intelligence Layer
- **Rationale**: A VC's most valuable asset is relationships. Casper has the people table with relationship tiers, but it's unused in the UI. VIP flags exist but trigger nothing.
- **What it would do**: Track "days since last contact" per person (not just per company). Surface nurturing reminders ("You haven't connected with Sarah in 30 days"). Show relationship health dashboard. Auto-detect introductions from emails and track their outcomes.
- **Phasing**: (1) Activate relationship tier in UI + days-since-contact, (2) Relationship nurturing nudges, (3) Intro tracking pipeline, (4) Relationship health dashboard.
- **Complexity**: Large (multi-phase)

---

## Goals Assessment

### Current State vs. Goals (Feb 2026)

| Goal | Status | Trend | Notes |
|---|---|---|---|
| 1. Frictionless capture | :yellow_circle: Partial | Stable | Tasks fast but low confidence. Email forward-only. No notes. Links manual. |
| 2. Daily clarity | :yellow_circle: Partial | Stable | Dashboard dense but not a ritual. Triage exists but separate. No synthesis. |
| 3. Context preservation | :green_circle: Strong | Improving | Best area. Companies, projects, people compound. Cross-linking works. |
| 4. Action intelligence | :red_circle: Weak | Stagnant | Overdue detection and stale flagging only. No nudges, no smart batching, no time-awareness. |
| 5. Premium experience | :green_circle: Strong | Stable | Glassmorphic design excellent. Animations polished. Density well-calibrated. |

### Priority Order for Next Development Cycle

1. **Action Intelligence** — Build the nudge engine. This is the gap between "I use it" and "I trust it." Start with rule-based nudges: overdue alerts, stale pipeline warnings, quick-win surfacing.
2. **Capture Confidence** — Quick wins: richer confirmation feedback, "last captured" widget, undo actions. Small effort, big trust impact.
3. **Notes System** — Fill the biggest hole in the intake funnel. Even a basic notes system would capture meeting output that currently goes elsewhere.
4. **Morning Briefing** — Transform the dashboard from "information display" to "daily ritual driver." Time-aware synthesis of what matters now.
5. **Email Integration** — Largest effort, highest long-term value. Remove the forwarding bottleneck.

### Recommendation: Funnel First, or Execution?

**The funnel needs more work before execution features.** Here's why:

The current intake is ~70% of what it needs to be (missing notes, email sync is friction-heavy, capture confidence is low). The enrichment layer is ~75% (AI extraction works but entities don't link to master records, and enrichment results don't compound across items). The prioritization layer is ~40% (basic overdue/stale detection, but no proactive nudges, no smart batching, no time-awareness).

Building execution features (send emails, book reservations) on top of a 40% prioritization layer would mean: the system could DO things, but wouldn't know WHEN to do them. That's the wrong order.

**Recommended sequence:**
1. Shore up prioritization (nudge engine, morning briefing, effort batching)
2. Widen intake (notes, email sync, capture confidence)
3. Strengthen enrichment (entity linking to master records, cross-domain search)
4. THEN begin selective execution (follow-up emails first, as highest-value)

---

*Review conducted 2026-02-12. Next review recommended in 4-6 weeks after nudge engine and capture confidence improvements ship.*
