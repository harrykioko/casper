# Casper System Audit v2

**Date:** February 2026
**Scope:** Full system evaluation against the Casper north star
**Audience:** Product owner / sole operator

---

## 1. Executive Summary

Casper has evolved materially since v1. The system now has a real data backbone: inbox items ingest from email, AI-generated suggestions are typed and actionable, context linking (email ↔ company) works, and a Focus Queue attempts to unify all loose ends into a single triage surface. Notes are polymorphically linked. Commitments exist as a first-class schema object. The entity model is no longer skeletal.

**What's working:**
- Inbox ingestion captures forwarded emails with cleaned content, forwarding detection, thread/disclaimer stripping, and attachment support.
- AI suggestions (v2) are intent-typed (intro, pipeline follow-up, portfolio update, etc.) and produce structured, executable actions (link company, create pipeline entry, create follow-up task, extract highlights).
- Company linking from inbox is functional — domain matching runs deterministically, and manual linking is smooth.
- Focus Queue (`/focus`) provides a unified triage surface spanning emails, tasks, calendar events, notes, and reading items, with priority scoring and auto-resolution of fully-linked items.
- Commitments table has a rich schema (delegation, snooze tracking, implied urgency, source linking).
- Notes are polymorphically linked via `note_links` to tasks, companies, projects, reading items, and calendar events.

**What's not working yet:**
- The system still cannot reliably answer "what's the most important thing right now?" The priority scoring is v1 (urgency × importance only), with no commitment weight, no person/relationship signal, and no effort estimation.
- Commitments exist in the database but have no visible integration into Inbox triage, Focus Queue, or Dashboard. They are a disconnected object.
- The Dashboard does not reflect the Focus Queue, commitments, or overdue items. It shows tasks, reading list, and calendar — a v1 surface.
- There is no "waiting-on" tracking. When the user sends a reply or delegates, there is no mechanism to track that a response is expected.
- Snooze exists on inbox items, tasks, and commitments independently — but there is no unified "snoozed items" view or resurface mechanism that crosses object types.
- The system still relies on the user opening the Focus Queue page to trigger backfill. There is no background processing or push-based notification of items needing attention.

**Net assessment:** Casper has crossed the threshold from "organized bookmark list" to "intake + triage system." The foundations for context preservation are solid. But the system does not yet deliver on the core promise — **confidence that nothing is slipping** — because commitments, follow-ups, and waiting-on states are structurally disconnected from the surfaces the user actually looks at.

---

## 2. System Map (Current State)

### 2.1 First-Class Objects

