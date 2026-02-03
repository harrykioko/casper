# Casper System Audit v2.1

**Date:** February 2026
**Scope:** Full system evaluation against the Casper north star
**Audience:** Product owner / sole operator
**Delta from v2:** Obligations Engine v1 implemented (commitments integrated into Focus Queue, Dashboard, Inbox, and dedicated /obligations page)

---

## 1. Executive Summary

Casper has crossed a meaningful threshold since v2. The Obligations Engine v1 closes the largest structural gap identified in the previous audit: commitments are no longer a disconnected schema object. They now flow through the same backfill → enrichment → priority scoring → triage pipeline as emails, tasks, calendar events, notes, and reading items. The system can now answer "what promises am I at risk of breaking?" from multiple surfaces.

**What's working:**
- Everything from v2 (inbox ingestion, AI suggestions, company linking, Focus Queue, polymorphic notes, people graph).
- **Commitments are bidirectional.** `owed_by_me` and `owed_to_me` directions are tracked with direction-aware scoring, badges, and date semantics (`due_at` for obligations I owe, `expected_by` for things owed to me).
- **Commitments flow through Focus Queue.** Open commitments create work items via backfill, receive priority scoring (urgency from date proximity, importance from direction + VIP status), and appear alongside emails and tasks in the unified triage surface.
- **Focus Queue has commitment-specific triage.** 8 actions: Complete, Add Note, Snooze, Delegate (owed_by_me only), Mark Waiting On (owed_by_me + open), Follow Up (owed_to_me or waiting_on), Mark Broken, Cancel. State-aware visibility ensures only relevant actions appear.
- **Counterparty context panel** shows person details, VIP status, company context, and recent commitments with that counterparty — directly in the Focus Queue drawer.
- **Dashboard surfaces at-risk obligations.** Overdue commitments, stale waiting-on items, high-urgency obligations, and items due today appear in a dedicated panel above the main grid.
- **Dedicated /obligations page** with direction tabs, status filtering, search, and creation.
- **Inbox → commitment path exists.** `CREATE_WAITING_ON` suggestion type enables AI-powered commitment creation from email. `CREATE_FOLLOW_UP_TASK` can also create commitments via the form's "Also create task" toggle.
- **Inbox activity logging.** Actions taken on inbox items are recorded in the `inbox_activity` table, providing the resolution audit trail that was missing in v2.
- **Stale commitment detection.** `mark_stale_commitments` RPC uses implied_urgency thresholds (high=1d, medium=3d, low=7d) to auto-flag commitments as broken.

**What's not working yet:**
- **No outbound email tracking.** The system still cannot see what the user sends — commitments made in email replies remain invisible unless manually created.
- **No effort estimation on Focus Queue items.** The user cannot filter by "what can I do in 15 minutes."
- **No start-of-day briefing.** The user must manually check Dashboard + Focus Queue + Inbox to understand their situation.
- **No unified snooze surface.** Snoozed items across inbox, tasks, commitments, and work items are independent.
- **Backfill still runs on page load.** No background processing or push-based notifications.
- **Pipeline companies don't surface proactively.** `is_top_of_mind` flag exists but pipeline items don't enter Focus Queue.

**Net assessment:** Casper now delivers on the core promise for tracked obligations — the user can see what's at risk, triage commitments alongside other work, and trust that overdue items will escalate. The remaining gaps are in capture breadth (outbound, non-email), time-aware planning (effort, daily briefing), and proactive surfacing (background processing, pipeline).

---

## 2. System Map (Current State)

### 2.1 First-Class Objects