| Object | Table | Created By | Links To | Resolved By | Participates in Prioritization |
|--------|-------|-----------|----------|-------------|-------------------------------|
| **Inbox Item** | `inbox_items` | Email ingestion (edge function `email-inbox-ingest`) | Company (direct FK), Tasks (via `source_inbox_item_id`), Suggestions, Attachments, Work Items | `is_resolved`, `is_deleted` (archive) | Yes — Focus Queue via `work_items` |
| **Task** | `tasks` | Manual, from inbox suggestion, from Focus triage | Project, Category, Company (portfolio), Pipeline Company, Source Inbox Item | `completed`, `archived_at` | Yes — Focus Queue, priority scoring |
| **Project** | `projects` | Manual | Tasks, Notes, Assets, Prompts, Reading Items, Nonnegotiables | `status` field (no formal lifecycle) | No |
| **Company (Portfolio)** | `companies` | Manual | Contacts, Interactions, Tasks, Calendar Links, Inbox Items, People, Commitments | `status` enum (active/watching/exited/archived) | No |
| **Pipeline Company** | `pipeline_companies` | Manual, from inbox suggestion | Contacts, Interactions, Notes, Attachments, Enrichments, Tasks | `status` string | No |
| **Commitment** | `commitments` | Manual, from interaction | Person, Company, Source (call/email/meeting) | `status` enum (completed/broken/delegated/cancelled) | **No** — not in Focus Queue |
| **Person** | `people` | Manual | Company roles, Interactions, Commitments | N/A (reference entity) | No |
| **Note** | `project_notes` + `note_links` | Manual, floating note (Cmd+Shift+N) | Any target via `note_links` (task, company, project, reading_item, calendar_event) | N/A (persistent) | Only if orphaned (Focus Queue backfill) |
| **Calendar Event** | `calendar_events` | Outlook sync | Company links, Link suggestions, Work Items | N/A (time-bound) | Yes — Focus Queue |
| **Reading Item** | `reading_items` | Manual (URL paste) | Project, Topics, Entities | `is_read`, `is_archived` | Yes — Focus Queue (if unprocessed) |
| **Inbox Suggestion** | `inbox_suggestions` | AI (edge function `inbox-suggest-v2`) | Inbox Item (1:1) | Dismissed or acted upon | Indirectly (drives inbox actions) |
| **Work Item** | `work_items` | Backfill (`useBackfillWorkItems`) + `ensureWorkItem` | Source (polymorphic: email, task, calendar_event, note, reading), Entity Links | `status` (trusted/ignored) | **Yes** — this IS the prioritization layer |
| **Entity Link** | `entity_links` | Deterministic enrichment, manual linking | Source ↔ Target (polymorphic) | N/A (graph edge) | Indirectly (resolves reason codes) |
| **Inbox Attachment** | `inbox_attachments` | Email ingestion | Inbox Item | N/A | No |
| **Item Extract** | `item_extracts` | AI enrichment (`focus-enrich`) | Source (polymorphic) | N/A (metadata) | Indirectly (provides one-liners) |

### 2.2 Key Enums

- **Commitment Status:** open, completed, broken, delegated, cancelled
- **Commitment Source:** call, email, meeting, message, manual
- **Company Kind:** portfolio, pipeline, other
- **Interaction Type:** note, call, meeting, email, update
- **Note Target Type:** task, company, project, reading_item, calendar_event
- **Email Intent (AI):** intro_first_touch, pipeline_follow_up, portfolio_update, intro_request, scheduling, personal_todo, fyi_informational
- **Suggestion Type (AI):** LINK_COMPANY, CREATE_PIPELINE_COMPANY, CREATE_FOLLOW_UP_TASK, CREATE_PERSONAL_TASK, CREATE_INTRO_TASK, SET_STATUS, EXTRACT_UPDATE_HIGHLIGHTS
- **Work Item Status:** needs_review, enriched_pending, trusted, snoozed, ignored

### 2.3 Edge Functions

| Function | Purpose |
|----------|---------|
| `email-inbox-ingest` | Receives forwarded emails, parses, cleans, stores as inbox_items |
| `inbox-suggest-v2` | AI-powered intent classification and structured action suggestions |
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
| `/dashboard` | Main dashboard | Tasks, reading list, calendar sidebar, nonnegotiables |
| `/inbox` | Email inbox | Primary intake surface, triage, suggestions |
| `/focus` | Focus Queue | Unified triage across all object types |
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

### 2.5 What Materially Improved Since v1

1. **Inbox ingestion is real.** Emails flow in via `email-inbox-ingest`, with content cleaning (thread stripping, disclaimer removal, forwarding detection), and the system distinguishes the original sender from the forwarder.

2. **AI suggestions are typed and actionable.** V2 suggestions classify email intent (7 types) and produce structured actions (7 types) with confidence scores, effort estimates, and rationale. This is a genuine step beyond "create a task from this."

3. **Company linking works end-to-end.** Domain matching runs deterministically on ingestion. Manual linking is available. Links propagate to work items and auto-resolve Focus Queue items.

4. **Focus Queue exists as a unified triage surface.** `work_items` table acts as a meta-layer that wraps emails, tasks, calendar events, notes, and reading items into a single prioritized queue with reason codes, priority scoring, and entity linking.

5. **Notes are polymorphically linked.** The `note_links` table enables a note to be linked to any entity type, and the floating note (Cmd+Shift+N) provides quick capture.