| Object | Table | Created By | Links To | Resolved By | Participates in Prioritization |
|--------|-------|-----------|----------|-------------|-------------------------------|
| **Inbox Item** | `inbox_items` | Email ingestion (edge function `email-inbox-ingest`) | Company (direct FK), Tasks (via `source_inbox_item_id`), Suggestions, Attachments, Work Items, Activity Log | `is_resolved`, `is_deleted` (archive) | Yes — Focus Queue via `work_items` |
| **Task** | `tasks` | Manual, from inbox suggestion, from Focus triage | Project, Category, Company (portfolio), Pipeline Company, Source Inbox Item | `completed`, `archived_at` | Yes — Focus Queue, priority scoring |
| **Project** | `projects` | Manual | Tasks, Notes, Assets, Prompts, Reading Items, Nonnegotiables | `status` field (no formal lifecycle) | No |
| **Company (Portfolio)** | `companies` | Manual | Contacts, Interactions, Tasks, Calendar Links, Inbox Items, People, Commitments | `status` enum (active/watching/exited/archived) | No |
| **Pipeline Company** | `pipeline_companies` | Manual, from inbox suggestion | Contacts, Interactions, Notes, Attachments, Enrichments, Tasks | `status` string | No |
| **Commitment** | `commitments` | Manual, from inbox suggestion (CREATE_WAITING_ON), from interaction | Person, Company, Source (call/email/meeting), Direction (owed_by_me/owed_to_me) | `status` enum + `resolved_at` | **Yes** — Focus Queue via `work_items`, priority scoring, Dashboard |
| **Person** | `people` | Manual | Company roles, Interactions, Commitments | N/A (reference entity) | Indirectly (VIP status boosts commitment importance) |
| **Note** | `project_notes` + `note_links` | Manual, floating note (Cmd+Shift+N), from commitment triage | Any target via `note_links` (task, company, project, reading_item, calendar_event) | N/A (persistent) | Only if orphaned (Focus Queue backfill) |
| **Calendar Event** | `calendar_events` | Outlook sync | Company links, Link suggestions, Work Items | N/A (time-bound) | Yes — Focus Queue |
| **Reading Item** | `reading_items` | Manual (URL paste) | Project, Topics, Entities | `is_read`, `is_archived` | Yes — Focus Queue (if unprocessed) |
| **Inbox Suggestion** | `inbox_suggestions` | AI (edge function `inbox-suggest-v2`) | Inbox Item (1:1) | Dismissed or acted upon | Indirectly (drives inbox actions) |
| **Work Item** | `work_items` | Backfill (`useBackfillWorkItems`) + `ensureWorkItem` | Source (polymorphic: email, task, calendar_event, note, reading, **commitment**), Entity Links | `status` (trusted/ignored) | **Yes** — this IS the prioritization layer |
| **Inbox Activity** | `inbox_activity` | Action handlers (task creation, linking, resolution) | Inbox Item, Target (polymorphic) | N/A (audit log) | No |
| **Entity Link** | `entity_links` | Deterministic enrichment, manual linking | Source ↔ Target (polymorphic) | N/A (graph edge) | Indirectly (resolves reason codes) |
| **Inbox Attachment** | `inbox_attachments` | Email ingestion | Inbox Item | N/A | No |
| **Item Extract** | `item_extracts` | AI enrichment (`focus-enrich`) | Source (polymorphic) | N/A (metadata) | Indirectly (provides one-liners) |

### 2.2 Key Enums

- **Commitment Status:** open, **waiting_on**, completed, broken, delegated, cancelled
- **Commitment Direction:** owed_by_me, owed_to_me
- **Commitment Source:** call, email, meeting, message, manual
- **Company Kind:** portfolio, pipeline, other
- **Interaction Type:** note, call, meeting, email, update
- **Note Target Type:** task, company, project, reading_item, calendar_event
- **Email Intent (AI):** intro_first_touch, pipeline_follow_up, portfolio_update, intro_request, scheduling, personal_todo, fyi_informational
- **Suggestion Type (AI):** LINK_COMPANY, CREATE_PIPELINE_COMPANY, CREATE_FOLLOW_UP_TASK, CREATE_PERSONAL_TASK, CREATE_INTRO_TASK, SET_STATUS, EXTRACT_UPDATE_HIGHLIGHTS, **CREATE_WAITING_ON**
- **Work Item Source Type:** email, task, calendar_event, note, reading, **commitment**
- **Work Item Status:** needs_review, enriched_pending, trusted, snoozed, ignored
- **Inbox Activity Action Type:** task_created, commitment_created, company_linked, resolved, archived, snoozed, suggestion_acted, suggestion_dismissed

### 2.3 Edge Functions

| Function | Purpose |
|----------|---------|
| `email-inbox-ingest` | Receives forwarded emails, parses, cleans, stores as inbox_items |
| `inbox-suggest-v2` | AI-powered intent classification and structured action suggestions (now includes CREATE_WAITING_ON) |
| `inbox-suggest` | Legacy v1 suggestions (still present) |
| `focus-enrich` | AI enrichment for work items (one-liners, summaries) |
| `reading-enrich` | AI enrichment for reading items (summaries, topics, entities) |
| `calendar-followup-processor` | Processes calendar events for follow-up detection |
| `fetch-link-metadata` | URL metadata extraction for reading list |
| `fetch-company-logo` | Logo fetching for companies |
| `harmonic-enrich-company` | Pipeline company enrichment via Harmonic API |
| `microsoft-auth` | Outlook OAuth flow |
| `sync-outlook-calendar` | Calendar event synchronization |
| `prompt_builder_generate` | AI prompt generation |
| `prompt_builder_followups` | Prompt follow-up suggestions |

### 2.4 Pages / Routes

| Route | Surface | Role |
|-------|---------|------|
| `/dashboard` | Main dashboard | Priority items, inbox panel, tasks, obligations (at-risk), companies, commitments, reading list |
| `/inbox` | Email inbox | Primary intake surface, triage, suggestions, commitment creation |
| `/focus` | Focus Queue | Unified triage across all object types including commitments |
| `/obligations` | Obligations page | Dedicated bidirectional commitment management with filtering |
| `/tasks` | Task management | Full task list with filtering |
| `/projects` | Project list | Project organization |
| `/projects/:id` | Project detail | Tasks, notes, assets for a project |
| `/pipeline` | Pipeline board | Deal tracking |
| `/pipeline/:companyId` | Pipeline company detail | Company detail, contacts, interactions, notes |
| `/portfolio` | Portfolio companies | Portfolio company management |
| `/portfolio/:companyId` | Portfolio company detail | Company detail with timeline |
| `/reading-list` | Reading list | Saved URLs with enrichment |
| `/notes` | All notes | Note browsing with filtering |
| `/prompts` | Prompt library | Saved prompts |
| `/prompt-builder` | Prompt builder | AI-assisted prompt generation |
| `/settings` | Settings | User and connection settings |

### 2.5 What Materially Improved Since v2

1. **Commitments are integrated into the workflow.** Open commitments create work items via backfill, receive direction-aware priority scoring, and appear in the Focus Queue with a dedicated FocusCommitmentDrawer.

2. **Bidirectional tracking.** The `direction` field distinguishes "I owe this" from "someone owes me this." Scoring, badges, date semantics, and triage actions all adapt to direction.

3. **Commitment-specific triage in Focus Queue.** 8 state-aware actions (Complete, Note, Snooze, Delegate, Waiting On, Follow Up, Broken, Cancel) with visibility rules based on direction and status.

4. **Counterparty context.** When triaging a commitment in Focus Queue, the user sees the person's details, VIP status, company, and recent commitment history — enabling informed decisions.

5. **Dashboard surfaces at-risk obligations.** Overdue, stale, high-urgency, and due-today commitments appear in a dedicated panel at the top of the dashboard.

6. **Inbox → commitment path.** `CREATE_WAITING_ON` AI suggestion type enables commitment creation from email. The CommitmentForm supports direction, title, expected_by, and "also create task" toggle.

7. **Inbox activity logging.** Actions taken on inbox items are recorded, providing the resolution audit trail that was missing.

8. **Stale detection.** `mark_stale_commitments` RPC auto-flags overdue commitments based on implied_urgency thresholds.

---

## 3. Inbox & Intake Evaluation

### 3.1 Does Inbox reliably capture everything that matters?

**Partially.** Inbox captures forwarded emails well. But:

- **Only email.** Slack messages, WhatsApp, text threads, verbal commitments, and in-person meeting takeaways do not flow into the inbox.
- **No auto-forward.** The user must actively forward emails to the ingestion endpoint.
- **No sent-mail tracking.** When the user sends a reply making a commitment, Casper has no visibility. This remains the single largest capture gap.

### 3.2 Are suggested actions typed, correct, and executable?

**Yes, improved from v2.** The V2 suggestion system now includes 8 action types:

- LINK_COMPANY, CREATE_PIPELINE_COMPANY, CREATE_FOLLOW_UP_TASK, CREATE_PERSONAL_TASK, CREATE_INTRO_TASK, SET_STATUS, EXTRACT_UPDATE_HIGHLIGHTS, **CREATE_WAITING_ON**