6. **Commitments schema is comprehensive.** The `commitments` table includes delegation, snooze tracking, implied urgency, source linking, and person/company associations. Views exist for open and overdue commitments.

7. **Attachment support.** Inbox attachments are stored, viewable, and can be copied to pipeline companies.

8. **People as first-class objects.** The `people` table with `person_company_roles` provides a proper contact graph with VIP flagging and relationship tiers.

---

## 3. Inbox & Intake Evaluation

### 3.1 Does Inbox reliably capture everything that matters?

**Partially.** Inbox captures forwarded emails well — the ingestion pipeline handles parsing, cleaning, and metadata extraction. But:

- **Only email.** Slack messages, WhatsApp, text threads, verbal commitments, and in-person meeting takeaways do not flow into the inbox. The user must manually create tasks or notes for these.
- **No auto-forward.** The user must actively forward emails to the ingestion endpoint. Emails that the user reads and acts on in Outlook but forgets to forward are invisible to Casper.
- **No sent-mail tracking.** When the user sends a reply making a commitment or asking for something, Casper has no visibility into it. This is the single largest gap — outbound obligations are completely untracked.

### 3.2 Are suggested actions typed, correct, and executable?

**Yes, this is meaningfully improved.** The V2 suggestion system:

- Classifies intent into 7 VC-relevant categories (intro, pipeline follow-up, portfolio update, etc.)
- Produces typed actions: LINK_COMPANY, CREATE_PIPELINE_COMPANY, CREATE_FOLLOW_UP_TASK, CREATE_PERSONAL_TASK, CREATE_INTRO_TASK, SET_STATUS, EXTRACT_UPDATE_HIGHLIGHTS
- Includes confidence scores, effort estimates, and rationale
- Auto-generates on first open if no cached suggestions exist
- Supports dismissal (persisted to DB)

**Remaining gaps:**
- "Add note" from inbox is still a toast placeholder (`toast.info("Add note feature coming soon")` — `Inbox.tsx:57`)
- CREATE_INTRO_TASK and CREATE_FOLLOW_UP_TASK create generic tasks — they don't create commitments, even though these are definitionally commitments
- EXTRACT_UPDATE_HIGHLIGHTS exists as a suggestion type but the execution path for saving highlights as structured notes against a company is unclear
- No suggestion type for "reply needed" or "schedule meeting" — two of the most common email responses

### 3.3 Is context preserved when actions are taken?

**Mostly yes, with gaps.**

- **Email → Task:** Tasks created from inbox suggestions carry `source_inbox_item_id`, preserving the link back to the email. Company context is passed through.
- **Email → Company link:** Direct FK on `inbox_items.related_company_id` with company name, type, and logo. Solid.
- **Email → Pipeline company:** CREATE_PIPELINE_COMPANY suggestion includes extracted metadata (company name, domain, contact, description). Context is well-preserved.
- **Email → Note:** Not yet functional. When it works, the polymorphic `note_links` system should preserve the inbox item link.
- **Email → Commitment:** No path exists. This is a structural gap.

### 3.4 Can the user confidently clear Inbox knowing the work has been converted?

**Not yet.** The user can:
- Mark as complete (sets `is_resolved`)
- Archive (sets `is_deleted`)
- Snooze (sets `snoozed_until`)
- Create a task from a suggestion

But there is no "I've handled this, here's what I did" flow. The user marks complete and the email disappears. There's no record of what action was taken — no activity log, no "resolved via task X" annotation. This means:

- If the user archives an email after creating a task, there's a `source_inbox_item_id` link, but nothing on the inbox item itself records that a task was created.
- If the user replies in Outlook and then archives in Casper, there's no record that a reply was sent.
- The mental model is still "process and forget" rather than "process and track."

---

## 4. Action & Execution Evaluation

### 4.1 How well does Casper distinguish linking, noting, tasking, and status updates?

**The type system is there; the execution is uneven.**

- **Linking (LINK_COMPANY):** Works well. Domain matching is deterministic. Manual linking via modal is functional. Links propagate to work items.
- **Tasking (CREATE_*_TASK):** Creates tasks with proper metadata. Tasks link to projects, companies, and pipeline companies. Task completion triggers `completed_at` timestamps.
- **Noting:** Notes are first-class with polymorphic links. The floating note overlay (Cmd+Shift+N) provides quick capture with optional target context. However, notes from inbox are not yet wired up.
- **Status updates (SET_STATUS):** Exists as a suggestion type but the execution path for updating pipeline company status from an inbox action is not clearly implemented.

### 4.2 Are tasks only created when they should be?

**Mostly.** The V2 suggestion system is better at distinguishing FYI emails from actionable ones. The intent classification helps — `fyi_informational` intent doesn't generate task suggestions. However:

- There is no mechanism to distinguish "I need to do something" from "I need to track that someone else does something." Both become tasks.
- Quick tasks (`is_quick_task`) exist as a concept but are underused — they're essentially inbox-captured tasks without project or priority assignment.

### 4.3 Are notes/highlights first-class?

**Structurally yes, practically incomplete.**

The `project_notes` + `note_links` system is well-designed:
- Notes have title, content, note_type, and polymorphic links
- Notes can link to multiple targets (primary + secondary contexts)
- A dedicated `/notes` page exists with search and filtering
- Floating note overlay provides quick capture from anywhere

But:
- Notes from inbox suggestions (EXTRACT_UPDATE_HIGHLIGHTS) are not implemented end-to-end
- No quick highlight-and-save from email body
- No structured note templates (meeting notes, portfolio update summaries)
- Notes don't surface in company timelines or task detail views consistently

### 4.4 Missing action types

| Action | Status | Impact |
|--------|--------|--------|
| **Create commitment** | Schema exists, no inbox integration | High — commitments are the primary slip-through vector |
| **Waiting-on / expecting reply** | Not implemented | High — no way to track outbound obligations |
| **Schedule follow-up** | Partially via task with due date | Medium — no true follow-up with auto-resurface |
| **Delegate** | Commitment delegation exists, task delegation does not | Medium |
| **Mark as replied** | Not implemented | Medium — can't track what was already handled in email |
| **Create reminder (without task)** | Snooze is the closest analog | Low |

---

## 5. Prioritization & Confidence Analysis

### 5.1 Can the system answer "What's the most important thing right now?"

**No.** The Focus Queue attempts this but falls short:

**What it has:**
- A unified queue of work items across 5 source types
- Priority scoring: `0.6 * urgency + 0.4 * importance`
- Urgency based on time proximity (email age, task due date, calendar start time)
- Importance based on explicit priority (high/medium/low) and read status
- Reason codes for why items need review (unlinked_company, missing_summary, unprocessed)
- Auto-resolution when all reason codes clear

**What it lacks:**
- **No commitment signal.** Open commitments with approaching deadlines don't appear in Focus Queue.
- **No person weight.** An email from a portfolio CEO and a newsletter both score on the same axis.
- **No relationship context.** The system has `people.is_vip` and `people.relationship_tier` but doesn't use them in scoring.
- **No "what can I do in 15 minutes?" filtering.** Effort estimation exists on suggestions (`effort_bucket`: quick/medium/long) but not on the Focus Queue items themselves.
- **No decay/escalation.** Items snoozed 3 times don't escalate. Overdue commitments don't surface. The system is stateless with respect to repeated deferrals.

### 5.2 Can the system answer "What can I do in the next 15–30 minutes?"

**No.** There is no effort-aware filtering. The Focus Queue shows items sorted by priority score but doesn't distinguish between "reply to this email" (2 min) and "write investment memo" (2 hours). The `effort_bucket` field on suggestions is the right seed for this but it stops at the suggestion layer — it doesn't propagate to work items or tasks.

### 5.3 Where does the user still rely on memory?