The new CREATE_WAITING_ON type enables tracking obligations owed to the user (e.g., "founder promised to send the data room link by Friday").

**Remaining gaps:**
- "Add note" from inbox is still a toast placeholder
- EXTRACT_UPDATE_HIGHLIGHTS execution path for saving structured highlights is unclear
- No suggestion type for "reply needed" or "schedule meeting"

### 3.3 Is context preserved when actions are taken?

**Mostly yes, improved from v2.**

- **Email → Task:** Tasks carry `source_inbox_item_id`. Solid.
- **Email → Company link:** Direct FK with company metadata. Solid.
- **Email → Pipeline company:** Extracted metadata preserved. Solid.
- **Email → Commitment:** Now functional via CREATE_WAITING_ON. Person name, expected date, and context are extracted by AI and passed to the commitment form.
- **Email → Note:** Still not functional.
- **Action audit trail:** Inbox activity logging now records what action was taken on each item.

### 3.4 Can the user confidently clear Inbox knowing the work has been converted?

**Improving.** The user can now:
- Mark as complete (sets `is_resolved`)
- Archive (sets `is_deleted`)
- Snooze (sets `snoozed_until`)
- Create a task from a suggestion
- **Create a commitment from a suggestion (new)**
- **Actions are logged in `inbox_activity` (new)**

The activity log means the user can later verify what was done with an email. The remaining gap is that replies sent in Outlook are still invisible — the user has no way to record "I replied to this" without manual action.

---

## 4. Action & Execution Evaluation

### 4.1 How well does Casper distinguish linking, noting, tasking, committing, and status updates?

**The type system is comprehensive; execution is mostly complete.**

- **Linking (LINK_COMPANY):** Works well. Domain matching + manual linking.
- **Tasking (CREATE_*_TASK):** Creates tasks with proper metadata and source linking.
- **Committing:** Now functional. Direction-aware creation from inbox or manual. Commitments carry person, company, source, urgency, and date context.
- **Noting:** Notes are first-class with polymorphic links. Floating note overlay works. Commitment triage "Add Note" action opens the floating note with commitment context pre-filled.
- **Status updates (SET_STATUS):** Exists but execution path for pipeline company status updates from inbox is still unclear.

### 4.2 Are commitments tracked end-to-end?

**Yes, for commitments the system knows about.**

The lifecycle is:
1. **Creation:** Manual, from inbox suggestion (CREATE_WAITING_ON), or from interaction
2. **Backfill:** Open commitments automatically create work items
3. **Enrichment:** Company linking, direction validation, reason code assignment
4. **Scoring:** Direction-aware urgency (date proximity) and importance (direction + VIP + urgency)
5. **Triage:** 8-action triage bar in Focus Queue with state-aware visibility
6. **Resolution:** Complete, delegate, break, or cancel — sets `resolved_at` and marks work item as trusted
7. **Escalation:** `mark_stale_commitments` auto-flags overdue items based on urgency thresholds
8. **Dashboard:** At-risk items surface in the ObligationsPanel

The gap is creation — the system only tracks commitments that are explicitly created. Outbound email commitments and verbal commitments are invisible unless the user manually enters them.

### 4.3 Missing action types

| Action | Status | Impact |
|--------|--------|--------|
| ~~Create commitment~~ | **Implemented** — manual + inbox suggestion | ~~High~~ Resolved |
| ~~Waiting-on tracking~~ | **Implemented** — `waiting_on` status + `owed_to_me` direction | ~~High~~ Resolved |
| **Mark as replied** | Not implemented | Medium — can't track what was already handled in email |
| **Schedule follow-up** | Partially via task with due date | Medium — no true follow-up with auto-resurface |
| **Delegate task** | Commitment delegation exists, task delegation does not | Medium |
| **Create reminder (without task)** | Snooze is the closest analog | Low |

---

## 5. Prioritization & Confidence Analysis

### 5.1 Can the system answer "What's the most important thing right now?"

**Partially — significantly improved from v2.**

**What it now has:**
- A unified queue of work items across **6 source types** (email, task, calendar, note, reading, **commitment**)
- Priority scoring: `0.6 * urgency + 0.4 * importance`
- **Commitment-specific urgency scoring** based on direction, date proximity, and implied_urgency multiplier (high=1.2, medium=1.0, low=0.8)
- **Commitment-specific importance scoring** with direction-aware base scores (owed_by_me=0.7, owed_to_me=0.5), VIP boost (+0.15), and urgency boost
- **Person/VIP signal** integrated into commitment scoring
- Reason codes + auto-resolution
- Dashboard at-risk panel for overdue/urgent obligations