1. **Outbound commitments.** "I told the founder I'd make an intro by Friday" — nowhere in the system unless manually created as a commitment.
2. **Pending replies.** "I asked the LP for the data room access" — no tracking.
3. **Cross-day continuity.** Opening Casper on Monday morning, there is no "here's what carried over from last week" briefing.
4. **Slack/WhatsApp threads.** Obligations from non-email channels are invisible.
5. **Meeting takeaways.** Post-meeting, the user must manually create tasks/notes. `calendar-followup-processor` exists but its output doesn't clearly flow into the user's workflow.

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
| No resolution audit trail | High | When inbox item is resolved, no record of what action was taken |
| Commitments disconnected from workflow | High | Commitments exist in schema but don't appear in any active surface |
| Cross-object timeline gaps | Medium | Company timelines show interactions but may miss inbox-linked activity |
| Note-to-source links not visible from source | Medium | Can see notes linked to a company, but can't easily see notes linked to an inbox item |

### 6.3 Continuity Failures

| Failure Mode | Severity | Description |
|-------------|----------|-------------|
| No "start of day" briefing | High | User must manually check multiple surfaces to understand state |
| Snooze fragmentation | Medium | Snoozed items on inbox, tasks, commitments, and work items are independent — no unified view |
| No follow-up chains | Medium | Creating a follow-up task doesn't link it to the prior interaction |
| Stale items don't escalate | Medium | `mark_stale_work_items` RPC exists but items don't gain urgency from age alone |

### 6.4 Orchestration Failures

| Failure Mode | Severity | Description |
|-------------|----------|-------------|
| Dashboard doesn't reflect Focus Queue | High | Dashboard shows legacy task/reading surfaces, not the unified priority view |
| Commitments not in priority scoring | High | `commitment_status`, `due_at`, and `implied_urgency` are not inputs to the scoring function |
| No daily planning surface | Medium | No "plan my day" flow that considers calendar, tasks, commitments, and inbox together |
| Pipeline items don't surface proactively | Medium | `is_top_of_mind` flag exists but pipeline companies don't appear in Focus Queue |

---

## 7. Readiness Assessment

### 7.1 Before vs After (v1 → v2)

| Dimension | v1 | v2 | Delta |
|-----------|----|----|-------|
| **Inbox Ingestion** | Manual task creation from email | Automated email parsing with AI intent + typed suggestions | Major improvement |
| **Company Linking** | Manual only | Deterministic domain matching + AI candidate suggestions | Major improvement |
| **Context Preservation** | Tasks had no source tracking | Tasks link to source inbox items; entity_links provide polymorphic graph | Significant improvement |
| **Unified Triage** | None — separate pages for each domain | Focus Queue with work_items meta-layer | New capability |
| **Notes** | Project-scoped only | Polymorphic links, floating note overlay, dedicated /notes page | Significant improvement |
| **Commitments** | Did not exist | Full schema with delegation, snooze, urgency | New capability (schema only) |
| **People** | Company contacts only | Standalone people table with VIP, relationship tiers, company roles | Significant improvement |
| **Priority Scoring** | None | V1 scoring (urgency × importance) with auto-resolution | New capability |
| **Attachments** | None | Inbox attachments with pipeline company copy | New capability |

### 7.2 Qualitative Readiness Scores

| Dimension | Score | Assessment |
|-----------|-------|------------|
| **Capture** | 5/10 | Email capture is solid. Everything else (outbound, non-email, verbal) is missing. |
| **Context Preservation** | 6/10 | Entity links work. Source tracking on tasks works. But resolution audit trail is absent and cross-object navigation is inconsistent. |
| **Actionability** | 6/10 | AI suggestions are good. Executable actions work for linking and tasking. But commitments, notes-from-inbox, and status updates are incomplete. |
| **Trust / Peace of Mind** | 3/10 | The user cannot look at one surface and know nothing is slipping. Commitments are invisible in active workflows. No outbound tracking. Dashboard is stale. |
| **Scalability** | 5/10 | The data model scales well. The backfill approach (run on page load) does not. Priority scoring is simplistic. No background processing. |