**What it still lacks:**
- **No effort estimation.** Can't filter by "what can I do in 15 minutes?"
- **No person weight on non-commitment items.** An email from a portfolio CEO and a newsletter still score similarly (VIP signal only flows through commitments, not emails directly).
- **No decay/escalation for non-commitments.** Items snoozed 3 times don't escalate (commitments do escalate via `mark_stale_commitments`, but other types don't).
- **No pipeline company signal.** `is_top_of_mind` pipeline companies don't enter Focus Queue.

### 5.2 Can the system answer "What can I do in the next 15-30 minutes?"

**No.** There is no effort-aware filtering. The `effort_bucket` concept exists on suggestions but doesn't propagate to work items or Focus Queue items.

### 5.3 Where does the user still rely on memory?

1. **Outbound commitments.** "I told the founder I'd make an intro by Friday" — still invisible unless manually created.
2. ~~Pending replies / waiting-on.~~ **Resolved** — waiting_on status + owed_to_me direction now track this.
3. **Cross-day continuity.** No "here's what carried over from last week" briefing.
4. **Slack/WhatsApp threads.** Non-email channels are invisible.
5. **Meeting takeaways.** Post-meeting actions are still manual.

---

## 6. Remaining Failure Modes

### 6.1 Capture Failures

| Failure Mode | Severity | Description |
|-------------|----------|-------------|
| Outbound email obligations invisible | **Critical** | User makes commitments via email replies — Casper never sees them |
| Non-email channels bypass system | High | Slack, WhatsApp, text, verbal commitments are untracked |
| Emails not forwarded are lost | High | User handles email in Outlook, forgets to forward |
| Meeting outcomes not captured | Medium | Calendar events exist but post-meeting actions are manual |

### 6.2 Context Failures

| Failure Mode | Severity | Description |
|-------------|----------|-------------|
| ~~Commitments disconnected from workflow~~ | ~~High~~ **Resolved** | Commitments now flow through Focus Queue, Dashboard, and /obligations |
| ~~No resolution audit trail~~ | ~~High~~ **Resolved** | `inbox_activity` table logs actions taken on inbox items |
| Cross-object timeline gaps | Medium | Company timelines show interactions but may miss inbox-linked activity |
| Note-to-source links not visible from source | Medium | Can see notes linked to a company, but can't easily see notes linked to an inbox item |

### 6.3 Continuity Failures

| Failure Mode | Severity | Description |
|-------------|----------|-------------|
| No "start of day" briefing | High | User must manually check multiple surfaces to understand state |
| Snooze fragmentation | Medium | Snoozed items across types are independent — no unified view |
| No follow-up chains | Medium | Creating a follow-up task doesn't link it to the prior interaction |
| ~~Stale items don't escalate~~ | ~~Medium~~ **Partially resolved** | `mark_stale_commitments` handles commitment escalation; other types still don't escalate |

### 6.4 Orchestration Failures

| Failure Mode | Severity | Description |
|-------------|----------|-------------|
| ~~Dashboard doesn't reflect obligations~~ | ~~High~~ **Resolved** | ObligationsPanel shows at-risk items at top of dashboard |
| ~~Commitments not in priority scoring~~ | ~~High~~ **Resolved** | Direction-aware urgency + importance scoring integrated |
| No daily planning surface | Medium | No "plan my day" flow combining calendar, tasks, commitments, inbox |
| Pipeline items don't surface proactively | Medium | `is_top_of_mind` exists but pipeline companies don't enter Focus Queue |
| No background processing | Medium | Backfill runs on page load only — no push-based processing |

---

## 7. Readiness Assessment

### 7.1 Before vs After (v1 → v2 → v2.1)