### 7.3 Execution Readiness for Next Layer

The system is **ready** for:
- Wiring commitments into Focus Queue and Dashboard
- Building a "resolved via" audit trail on inbox items
- Unified snooze surface
- Dashboard refresh to reflect Focus Queue state

The system is **not yet ready** for:
- Daily planning / agenda generation (needs commitment integration first)
- Next-best-action orchestration (needs effort estimation and person-weighted scoring)
- Outbound tracking (requires architectural decision on email access model)

---

## 8. Sequenced Recommendations

### P0 — Blocking Peace of Mind

**1. Wire commitments into Focus Queue and Dashboard**

The `commitments` table has the right schema but zero integration into the surfaces the user actually uses. Open commitments with `due_at` approaching should appear in Focus Queue. Overdue commitments should surface prominently. The `open_commitments_detailed` and `overdue_commitments` views already exist — use them.

Concretely:
- Add `commitment` as a `WorkItemSourceType`
- Create work items for open commitments during backfill
- Include commitment urgency (based on `due_at` and `implied_urgency`) in priority scoring
- Show commitment count on Dashboard

**2. Add "resolved via" tracking on inbox items**

When the user takes an action on an inbox item (creates task, links company, marks complete), record what was done. This doesn't need to be complex — a `resolution_action` or `resolution_note` field on `inbox_items`, or an entry in a lightweight `inbox_activity` log.

Without this, archiving an inbox item is an act of faith. The user has no way to verify later that an email was properly handled.

**3. Create inbox → commitment path**

When an AI suggestion identifies a follow-up or intro request, the action should create a commitment, not just a task. The suggestion types `CREATE_FOLLOW_UP_TASK` and `CREATE_INTRO_TASK` are definitionally commitments — they involve a promise to another person. Route these through the commitment system with person and company context preserved.

### P1 — Meaningfully Compounding

**4. Unify the Dashboard around Focus Queue state**

The current Dashboard shows a task list, reading items, and calendar sidebar — all v1 surfaces. Replace the task list section with a Focus Queue summary: items needing attention by type, overdue commitments, and snoozed items returning today. Let the Dashboard answer "what's my situation right now?" instead of "here are all my tasks."

**5. Add effort estimation to Focus Queue items**

The `effort_bucket` concept exists on suggestions. Propagate it to work items or compute it heuristically: emails needing reply = quick, tasks without subtasks = quick/medium, pipeline follow-ups = medium. Enable "show me what I can do in 15 minutes" filtering. This directly serves the user's fragmented-time-window workflow.

### P2 — Nice but Deferrable

**6. Unified snooze surface**

Snoozed items are scattered across `inbox_items.snoozed_until`, `tasks.snoozed_until`, `commitments.snoozed_until`, and `work_items.snooze_until`. A "snoozed items returning today" widget — or even just a count badge — would prevent snoozed items from silently resurfacing and being missed.

**7. Person-weighted priority scoring**

The `people` table has `is_vip` and `relationship_tier`. When an inbox item or commitment involves a VIP person, the importance score should increase. This is a v2 scoring enhancement that would make the Focus Queue meaningfully smarter without requiring new data collection.

**8. Start-of-day briefing**

A lightweight "morning summary" that shows: (a) commitments due today/overdue, (b) snoozed items returning, (c) calendar events with prep needed, (d) inbox items still pending. This can be computed from existing data — it's a read-only aggregation view. Defer until P0 and P1 items are complete so the underlying data is trustworthy.

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
  email | task | calendar_event | note | reading

┌──────────────────┐
│  Commitments     │
│  (disconnected   │
│   from workflow) │
└──────────────────┘
```

---

*This audit is intended to directly inform the next implementation cycle. The P0 recommendations address the most fundamental gap: commitments and resolution tracking are the difference between "I processed my inbox" and "I know nothing is slipping."*