| Dimension | v1 | v2 | v2.1 (Current) | Delta v2→v2.1 |
|-----------|----|----|----------------|---------------|
| **Inbox Ingestion** | Manual task creation | AI intent + typed suggestions | + CREATE_WAITING_ON + activity logging | Incremental |
| **Company Linking** | Manual only | Deterministic domain matching + AI | Unchanged | — |
| **Context Preservation** | No source tracking | Task→inbox links, entity_links | + inbox activity audit trail | Incremental |
| **Unified Triage** | None | Focus Queue (5 source types) | Focus Queue (6 source types, commitment triage) | Significant |
| **Notes** | Project-scoped | Polymorphic links, floating note | + Commitment triage note action | Minor |
| **Commitments** | Did not exist | Schema only (disconnected) | **Full integration** — bidirectional, scored, triaged, dashboarded | **Major** |
| **People** | Contacts only | VIP, relationship tiers | VIP signal used in commitment scoring | Incremental |
| **Priority Scoring** | None | V1 (urgency × importance) | + Commitment-specific scoring (direction, VIP, urgency multiplier) | Significant |
| **Dashboard** | Tasks + reading | Tasks + reading + calendar | + At-risk obligations panel | Significant |

### 7.2 Qualitative Readiness Scores

| Dimension | v2 Score | v2.1 Score | Assessment |
|-----------|----------|------------|------------|
| **Capture** | 5/10 | **5/10** | Unchanged — email capture is solid, outbound + non-email still missing |
| **Context Preservation** | 6/10 | **7/10** | Activity logging adds audit trail. Commitment context flows through triage. |
| **Actionability** | 6/10 | **8/10** | Commitments are now fully actionable. 8-action triage bar. Inbox→commitment path works. |
| **Trust / Peace of Mind** | 3/10 | **6/10** | User can now see at-risk obligations from Dashboard and Focus Queue. Stale detection provides safety net. Still missing outbound tracking and daily briefing. |
| **Scalability** | 5/10 | **5/10** | Unchanged — backfill still runs on page load, no background processing |

### 7.3 Execution Readiness for Next Layer

The system is **ready** for:
- Effort estimation on Focus Queue items
- Start-of-day briefing (obligation data is now trustworthy)
- Person-weighted scoring on emails (VIP infrastructure exists, needs extension beyond commitments)
- Pipeline company Focus Queue integration
- Unified snooze surface

The system is **not yet ready** for:
- Outbound tracking (requires architectural decision on email access model — Graph API read scope vs. sent-mail hook)
- Automated commitment extraction from calendar events (needs meeting transcript/notes pipeline)

---

## 8. Sequenced Recommendations

### P0 — Previously Blocking, Now Resolved

These items from the v2 audit have been implemented:

1. ~~Wire commitments into Focus Queue and Dashboard~~ — **Done.** Commitments backfill as work items, receive direction-aware priority scoring, and appear in Focus Queue with 8-action triage. Dashboard shows at-risk obligations.

2. ~~Add "resolved via" tracking on inbox items~~ — **Done.** `inbox_activity` table logs actions with type, target, and metadata.

3. ~~Create inbox → commitment path~~ — **Done.** CREATE_WAITING_ON suggestion type + CommitmentForm with direction, title, expected_by fields.

### P0 — Current Blockers to Peace of Mind

**1. Effort estimation on Focus Queue items**

The user's primary workflow involves fragmented time windows (between meetings, waiting for calls). Without effort estimation, the Focus Queue shows a priority-ranked list but can't answer "what can I knock out in the next 10 minutes?" The `effort_bucket` concept exists on suggestions — propagate it to work items. Heuristic defaults: email reply = quick, task without subtasks = quick/medium, commitment follow-up = quick, pipeline follow-up = medium.

Concretely:
- Add `effort_estimate` column to `work_items` (enum: quick/medium/long)
- Populate during enrichment: inherit from suggestion `effort_bucket` if available, else heuristic by source type
- Add effort filter toggle to Focus Queue UI (show all / quick only / medium+quick)

**2. Person-weighted scoring for emails**

VIP signal currently only affects commitment importance scoring. Extend it to emails: when an inbox item's sender matches a VIP person, boost the importance score. The `people` table with `is_vip` and `relationship_tier` is ready — this is a scoring function change, not a data model change.

Concretely:
- In `computeEmailImportanceScore`, look up sender email against `people` table
- VIP: +0.2 importance boost
- Tier 1 (inner circle): +0.15, Tier 2: +0.1, Tier 3: +0.05

### P1 — Meaningfully Compounding

**3. Start-of-day briefing**

The underlying data is now trustworthy enough to generate a morning summary. Show: (a) commitments due today/overdue, (b) snoozed items returning today, (c) calendar events with obligations attached, (d) inbox items still pending triage. This can be a Dashboard section or a modal on first login.

**4. Pipeline companies in Focus Queue**

Pipeline companies with `is_top_of_mind` or recent interactions should create work items. When a pipeline company hasn't been touched in N days (based on stage), it should surface for review. This extends the Focus Queue to cover deal tracking — currently the only major domain that doesn't participate.

Concretely:
- Add `pipeline_company` as a `WorkItemSourceType`
- Backfill: top-of-mind companies + companies with stale last_interaction
- Enrichment: link to pipeline contacts, compute staleness
- Scoring: urgency from days-since-last-interaction relative to stage velocity

**5. Unified snooze surface**

Snoozed items across inbox, tasks, commitments, and work items are independent. A "returning today" widget on Dashboard — or a filter in Focus Queue — would prevent snoozed items from silently resurfacing and being missed.

### P2 — Nice but Deferrable

**6. Escalation for non-commitment items**

`mark_stale_commitments` handles commitment escalation. Extend the pattern: items snoozed 3+ times should gain an escalation badge. Tasks overdue by 2x their original estimate should surface. Emails older than 7 days with no action should flag.

**7. Follow-up chains**

When a commitment is marked "waiting on" or a follow-up task is created, link it to the original interaction. Enable a "follow-up history" view that shows the chain: email received → commitment created → follow-up sent → response received.

**8. Outbound email visibility**

This is architecturally significant and should be designed carefully. Options:
- **Microsoft Graph API read scope on sent mail** — requires additional OAuth permissions, but enables automatic detection of outbound commitments
- **Manual "I replied" action in inbox** — low-friction, no new permissions, but relies on user discipline
- **BCC-to-Casper** — user BCCs the ingestion endpoint when sending important emails

Recommendation: Start with the manual "I replied" action (adds a `replied_at` timestamp and optional note to inbox_activity). Evaluate Graph API read scope as a P1 in the next cycle based on user discipline findings.

---

## Appendix: Object Relationship Diagram (Textual)

```
                    ┌─────────────┐
                    │   People    │
                    │  (is_vip,   │
                    │  rel_tier)  │
                    └──────┬──────┘
                           │ person_company_roles
                           ▼
┌──────────┐     ┌─────────────────┐     ┌──────────────────┐
│  Inbox   │────▶│   Companies     │◀────│ Pipeline Companies│
│  Items   │     │ (portfolio)     │     │                  │
└────┬─────┘     └────────┬────────┘     └────────┬─────────┘
     │                    │                       │
     │ source_inbox_      │ company_id            │ pipeline_company_id
     │ item_id            │                       │
     ▼                    ▼                       ▼
┌──────────┐     ┌─────────────────┐     ┌──────────────────┐
│  Tasks   │────▶│   Projects      │     │ Pipeline Notes   │
│          │     │                 │     │ Pipeline Contacts│
└────┬─────┘     └────────┬────────┘     │ Pipeline Attach. │
     │                    │              └──────────────────┘
     │                    │
     ▼                    ▼
┌──────────────────────────────┐
│      Notes (project_notes)   │
│  + note_links (polymorphic)  │
│  targets: task, company,     │
│  project, reading, calendar  │
└──────────────────────────────┘

┌──────────┐     ┌─────────────────┐
│  Work    │────▶│  Entity Links   │
│  Items   │     │  (polymorphic)  │
│(meta-triage)   │                 │
└────┬─────┘     └─────────────────┘
     │
     │ source_type + source_id
     ▼
  email | task | calendar_event | note | reading | commitment
                                                       │
                                                       ▼
                                              ┌──────────────────┐
                                              │  Commitments     │
                                              │  (bidirectional,  │
                                              │   scored, triaged,│
                                              │   dashboarded)   │
                                              └──────────────────┘

┌──────────────────┐
│  Inbox Activity  │
│  (audit trail)   │
│  action_type,    │
│  target_id/type  │
└──────────────────┘
```

---

*This audit reflects the system state after Obligations Engine v1 implementation. The P0 recommendations address the next highest-impact gaps: effort-aware triage and person-weighted scoring — both of which build on the infrastructure now in place.*
