# Casper System Evaluation & Gap Analysis

**Analysis Date:** January 2026
**Analyst:** Claude (Opus 4.5)
**Version:** 1.0

---

## Executive Summary

**Core Finding:** Casper is architecturally sophisticated but operationally fragmented. The system has evolved as a collection of well-built vertical tools (tasks, pipeline, reading list, prompts) rather than an integrated command center. The priority system—the one component designed to unify everything—is too narrowly scoped (only 3 of 8+ data sources) and lacks the orchestration layer needed to answer the fundamental question: *"What should I do right now?"*

### Why Casper Fails to Deliver Peace of Mind

1. **No single source of truth.** Follow-ups live across tasks (with/without company links), inbox items (snoozable but not actionable), pipeline `next_steps` (free text, not tracked), and calendar (read-only). The user must mentally integrate these.

2. **Prioritization is a leaky bucket.** The unified priority system (`useUnifiedPriorityV1`) only considers tasks, inbox, and calendar. Portfolio companies, pipeline companies, reading list, and nonnegotiables are excluded. Critical signals—like a stale portfolio company with an upcoming board meeting—don't surface.

3. **Context is not cross-linked.** A task like "Follow up with Sarah" doesn't know that Sarah is a founder at Acme (pipeline), that there's an email from her in inbox, and that you have a call scheduled tomorrow. The user is the only integration layer.

4. **No commitment tracking.** Things the user promised (to founders, LPs, colleagues) have no explicit representation. They're implied in tasks or calendar but aren't treated as a priority dimension.

5. **Resolve/snooze are presentation-layer only.** The inbox and priority items can be "resolved" or "snoozed" in the UI, but these actions are often not persisted or don't create follow-up tasks. Items disappear from view without being truly handled.

**Bottom line:** Casper captures information well but fails to operationalize it. The system knows *what* exists but cannot reason about *what matters most* or *what might be slipping*.

---

## Part 1: Current System Map

### Core Objects Inventory

| Object | Problem Solved | Metadata Captured | Links To | User Action Model |
|--------|---------------|-------------------|----------|-------------------|
| **Tasks** | Personal to-dos and company work | Content, priority, status, due date, category | Projects, Categories, Companies (portfolio/pipeline) | Create → Do → Complete |
| **Projects** | Organize related work | Name, description, context, color | Tasks, Prompts, Assets, Reading Items, Nonnegotiables | Contains resources; navigate to |
| **Inbox Items** | Email triage | Subject, sender, snippet, received_at, snoozed_until | Optional company link (denormalized) | Read → Resolve/Snooze/Create Task |
| **Pipeline Companies** | Deal tracking | Name, round, sector, status, raise_amount, next_steps, close_date | Contacts, Interactions, Tasks | Track → Update status → Pass/Invest |
| **Portfolio Companies** | Post-investment relationship | Name, status, website, last_interaction_at | Contacts, Interactions, Tasks | Monitor → Interact → Log |
| **Calendar Events** | Time commitments | Title, start/end, attendees, location | None (read-only sync) | View only; no actions |
| **Reading List** | Save links for later | URL, title, description, image, is_read | Projects | Save → Read → Mark done |
| **Prompts** | AI prompt templates | Title, content, tags | Projects | Create → Use → Iterate |
| **Nonnegotiables** | Recurring habits | Title, frequency, reminder_time, is_active | Projects | Track streaks (implied) |
| **Categories** | Task grouping | Name | Tasks | Classification |
| **Assets** | Project resources | Name, URL, type, notes | Projects | Reference |

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL WORLD                                     │
│  Email (forwarded) │ Outlook Calendar │ URLs │ Deal flow │ Portfolio calls  │
└─────────────────────────────────────────────────────────────────────────────┘
          │                    │              │         │              │
          ▼                    ▼              ▼         ▼              ▼
   ┌──────────────┐    ┌────────────┐   ┌─────────┐ ┌──────────┐ ┌───────────┐
   │ Inbox Items  │    │ Calendar   │   │ Reading │ │ Pipeline │ │ Portfolio │
   │ (email-inbox │    │ Events     │   │ List    │ │Companies │ │ Companies │
   │  -ingest)    │    │ (sync-     │   │ (fetch- │ └──────────┘ └───────────┘
   └──────────────┘    │  outlook)  │   │ -link-  │       │              │
          │            └────────────┘   │  meta)  │       │              │
          │                   │         └─────────┘       │              │
          │                   │              │            │              │
          └───────────────────┴──────────────┴────────────┴──────────────┘
                                       │
                                       ▼
                         ┌──────────────────────────┐
                         │  useUnifiedPriorityV1()  │  ← ONLY CONSUMES 3 SOURCES
                         │  (Tasks + Inbox + Cal)   │
                         └──────────────────────────┘
                                       │
                                       ▼
                              Dashboard Priority Panel
                              (Shows top 8 items)
```

**Critical observation:** The priority system is the command center's brain, but it only sees ~40% of the data that matters to a VC.

### Database Schema Summary

#### Core Tables

| Table | Purpose | Key Fields | Relationships |
|-------|---------|------------|---------------|
| `users` | Authentication & profile | id, email, full_name, avatar_url | Referenced by all entities |
| `tasks` | Task management | content, priority, status, scheduled_for, company_id, pipeline_company_id | → projects, categories, companies |
| `projects` | Work organization | name, description, color, context | → tasks, prompts, assets, reading_items |
| `inbox_items` | Email triage | subject, from_email, snippet, is_read, is_resolved, snoozed_until | → related_company (denormalized) |
| `calendar_events` | Time commitments | title, start_time, end_time, attendees, microsoft_event_id | User-scoped only |
| `pipeline_companies` | Deal tracking | company_name, current_round, sector, status, next_steps, close_date | → contacts, interactions, tasks |
| `companies` | Portfolio companies | name, status, last_interaction_at | → contacts, interactions, tasks |
| `reading_items` | URL bookmarks | url, title, description, is_read | → projects |
| `prompts` | AI prompt library | title, content, tags | → projects |
| `nonnegotiables` | Habit tracking | title, frequency, reminder_time, is_active | → projects |

#### Supporting Tables

| Table | Purpose |
|-------|---------|
| `categories` | Task categorization |
| `assets` | Project resources/links |
| `pipeline_contacts` | People at pipeline companies |
| `pipeline_interactions` | Interaction history (calls, emails, meetings) |
| `company_contacts` | People at portfolio companies |
| `company_interactions` | Portfolio interaction history |
| `outlook_connections` | Microsoft OAuth tokens |

---

## Part 2: Real VC Workflow vs. Casper

### A Day in the Life

| Time | Activity | Information Need | Casper Support | Gap |
|------|----------|------------------|----------------|-----|
| 7:00 AM | Check what's on fire | "What slipped overnight?" | Inbox shows unread emails; calendar shows meetings | No aggregation of ALL urgent items (stale companies, overdue tasks, expiring deals) |
| 7:30 AM | Prep for 8 AM call with portfolio CEO | "What did we discuss last time? What did I promise?" | Can navigate to company, view interactions | Must remember company name, no "prep for next meeting" view |
| 8:00 AM | Call with CEO | Take notes, capture action items | Can create tasks linked to company | Tasks created manually, no AI capture |
| 9:00 AM | Check email | Triage inbound requests | Inbox shows forwarded emails | No way to quickly convert email → task with context |
| 9:30 AM | 30-min window before next call | "What's the highest-leverage 20-min action?" | Priority panel shows 8 items | Items aren't filtered by time-to-complete; no effort scoring |
| 10:00 AM | Pipeline call | Evaluate deal, record impressions | Pipeline company detail modal | `next_steps` is free text, not actionable; no reminder |
| 11:00 AM | Partner meeting | "What are my active deals? Which need attention?" | Pipeline board shows status | No "needs my attention" filter; staleness hidden |
| 12:30 PM | Lunch errand | "Anything I can knock out on mobile?" | No mobile-specific view | App is responsive but no "quick wins" mode |
| 2:00 PM | Board meeting prep | "What's the status of Company X?" | Company page + interactions | Context scattered; no summary view |
| 4:00 PM | End of day review | "What did I not get to? What's tomorrow look like?" | Calendar shows events; tasks show due dates | No end-of-day review workflow; no "defer to tomorrow" action |
| 5:00 PM | Personal tasks | "What non-work stuff do I need to handle?" | Tasks + categories | Personal tasks mixed with work; no mode switching |

### Workflow Breakdown Analysis

#### Failure Mode 1: Portfolio Company Follow-ups Slip

```
User has a call → logs interaction → mentions they'll "send that deck"
                                              │
                                              ▼
                     Promise lives only in interaction `content` (free text)
                                              │
                                              ▼
              No task auto-created; no flag for "commitment made"
                                              │
                                              ▼
                   Next week: founder emails asking for deck → user forgot
```

#### Failure Mode 2: Pipeline Deals Go Stale

```
Company added with `next_steps: "Schedule follow-up"`
                        │
                        ▼
       No due date attached; `next_steps` is not a task
                        │
                        ▼
    3 weeks pass; `last_interaction_at` is old but nothing surfaces this
                        │
                        ▼
       `is_top_of_mind` flag helps but requires manual curation
```

#### Failure Mode 3: Inbox Becomes a Graveyard

```
Emails forwarded in, marked as read, but not resolved
                        │
                        ▼
    User thinks "I'll handle this later" but no snooze or reminder
                        │
                        ▼
    Snooze feature exists in UI but doesn't resurface items reliably
                        │
                        ▼
    Items marked "resolved" disappear but no task created
```

#### Failure Mode 4: Short Windows Wasted

```
User has 15 minutes between calls
              │
              ▼
Opens dashboard, sees 8 priority items
              │
              ▼
Items are sorted by urgency but not effort
              │
              ▼
A 2-minute email reply ranks the same as a 2-hour analysis task
              │
              ▼
User scrolls, picks randomly, feels unproductive
```

#### Failure Mode 5: Context Switching Costs

```
User reads an email about a pipeline company
              │
              ▼
Opens pipeline view, finds company, opens detail
              │
              ▼
Realizes there's a task too, opens tasks view
              │
              ▼
By now, 5 minutes gone just navigating
```

---

## Part 3: Gap Analysis

### 1. Capture Gaps

| What's Missing | Impact | Severity |
|---------------|--------|----------|
| **Commitments/promises** | Things user said they'd do (on calls, in emails) have no explicit object | Critical |
| **People as first-class objects** | Contacts exist but aren't unified across portfolio/pipeline; can't say "what do I owe Sarah?" | High |
| **External task sources** | Slack messages, texts, verbal asks not captured | High |
| **Quick capture from mobile** | No voice note → task workflow | Medium |
| **Meeting outcomes** | No structured "what was decided, what are next steps" capture | High |
| **Task effort estimates** | No way to say "this takes 5 min" vs "this takes 2 hours" | Medium |

### 2. Context Gaps

| Missing Link | Example | Impact |
|--------------|---------|--------|
| **Email ↔ Task** | "Follow up on Sarah's email" doesn't link to the actual email | Must remember/search |
| **Task ↔ Calendar** | "Prep for board meeting" doesn't know which calendar event it preps for | Must cross-reference |
| **Person ↔ Everything** | Sarah is a founder at Acme, sent an email, has a task, and a call scheduled—no unified view | Must manually synthesize |
| **Company ↔ Calendar** | Board meeting doesn't auto-link to the portfolio company | Manual association |
| **Pipeline `next_steps` ↔ Tasks** | `next_steps` is text, not an actionable task with a due date | Falls through cracks |

### 3. Prioritization Gaps

#### Missing Signals in Priority Score

| Signal | Current State | What's Needed |
|--------|--------------|---------------|
| Portfolio company staleness | Not in priority system at all | If 20+ days since interaction, surface |
| Pipeline company urgency | Not in priority system | If `close_date` approaching or `next_steps` stale, surface |
| Commitment weightedness | No concept | User-promised items should score higher |
| Effort/time-to-complete | No concept | Filter by "can do in 15 min" |
| Meeting prep | Calendar events are flat | "You have a call with X in 2 hours—did you prep?" |
| Reading list debt | Not in system | Unread items piling up = signal |
| Nonnegotiable streaks | Not in system | Breaking a streak should surface |

#### Why "What can I do in 15 minutes?" Fails

- Tasks have no effort estimate field
- Priority algorithm has no `effortScore` dimension (weight is 0)
- No filtering by time available in UI

#### Why "What's most important?" Is Fuzzy

- Importance score is binary (high/medium/low priority on tasks)
- No weighting for: company tier, deal size, relationship depth, user-defined importance
- No learning from what user actually acts on

### 4. Actionability Gaps

| Object | Information Shown | Action Available | Missing Action |
|--------|-------------------|------------------|----------------|
| **Priority Item** | Title, company, urgency | Snooze, Resolve | "Create task from this", "Send quick reply", "Delegate" |
| **Inbox Item** | Email content | Mark read, Archive, Snooze | "Reply", "Convert to task with context", "Link to company" |
| **Pipeline Company** | Status, next_steps | Change status, Edit | "Create follow-up task", "Set reminder", "Schedule call" |
| **Portfolio Company** | Last interaction | Log interaction | "What do I owe them?", "Prep for next meeting" |
| **Calendar Event** | Title, time, attendees | None (read-only) | "Prep for this", "Log notes after", "Create follow-up" |
| **Reading Item** | Article metadata | Mark read, Delete | "Create task to review", "Share with team", "Extract key points" |

### 5. Confidence / Peace-of-Mind Gaps

#### Why the User Still Worries

1. **No "nothing is forgotten" guarantee.** The system doesn't surface stale items proactively. If something isn't in the top 8 priority items, it's invisible.

2. **Snooze/resolve don't feel safe.** Snoozed items may or may not return (implementation is partial). Resolved items disappear without a trail.

3. **No review rituals.** No weekly review workflow showing "these items are old", no "end of day: what did you not get to?"

4. **No delegated tracking.** If user asks someone else to do something, there's no "waiting for" state.

5. **No escalation.** An item that's been snoozed 3 times doesn't get flagged as "you're avoiding this."

6. **Coverage blindness.** User can't see "these 12 companies I haven't touched in 30 days" or "these 5 emails have been in inbox for 2 weeks."

---

## Part 4: Root Cause Assessment

### Diagnosis: Three Structural Failures

#### 1. Data Model Gap: No "Commitment" Entity

The most important thing Casper is missing is an explicit representation of what the user has promised to do. Currently:

- Tasks are things the user wants to do
- Inbox items are requests from others
- `next_steps` on companies is free-form text

None of these capture: "I told Sarah I'd send the deck by Friday."

**This needs to be a first-class object with:**
- Who I promised
- What I promised
- When I promised it
- Deadline (explicit or implied)
- Source (which call/email/meeting)

Without this, the system cannot reason about broken promises—which are the #1 source of "slipping through cracks."

#### 2. Orchestration Gap: Priority System is Incomplete

The unified priority system (`useUnifiedPriorityV1`) is the right idea but wrong scope:

| What it includes | What it excludes |
|------------------|------------------|
| Tasks | Portfolio companies |
| Inbox | Pipeline companies |
| Calendar | Reading list |
| | Nonnegotiables |
| | Commitments |

This means 5+ major sources of "what needs attention" are invisible to the priority engine. The system can only prioritize what it sees.

**Furthermore, the scoring algorithm lacks:**

| Dimension | Status | Issue |
|-----------|--------|-------|
| **Commitment score** | Missing | Things I promised should outrank things I want to do |
| **Effort score** | Disabled | Enabled in config but weight is 0% |
| **Relationship score** | Missing | Requests from important people should rank higher |
| **Recency score** | Minimal | Weight is 15% but only used for tie-breaking |

#### 3. UX Gap: Tools, Not Workflow

Casper is built as a collection of tools:
- A task manager
- A pipeline tracker
- A reading list
- An inbox viewer
- A calendar viewer

These are **pages you navigate to**. The dashboard attempts to unify them but is still "views into data" not "guidance on action."

**What's missing is a command loop:**

```
1. SURFACE    → What needs attention right now?
      │
      ▼
2. DECIDE     → Is this the highest-leverage action?
      │
      ▼
3. ACT        → Do the thing (or defer/delegate/drop)
      │
      ▼
4. CAPTURE    → Record what happened, what was promised
      │
      ▼
5. RETURN     → Back to step 1
```

**Current state:**
- Step 1: Partially supported (priority panel)
- Step 2: Not supported (no guidance)
- Step 3: Partially supported (can complete tasks)
- Step 4: Not supported (manual only)
- Step 5: Not supported (no loop)

### Is Casper a Command Center?

**No.** It's closer to a personal CRM with a dashboard.

| Command Center Would... | Casper Does... |
|------------------------|----------------|
| Know everything you've committed to | Track tasks and companies |
| Surface the single most important action at any moment | Show 8 prioritized items (from 3 sources) |
| Enable that action without navigation | Require navigation to act |
| Learn what you act on vs. ignore | Not learn from user behavior |
| Guarantee nothing is forgotten | Have coverage gaps where items can be lost |

---

## Part 5: Readiness Score

| Dimension | Score | Assessment |
|-----------|-------|------------|
| **Data Capture** | 6/10 | Good coverage of tasks, companies, calendar. Missing: commitments, effort, relationships. |
| **Data Linking** | 4/10 | Tasks can link to companies. Otherwise, objects are siloed. No person-centric view. |
| **Prioritization** | 5/10 | Unified system exists but covers 3/8 sources. Algorithm is simplistic. |
| **Actionability** | 5/10 | Can complete tasks. Cannot act on inbox, calendar, companies directly from priority view. |
| **Orchestration** | 3/10 | No workflow guidance. No review rituals. No delegation tracking. |
| **Peace of Mind** | 3/10 | User cannot trust system. Snooze/resolve unreliable. Stale items invisible. |
| **Learning** | 1/10 | No feedback loop. System doesn't know what user acted on. |

### Overall Readiness: 4/10

Casper has the foundation of a command center (good data models, priority system architecture) but is not yet delivering the core promise: *"Nothing will slip through the cracks, and you always know your next best action."*

---

## Appendix A: Technical Architecture Summary

### Hooks & State Management

| Hook | Domain | Data Sources | Real-time |
|------|--------|--------------|-----------|
| `useTasks()` | Tasks | Supabase | No |
| `useProjects()` | Projects | Supabase | No |
| `useInboxItems()` | Inbox | Supabase + TanStack Query | No |
| `usePipeline()` | Pipeline | Supabase | Yes |
| `usePortfolioCompanies()` | Portfolio | Supabase | Yes |
| `useOutlookCalendar()` | Calendar | Edge Function | No |
| `useReadingItems()` | Reading | Supabase | No |
| `useUnifiedPriorityV1()` | Priority | Tasks + Inbox + Calendar | No |

### Edge Functions

| Function | External API | Purpose |
|----------|--------------|---------|
| `email-inbox-ingest` | SMTP webhook | Email capture |
| `sync-outlook-calendar` | Microsoft Graph | Calendar sync |
| `microsoft-auth` | Microsoft OAuth | Calendar auth |
| `prompt_builder_generate` | OpenAI GPT-4o-mini | AI prompts |
| `prompt_builder_followups` | OpenAI GPT-4o-mini | AI clarification |
| `fetch-link-metadata` | Microlink.io | URL enrichment |
| `fetch-company-logo` | Logo.dev | Company branding |

### Priority System Configuration (v1)

```typescript
V1_PRIORITY_CONFIG = {
  weights: {
    urgency: 0.60,      // Time sensitivity
    importance: 0.40,   // Priority/flags
    recency: 0.00,      // Disabled in v1
    commitment: 0.00,   // Disabled in v1
    effort: 0.00        // Disabled in v1
  },
  maxItems: 8,
  minScore: 0.0,           // No threshold
  maxItemsPerSource: 999,  // No diversity rules
  calendarUpcomingWindow: 48,  // hours
  inboxUrgentWindow: 4         // hours
}
```

---

## Appendix B: What This Analysis Did NOT Cover

- Mobile experience (assumed responsive but not evaluated)
- Performance / load times
- Multi-user / collaboration scenarios
- Specific edge cases in data sync (Outlook failures, etc.)
- Security / auth edge cases
- Lovable platform constraints
- Cost analysis of proposed changes

---

## Part 6: Proposed Solutions

This section provides concrete, implementable solutions for each critical gap identified in the audit. Solutions are organized by the root cause they address and include database schemas, hook modifications, and UI changes.

---

### Solution Category 1: Data Model Foundations

#### Solution 1.1: Commitments Table

**Problem:** Promises made to others have no explicit representation. They're buried in interaction notes or implied by tasks.

**Solution:** Create a first-class `commitments` entity that tracks what the user has promised to whom.

```sql
-- Database Migration
CREATE TYPE commitment_status AS ENUM ('open', 'completed', 'broken', 'delegated');
CREATE TYPE commitment_source AS ENUM ('call', 'email', 'meeting', 'message', 'manual');

CREATE TABLE commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What was promised
  content TEXT NOT NULL,
  context TEXT,                          -- Additional details

  -- To whom
  person_id UUID REFERENCES people(id),  -- See Solution 1.2
  person_name TEXT,                       -- Denormalized for display
  company_id UUID,                        -- Portfolio or pipeline
  company_type TEXT CHECK (company_type IN ('portfolio', 'pipeline')),

  -- When
  promised_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_at TIMESTAMPTZ,                     -- Explicit deadline
  implied_urgency TEXT,                   -- "ASAP", "end of week", "when possible"

  -- Source
  source_type commitment_source NOT NULL DEFAULT 'manual',
  source_id UUID,                         -- Link to interaction, inbox_item, calendar_event
  source_reference TEXT,                  -- Human-readable source description

  -- Status
  status commitment_status NOT NULL DEFAULT 'open',
  completed_at TIMESTAMPTZ,
  completed_via TEXT,                     -- How it was fulfilled

  -- Tracking
  snooze_count INTEGER DEFAULT 0,
  last_snoozed_at TIMESTAMPTZ,

  -- Ownership
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for priority system queries
CREATE INDEX idx_commitments_open ON commitments(created_by, status) WHERE status = 'open';
CREATE INDEX idx_commitments_due ON commitments(due_at) WHERE status = 'open';
CREATE INDEX idx_commitments_person ON commitments(person_id);
CREATE INDEX idx_commitments_company ON commitments(company_id, company_type);
```

**Hook: `useCommitments()`**

```typescript
// src/hooks/useCommitments.ts
interface Commitment {
  id: string;
  content: string;
  context?: string;
  personId?: string;
  personName?: string;
  companyId?: string;
  companyType?: 'portfolio' | 'pipeline';
  promisedAt: string;
  dueAt?: string;
  impliedUrgency?: string;
  sourceType: 'call' | 'email' | 'meeting' | 'message' | 'manual';
  sourceId?: string;
  sourceReference?: string;
  status: 'open' | 'completed' | 'broken' | 'delegated';
  snoozeCount: number;
}

function useCommitments() {
  // Fetch open commitments ordered by urgency
  // Create commitment from interaction/email/calendar
  // Mark complete with fulfillment note
  // Track snooze escalation
}
```

**UI Integration:**
- "Log commitment" button in interaction dialog
- "I promised..." quick capture in command palette
- Commitment indicator on company cards
- Dedicated "What I Owe" view

---

#### Solution 1.2: Unified People Table

**Problem:** Contacts are siloed between `pipeline_contacts` and `company_contacts`. No way to see "everything related to Sarah."

**Solution:** Create a unified `people` table that serves as the single source of truth for all contacts, with links to their company affiliations.

```sql
-- Database Migration
CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  avatar_url TEXT,

  -- Importance
  relationship_tier TEXT CHECK (relationship_tier IN ('inner_circle', 'close', 'familiar', 'acquaintance')),
  is_vip BOOLEAN DEFAULT false,

  -- Metadata
  notes TEXT,
  tags TEXT[],

  -- Ownership
  created_by UUID REFERENCES users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Link people to companies (many-to-many)
CREATE TABLE person_company_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES people(id) ON DELETE CASCADE NOT NULL,

  -- Company reference (polymorphic)
  company_id UUID NOT NULL,
  company_type TEXT CHECK (company_type IN ('portfolio', 'pipeline')) NOT NULL,

  -- Role at company
  role TEXT,
  is_founder BOOLEAN DEFAULT false,
  is_primary_contact BOOLEAN DEFAULT false,

  -- Timeline
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  is_current BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Migrate existing contacts
INSERT INTO people (name, email, created_by, created_at)
SELECT DISTINCT name, email, created_by, created_at
FROM pipeline_contacts
ON CONFLICT DO NOTHING;

-- Create role links
INSERT INTO person_company_roles (person_id, company_id, company_type, role, is_founder, is_primary_contact)
SELECT p.id, pc.pipeline_company_id, 'pipeline', pc.role, pc.is_founder, pc.is_primary
FROM pipeline_contacts pc
JOIN people p ON p.email = pc.email AND p.created_by = pc.created_by;

-- Indexes
CREATE INDEX idx_people_email ON people(email);
CREATE INDEX idx_people_name ON people(name);
CREATE INDEX idx_person_roles_company ON person_company_roles(company_id, company_type);
CREATE INDEX idx_person_roles_person ON person_company_roles(person_id);
```

**Hook: `usePerson(personId)`**

```typescript
// Returns unified view of a person
interface PersonProfile {
  person: Person;
  companies: Array<{
    id: string;
    name: string;
    type: 'portfolio' | 'pipeline';
    role: string;
    isCurrent: boolean;
  }>;
  commitments: Commitment[];      // What I owe them
  recentInteractions: Interaction[];
  upcomingMeetings: CalendarEvent[];
  relatedTasks: Task[];
  relatedEmails: InboxItem[];
}
```

**UI Integration:**
- Person detail pane (slide-over from any mention)
- "Related to [Person]" filter across all views
- Person search in command palette
- Auto-link emails to people by sender address

---

#### Solution 1.3: Task Effort Estimates

**Problem:** Can't filter tasks by "what can I do in 15 minutes." All tasks appear equal regardless of time required.

**Solution:** Add effort estimation to tasks with smart defaults.

```sql
-- Database Migration
ALTER TABLE tasks ADD COLUMN effort_minutes INTEGER;
ALTER TABLE tasks ADD COLUMN effort_category TEXT
  CHECK (effort_category IN ('quick', 'medium', 'deep', 'unknown'))
  DEFAULT 'unknown';

-- Effort categories map to ranges:
-- quick: 1-15 minutes
-- medium: 15-60 minutes
-- deep: 60+ minutes
-- unknown: not estimated
```

**Hook Updates:**

```typescript
// In useUnifiedPriorityV2
function computeEffortScore(item: PriorityItem, availableMinutes?: number): number {
  if (!availableMinutes || !item.effortMinutes) return 0.5; // neutral

  const fits = item.effortMinutes <= availableMinutes;
  const efficiency = fits ? (item.effortMinutes / availableMinutes) : 0;

  // Prefer tasks that fit well in available time
  // A 10-min task in a 15-min window scores higher than a 5-min task
  return fits ? (0.5 + efficiency * 0.5) : 0.1;
}
```

**UI Integration:**
- Effort selector in task create/edit (Quick / Medium / Deep / Custom)
- "I have X minutes" filter on dashboard
- Effort badges on task cards
- AI-suggested effort based on task content patterns

---

### Solution Category 2: Priority System Expansion

#### Solution 2.1: Full-Coverage Priority Engine (v2)

**Problem:** Priority system only sees tasks, inbox, and calendar. Portfolio companies, pipeline companies, reading list, and nonnegotiables are invisible.

**Solution:** Expand `useUnifiedPriorityV2()` to consume all 8 data sources.

```typescript
// src/hooks/useUnifiedPriorityV2.ts

const V2_PRIORITY_CONFIG: PriorityConfig = {
  weights: {
    urgency: 0.30,      // Time sensitivity
    importance: 0.25,   // Priority flags, VIP status
    commitment: 0.25,   // Did I promise this?
    recency: 0.10,      // How long has this been waiting?
    effort: 0.10,       // Does it fit my available time?
  },
  maxItems: 12,
  minScore: 0.25,             // Filter out low-signal items
  maxItemsPerSource: 4,       // Diversity: no single source dominates

  // Source-specific thresholds
  companyStaleThresholdDays: 14,
  pipelineStaleThresholdDays: 7,
  readingListMaxAgeDays: 30,
  nonnegotiableGracePeriodHours: 2,
};

interface PrioritySourceAdapter {
  sourceType: PrioritySourceType;
  fetch: () => Promise<any[]>;
  transform: (item: any) => PriorityItem;
  isEligible: (item: any) => boolean;
}

// New adapters for v2
const portfolioCompanyAdapter: PrioritySourceAdapter = {
  sourceType: 'portfolio_company',
  fetch: () => fetchPortfolioCompanies(),
  transform: (company) => ({
    id: `portfolio-${company.id}`,
    sourceType: 'portfolio_company',
    sourceId: company.id,
    title: company.name,
    subtitle: `Last contact: ${formatRelative(company.last_interaction_at)}`,
    iconType: 'stale-company',
    urgencyScore: computeCompanyStaleness(company),
    importanceScore: company.status === 'active' ? 0.8 : 0.4,
    commitmentScore: hasOpenCommitments(company.id) ? 1.0 : 0.0,
    companyId: company.id,
    companyName: company.name,
    reasoning: `Portfolio company needs attention`,
  }),
  isEligible: (company) => {
    const daysSinceContact = daysSince(company.last_interaction_at);
    return daysSinceContact >= V2_PRIORITY_CONFIG.companyStaleThresholdDays;
  },
};

const pipelineCompanyAdapter: PrioritySourceAdapter = {
  sourceType: 'pipeline_company',
  fetch: () => fetchPipelineCompanies(),
  transform: (company) => ({
    id: `pipeline-${company.id}`,
    sourceType: 'pipeline_company',
    sourceId: company.id,
    title: company.company_name,
    subtitle: company.next_steps || 'No next steps defined',
    iconType: company.close_date && isWithinDays(company.close_date, 7)
      ? 'due-soon' : 'stale-company',
    urgencyScore: computePipelineUrgency(company),
    importanceScore: company.is_top_of_mind ? 0.9 : 0.5,
    commitmentScore: company.next_steps ? 0.6 : 0.0,
    dueAt: company.close_date,
    companyId: company.id,
    companyName: company.company_name,
    reasoning: buildPipelineReasoning(company),
  }),
  isEligible: (company) => {
    if (company.status === 'passed') return false;
    const hasUpcomingClose = company.close_date && isWithinDays(company.close_date, 14);
    const isStale = daysSince(company.last_interaction_at) >= 7;
    const hasNextSteps = !!company.next_steps;
    return hasUpcomingClose || isStale || (hasNextSteps && company.is_top_of_mind);
  },
};

const commitmentAdapter: PrioritySourceAdapter = {
  sourceType: 'commitment',
  fetch: () => fetchOpenCommitments(),
  transform: (commitment) => ({
    id: `commitment-${commitment.id}`,
    sourceType: 'commitment',
    sourceId: commitment.id,
    title: commitment.content,
    subtitle: `Promised to ${commitment.person_name}`,
    iconType: isOverdue(commitment.due_at) ? 'overdue' : 'due-soon',
    urgencyScore: computeCommitmentUrgency(commitment),
    importanceScore: 0.9, // Commitments are always important
    commitmentScore: 1.0, // By definition
    dueAt: commitment.due_at,
    personId: commitment.person_id,
    personName: commitment.person_name,
    companyId: commitment.company_id,
    reasoning: `You promised this ${formatRelative(commitment.promised_at)}`,
    signals: [
      { source: 'commitment', weight: 1.0, description: 'You made a promise' },
      commitment.snooze_count > 2
        ? { source: 'escalation', weight: 0.3, description: `Snoozed ${commitment.snooze_count} times` }
        : null,
    ].filter(Boolean),
  }),
  isEligible: (commitment) => commitment.status === 'open',
};

// Main hook
function useUnifiedPriorityV2(options?: { availableMinutes?: number }) {
  const adapters = [
    taskAdapter,
    inboxAdapter,
    calendarAdapter,
    portfolioCompanyAdapter,
    pipelineCompanyAdapter,
    commitmentAdapter,
    readingListAdapter,
    nonnegotiableAdapter,
  ];

  // Fetch all sources in parallel
  const results = await Promise.all(adapters.map(a => a.fetch()));

  // Transform and filter
  let allItems: PriorityItem[] = [];
  adapters.forEach((adapter, i) => {
    const eligible = results[i].filter(adapter.isEligible);
    allItems.push(...eligible.map(adapter.transform));
  });

  // Compute final scores
  allItems = allItems.map(item => ({
    ...item,
    priorityScore: computePriorityScoreV2(item, options),
  }));

  // Apply diversity rules
  const selected = applyDiversityRules(allItems, V2_PRIORITY_CONFIG);

  return {
    items: selected,
    totalCount: allItems.length,
    bySource: groupBy(allItems, 'sourceType'),
  };
}
```

**Key Improvements:**
- 8 data sources instead of 3
- Commitment score as first-class dimension
- Effort filtering based on available time
- Diversity rules prevent single-source domination
- Minimum score threshold filters noise

---

#### Solution 2.2: Meeting Prep Intelligence

**Problem:** Calendar events don't trigger prep reminders. User sees "Board Meeting with Acme" but gets no prompt to prepare.

**Solution:** Detect meetings with companies and surface prep items.

```typescript
// src/hooks/useMeetingPrep.ts

interface MeetingPrepItem {
  event: CalendarEvent;
  company?: Company;
  person?: Person;
  prepTasks: Task[];
  openCommitments: Commitment[];
  recentInteractions: Interaction[];
  suggestedPrepActions: string[];
}

function useMeetingPrep(hoursAhead: number = 4) {
  const { events } = useOutlookCalendar();
  const upcomingMeetings = events.filter(e =>
    isWithinHours(e.start_time, hoursAhead) &&
    !isPast(e.start_time)
  );

  return upcomingMeetings.map(event => {
    // Match meeting to company by attendee email or title
    const company = matchEventToCompany(event);
    const person = matchEventToPerson(event);

    return {
      event,
      company,
      person,
      prepTasks: company ? getOpenTasksForCompany(company.id) : [],
      openCommitments: company ? getOpenCommitmentsForCompany(company.id) : [],
      recentInteractions: company ? getRecentInteractions(company.id, 5) : [],
      suggestedPrepActions: generatePrepSuggestions(event, company),
    };
  });
}

function generatePrepSuggestions(event: CalendarEvent, company?: Company): string[] {
  const suggestions: string[] = [];

  if (company) {
    const daysSinceContact = daysSince(company.last_interaction_at);
    if (daysSinceContact > 30) {
      suggestions.push(`Review last interaction (${daysSinceContact} days ago)`);
    }

    const openTasks = getOpenTasksForCompany(company.id);
    if (openTasks.length > 0) {
      suggestions.push(`${openTasks.length} open tasks to discuss`);
    }

    const commitments = getOpenCommitmentsForCompany(company.id);
    if (commitments.length > 0) {
      suggestions.push(`${commitments.length} outstanding commitments`);
    }
  }

  return suggestions;
}
```

**UI Integration:**
- "Prep needed" indicator on calendar events in sidebar
- Meeting prep card in priority panel 2-4 hours before meeting
- One-click access to company context from meeting card

---

### Solution Category 3: Workflow & Orchestration

#### Solution 3.1: The Command Loop

**Problem:** Casper shows information but doesn't guide action. User must decide what to do, act, and remember to capture outcomes.

**Solution:** Implement an explicit command loop with guided workflow.

```
┌─────────────────────────────────────────────────────────────┐
│                    CASPER COMMAND LOOP                       │
│                                                              │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐ │
│   │ SURFACE │ → │ DECIDE  │ → │   ACT   │ → │ CAPTURE │  │
│   │         │    │         │    │         │    │         │  │
│   │ "Here's │    │ "Is     │    │ "Do it  │    │ "What   │  │
│   │ what    │    │ this    │    │ or      │    │ happened│  │
│   │ needs   │    │ right?" │    │ defer"  │    │ next?"  │  │
│   │ you"    │    │         │    │         │    │         │  │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘  │
│        ↑                                            │       │
│        └────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

**Implementation: Focus Mode**

```typescript
// src/components/dashboard/FocusMode.tsx

interface FocusModeState {
  currentItem: PriorityItem | null;
  queue: PriorityItem[];
  sessionStats: {
    completed: number;
    snoozed: number;
    skipped: number;
    sessionStart: Date;
  };
}

function FocusMode() {
  const { items } = useUnifiedPriorityV2();
  const [state, dispatch] = useReducer(focusModeReducer, initialState);

  // Actions available for current item
  const actions = getActionsForItem(state.currentItem);

  return (
    <div className="focus-mode">
      {/* Current Item - Full Context */}
      <FocusCard item={state.currentItem}>
        {/* Inline context: related company, person, emails, tasks */}
        <RelatedContext item={state.currentItem} />

        {/* Primary actions */}
        <ActionBar>
          <CompleteButton onClick={() => handleComplete(state.currentItem)} />
          <SnoozeButton options={['1h', '4h', 'tomorrow', 'next_week']} />
          <DelegateButton />
          <SkipButton reason />
        </ActionBar>

        {/* Quick capture after action */}
        <CapturePrompt
          show={showCapturePrompt}
          prompts={[
            "Any commitments made?",
            "Create follow-up task?",
            "Log interaction?",
          ]}
        />
      </FocusCard>

      {/* Queue preview */}
      <QueuePreview items={state.queue.slice(0, 3)} />

      {/* Session stats */}
      <SessionStats stats={state.sessionStats} />
    </div>
  );
}

// Actions produce capture prompts
function handleComplete(item: PriorityItem) {
  markItemComplete(item);

  // Prompt for follow-up
  if (item.sourceType === 'task' && item.companyId) {
    showCapturePrompt({
      suggestions: [
        'Log this as an interaction',
        'Create follow-up commitment',
        'Schedule next touchpoint',
      ],
    });
  }

  advanceToNextItem();
}
```

**Key Features:**
- Single item focus (not a list)
- All context inline (no navigation)
- Explicit action buttons (complete, snooze, delegate, skip)
- Capture prompt after every action
- Session stats for motivation

---

#### Solution 3.2: Review Rituals

**Problem:** No systematic way to review what's falling behind, what's upcoming, or what got done.

**Solution:** Built-in review workflows for daily and weekly cadences.

```typescript
// src/hooks/useReviewData.ts

interface DailyReviewData {
  // What's on fire
  overdueItems: PriorityItem[];
  brokenCommitments: Commitment[];

  // What's today
  todaysTasks: Task[];
  todaysMeetings: CalendarEvent[];

  // What didn't get done yesterday
  carriedOver: Task[];

  // Quick stats
  stats: {
    completedYesterday: number;
    openCommitments: number;
    staleCompanies: number;
    inboxUnread: number;
  };
}

interface WeeklyReviewData {
  // Accomplishments
  completedThisWeek: Task[];
  interactionsLogged: number;
  commitmentsFulfilled: Commitment[];

  // Concerns
  stalePortfolioCompanies: Company[];
  stalePipelineCompanies: PipelineCompany[];
  oldestUnresolvedInbox: InboxItem[];
  repeatedlySnoozedItems: PriorityItem[];

  // Upcoming
  nextWeekMeetings: CalendarEvent[];
  upcomingDeadlines: Array<Task | Commitment>;

  // Trends
  weekOverWeek: {
    tasksCompleted: { thisWeek: number; lastWeek: number };
    companiesContacted: { thisWeek: number; lastWeek: number };
    avgResponseTime: { thisWeek: number; lastWeek: number };
  };
}

function useDailyReview() {
  // Aggregate data for morning review
}

function useWeeklyReview() {
  // Aggregate data for Sunday/Monday review
}
```

**UI: Review Pages**

```typescript
// src/pages/DailyReview.tsx

function DailyReviewPage() {
  const data = useDailyReview();
  const [step, setStep] = useState<'fires' | 'today' | 'carryover' | 'done'>('fires');

  return (
    <ReviewWizard>
      <Step name="fires" title="What's On Fire">
        <OverdueList items={data.overdueItems} />
        <BrokenCommitments items={data.brokenCommitments} />
        <Actions>
          <RescheduleAll />
          <Triage />
        </Actions>
      </Step>

      <Step name="today" title="Today's Plan">
        <MeetingList meetings={data.todaysMeetings} />
        <TaskList tasks={data.todaysTasks} />
        <Actions>
          <AddTask />
          <ReorderPriorities />
        </Actions>
      </Step>

      <Step name="carryover" title="Yesterday's Unfinished">
        <CarryoverList items={data.carriedOver}>
          {/* For each: Do today? Reschedule? Drop? */}
        </CarryoverList>
      </Step>

      <Step name="done" title="Ready to Go">
        <TodaySummary />
        <StartFocusMode />
      </Step>
    </ReviewWizard>
  );
}
```

---

#### Solution 3.3: Snooze That Works

**Problem:** Snooze actions don't reliably persist or resurface items.

**Solution:** Proper snooze infrastructure with escalation tracking.

```sql
-- Add snooze tracking to all snoozeable entities
ALTER TABLE tasks ADD COLUMN snoozed_until TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN snooze_count INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN last_snoozed_at TIMESTAMPTZ;

ALTER TABLE inbox_items ADD COLUMN snooze_count INTEGER DEFAULT 0;
ALTER TABLE inbox_items ADD COLUMN last_snoozed_at TIMESTAMPTZ;

-- Create unified snooze log for analytics
CREATE TABLE snooze_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  snoozed_until TIMESTAMPTZ NOT NULL,
  snooze_reason TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Hook: `useSnooze()`**

```typescript
function useSnooze() {
  const snooze = async (
    entityType: 'task' | 'inbox' | 'commitment' | 'priority_item',
    entityId: string,
    until: Date,
    reason?: string
  ) => {
    // Update entity
    await updateEntity(entityType, entityId, {
      snoozed_until: until.toISOString(),
      snooze_count: increment(),
      last_snoozed_at: new Date().toISOString(),
    });

    // Log for analytics
    await logSnooze({ entityType, entityId, until, reason });

    // If snoozed 3+ times, flag for escalation
    const snoozeCount = await getSnoozeCount(entityType, entityId);
    if (snoozeCount >= 3) {
      await flagForEscalation(entityType, entityId);
    }
  };

  const getSnoozeOptions = (context?: 'morning' | 'afternoon' | 'evening') => {
    const now = new Date();
    return [
      { label: 'In 1 hour', value: addHours(now, 1) },
      { label: 'In 4 hours', value: addHours(now, 4) },
      { label: 'Tomorrow morning', value: setHours(addDays(now, 1), 9) },
      { label: 'Next week', value: setHours(nextMonday(now), 9) },
      { label: 'Custom...', value: null },
    ];
  };

  return { snooze, getSnoozeOptions };
}
```

**Escalation Rules:**

```typescript
const ESCALATION_RULES = {
  snoozeThreshold: 3,      // Flag after 3 snoozes
  ageThreshold: 14,        // Flag items older than 14 days
  commitmentMultiplier: 2, // Commitments escalate 2x faster
};

function computeEscalationLevel(item: PriorityItem): 'none' | 'warning' | 'critical' {
  const snoozeScore = item.snoozeCount / ESCALATION_RULES.snoozeThreshold;
  const ageScore = daysSince(item.createdAt) / ESCALATION_RULES.ageThreshold;
  const multiplier = item.sourceType === 'commitment'
    ? ESCALATION_RULES.commitmentMultiplier
    : 1;

  const escalationScore = (snoozeScore + ageScore) * multiplier;

  if (escalationScore >= 2) return 'critical';
  if (escalationScore >= 1) return 'warning';
  return 'none';
}
```

---

### Solution Category 4: Actionability

#### Solution 4.1: Inline Actions on Priority Items

**Problem:** Seeing an item in the priority panel requires navigation to act on it.

**Solution:** Enable common actions directly from the priority card.

```typescript
// src/components/dashboard/PriorityItemCard.tsx

function PriorityItemCard({ item }: { item: PriorityItem }) {
  const actions = getActionsForSourceType(item.sourceType);

  return (
    <Card>
      <CardContent>
        <ItemHeader item={item} />
        <ItemContext item={item} />
      </CardContent>

      <CardActions>
        {/* Universal actions */}
        <CompleteButton item={item} />
        <SnoozeDropdown item={item} />

        {/* Source-specific actions */}
        {item.sourceType === 'inbox' && (
          <>
            <CreateTaskFromEmail item={item} />
            <QuickReplyButton item={item} />
          </>
        )}

        {item.sourceType === 'task' && item.companyId && (
          <LogInteractionButton companyId={item.companyId} />
        )}

        {item.sourceType === 'commitment' && (
          <>
            <MarkFulfilledButton item={item} />
            <DelegateButton item={item} />
          </>
        )}

        {item.sourceType === 'calendar_event' && (
          <>
            <PrepForMeetingButton event={item} />
            <ViewCompanyButton companyId={item.companyId} />
          </>
        )}

        {(item.sourceType === 'portfolio_company' ||
          item.sourceType === 'pipeline_company') && (
          <>
            <LogInteractionButton companyId={item.sourceId} />
            <CreateTaskButton companyId={item.sourceId} />
            <ScheduleCallButton companyId={item.sourceId} />
          </>
        )}
      </CardActions>
    </Card>
  );
}
```

**Quick Actions Registry:**

```typescript
const QUICK_ACTIONS: Record<PrioritySourceType, QuickAction[]> = {
  task: [
    { key: 'complete', label: 'Done', icon: CheckIcon, handler: completeTask },
    { key: 'snooze', label: 'Snooze', icon: ClockIcon, handler: snoozeTask },
    { key: 'edit', label: 'Edit', icon: EditIcon, handler: openTaskEdit },
  ],
  inbox: [
    { key: 'task', label: 'Create Task', icon: PlusIcon, handler: createTaskFromInbox },
    { key: 'resolve', label: 'Resolve', icon: CheckIcon, handler: resolveInbox },
    { key: 'snooze', label: 'Snooze', icon: ClockIcon, handler: snoozeInbox },
  ],
  commitment: [
    { key: 'fulfill', label: 'Fulfilled', icon: CheckIcon, handler: fulfillCommitment },
    { key: 'delegate', label: 'Delegate', icon: UserIcon, handler: delegateCommitment },
    { key: 'snooze', label: 'Snooze', icon: ClockIcon, handler: snoozeCommitment },
  ],
  portfolio_company: [
    { key: 'interact', label: 'Log Call', icon: PhoneIcon, handler: logInteraction },
    { key: 'task', label: 'Add Task', icon: PlusIcon, handler: createCompanyTask },
    { key: 'email', label: 'Email', icon: MailIcon, handler: openEmailComposer },
  ],
  pipeline_company: [
    { key: 'interact', label: 'Log Call', icon: PhoneIcon, handler: logInteraction },
    { key: 'status', label: 'Update Status', icon: ArrowRightIcon, handler: openStatusChange },
    { key: 'pass', label: 'Pass', icon: XIcon, handler: passDeal },
  ],
  calendar_event: [
    { key: 'prep', label: 'Prep', icon: FileTextIcon, handler: openMeetingPrep },
    { key: 'notes', label: 'Notes', icon: EditIcon, handler: openMeetingNotes },
  ],
};
```

---

#### Solution 4.2: Quick Wins Mode

**Problem:** User has 15 minutes but can't easily find tasks that fit.

**Solution:** Dedicated view filtered by effort estimate.

```typescript
// src/components/dashboard/QuickWinsMode.tsx

function QuickWinsMode() {
  const [availableMinutes, setAvailableMinutes] = useState(15);
  const { items } = useUnifiedPriorityV2({ availableMinutes });

  // Filter to items that fit in available time
  const quickWins = items.filter(item =>
    item.effortMinutes && item.effortMinutes <= availableMinutes
  );

  // Sort by impact (priority score) / effort ratio
  const sortedByLeverage = quickWins.sort((a, b) => {
    const leverageA = a.priorityScore / (a.effortMinutes || 15);
    const leverageB = b.priorityScore / (b.effortMinutes || 15);
    return leverageB - leverageA;
  });

  return (
    <div className="quick-wins">
      <TimeSelector
        value={availableMinutes}
        onChange={setAvailableMinutes}
        options={[5, 10, 15, 30, 60]}
      />

      <div className="wins-list">
        {sortedByLeverage.slice(0, 5).map(item => (
          <QuickWinCard key={item.id} item={item} />
        ))}
      </div>

      {sortedByLeverage.length === 0 && (
        <EmptyState>
          <p>No quick wins found for {availableMinutes} minutes.</p>
          <SuggestAddEffort />
        </EmptyState>
      )}
    </div>
  );
}
```

---

#### Solution 4.3: Email → Task Conversion

**Problem:** Converting an inbox item to a task loses context (who sent it, what they asked for).

**Solution:** Smart task creation that preserves email context.

```typescript
// src/hooks/useInboxToTask.ts

function useInboxToTask() {
  const createTaskFromInbox = async (
    inboxItem: InboxItem,
    options?: {
      extractAction?: boolean;  // Use AI to extract action
      linkToCompany?: boolean;  // Auto-link if sender matches company
      preserveEmail?: boolean;  // Link back to email
    }
  ) => {
    let taskContent = inboxItem.subject;
    let companyId = inboxItem.related_company_id;

    // AI extraction of action item
    if (options?.extractAction) {
      const extracted = await extractActionFromEmail(inboxItem);
      taskContent = extracted.suggestedTask || inboxItem.subject;
    }

    // Auto-link to company by sender email
    if (options?.linkToCompany && !companyId) {
      const person = await findPersonByEmail(inboxItem.from_email);
      if (person?.companies?.length) {
        companyId = person.companies[0].id;
      }
    }

    const task = await createTask({
      content: taskContent,
      company_id: companyId,
      priority: 'medium',
      metadata: {
        source: 'inbox',
        source_id: inboxItem.id,
        from_email: inboxItem.from_email,
        from_name: inboxItem.from_name,
        email_snippet: inboxItem.snippet,
      },
    });

    // Mark inbox item as resolved with link to task
    await resolveInboxItem(inboxItem.id, {
      resolved_via: 'task_created',
      resolved_task_id: task.id,
    });

    return task;
  };

  return { createTaskFromInbox };
}
```

---

### Solution Category 5: Peace of Mind

#### Solution 5.1: Coverage Dashboard

**Problem:** User can't see what's slipping across the entire system.

**Solution:** System health view showing coverage and staleness across all domains.

```typescript
// src/hooks/useSystemHealth.ts

interface SystemHealth {
  overall: 'healthy' | 'warning' | 'critical';

  domains: {
    tasks: {
      status: 'healthy' | 'warning' | 'critical';
      overdue: number;
      dueToday: number;
      noDate: number;
      avgAge: number;
    };
    inbox: {
      status: 'healthy' | 'warning' | 'critical';
      unread: number;
      unresolved: number;
      oldestUnresolved: number; // days
    };
    portfolio: {
      status: 'healthy' | 'warning' | 'critical';
      staleCompanies: number;  // >14 days
      criticalCompanies: number; // >30 days
      avgDaysSinceContact: number;
    };
    pipeline: {
      status: 'healthy' | 'warning' | 'critical';
      activeDeals: number;
      stalePipeline: number;
      upcomingCloses: number;
      overdueNextSteps: number;
    };
    commitments: {
      status: 'healthy' | 'warning' | 'critical';
      open: number;
      overdue: number;
      avgAge: number;
    };
  };

  alerts: Array<{
    severity: 'warning' | 'critical';
    message: string;
    action: string;
    link: string;
  }>;
}

function useSystemHealth(): SystemHealth {
  // Compute health across all domains
  // Return actionable alerts
}
```

**UI: Health Dashboard**

```typescript
// src/components/dashboard/SystemHealth.tsx

function SystemHealthPanel() {
  const health = useSystemHealth();

  return (
    <div className="system-health">
      <OverallStatus status={health.overall} />

      <DomainGrid>
        {Object.entries(health.domains).map(([domain, data]) => (
          <DomainCard key={domain} domain={domain} data={data} />
        ))}
      </DomainGrid>

      {health.alerts.length > 0 && (
        <AlertList alerts={health.alerts} />
      )}

      <LastUpdated />
    </div>
  );
}

function DomainCard({ domain, data }) {
  return (
    <Card className={`status-${data.status}`}>
      <CardTitle>{domainLabels[domain]}</CardTitle>
      <StatusIndicator status={data.status} />
      <MetricsList metrics={data} />
      <ViewAllLink domain={domain} />
    </Card>
  );
}
```

---

#### Solution 5.2: "Nothing Forgotten" Guarantee

**Problem:** Items can be lost if they don't score high enough to appear in priority panel.

**Solution:** Aging alerts and automatic escalation.

```typescript
// src/hooks/useAgingAlerts.ts

interface AgingAlert {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  age: number;  // days
  severity: 'info' | 'warning' | 'critical';
  message: string;
  suggestedAction: string;
}

const AGING_THRESHOLDS = {
  task: { warning: 7, critical: 14 },
  inbox: { warning: 3, critical: 7 },
  commitment: { warning: 3, critical: 7 },
  portfolio_company: { warning: 14, critical: 30 },
  pipeline_company: { warning: 7, critical: 14 },
  reading_item: { warning: 14, critical: 30 },
};

function useAgingAlerts(): AgingAlert[] {
  // Scan all entities for items exceeding thresholds
  // Return sorted by severity then age
}

// Automatic escalation: boost priority of aging items
function computeAgingBoost(item: any, thresholds: { warning: number; critical: number }): number {
  const age = daysSince(item.created_at);

  if (age >= thresholds.critical) {
    return 0.3;  // +30% priority boost
  } else if (age >= thresholds.warning) {
    return 0.15; // +15% priority boost
  }
  return 0;
}
```

---

#### Solution 5.3: Delegation & Waiting-For Tracking

**Problem:** If user asks someone else to do something, there's no way to track it.

**Solution:** "Waiting for" state on tasks and commitments.

```sql
-- Add delegation tracking
ALTER TABLE tasks ADD COLUMN delegated_to TEXT;
ALTER TABLE tasks ADD COLUMN delegated_at TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN waiting_for_response BOOLEAN DEFAULT false;

ALTER TABLE commitments ADD COLUMN delegated_to_person_id UUID REFERENCES people(id);
ALTER TABLE commitments ADD COLUMN delegated_at TIMESTAMPTZ;
```

```typescript
// src/hooks/useWaitingFor.ts

interface WaitingForItem {
  id: string;
  type: 'task' | 'commitment';
  title: string;
  delegatedTo: string;
  delegatedAt: Date;
  daysSinceDelegated: number;
  shouldFollowUp: boolean;
}

function useWaitingFor() {
  const waitingTasks = useTasks({ filter: { waiting_for_response: true } });
  const delegatedCommitments = useCommitments({ filter: { status: 'delegated' } });

  const items: WaitingForItem[] = [
    ...waitingTasks.map(transformTask),
    ...delegatedCommitments.map(transformCommitment),
  ];

  // Flag items needing follow-up (>3 days)
  return items.map(item => ({
    ...item,
    shouldFollowUp: item.daysSinceDelegated >= 3,
  }));
}
```

**UI Integration:**
- "Waiting For" section in task views
- Follow-up reminder in priority panel after 3 days
- Delegate action creates waiting-for item automatically

---

### Implementation Roadmap

#### Phase 1: Foundation (Weeks 1-3) ✅ COMPLETE

| Priority | Solution | Effort | Impact | Status |
|----------|----------|--------|--------|--------|
| P0 | 2.1 Priority v2 (expand to 8 sources) | High | Critical | ✅ Done |
| P0 | 3.3 Snooze infrastructure | Medium | Critical | ✅ Done |
| P1 | 1.3 Task effort estimates | Low | High | ✅ Done |
| P1 | 4.1 Inline actions on priority cards | Medium | High | ✅ Done |

**Milestone:** Priority panel shows all sources; snooze works reliably; effort filtering available.

**Implementation Notes (January 2026):**
- Created migration `20260128000001_phase1_effort_and_snooze.sql`
- Added `effort_minutes`, `effort_category` columns to tasks
- Added `snoozed_until`, `snooze_count`, `last_snoozed_at` to tasks and inbox_items
- Created `snooze_log` table for analytics and escalation tracking
- Created `useUnifiedPriorityV2` hook consuming 8 data sources
- Created `useSnooze` hook with escalation tracking
- Enhanced `PriorityItemRow` with source-specific inline actions

#### Phase 2: Commitments & People (Weeks 4-6)

| Priority | Solution | Effort | Impact |
|----------|----------|--------|--------|
| P0 | 1.1 Commitments table | High | Critical |
| P0 | 1.2 Unified people table | High | High |
| P1 | 4.3 Email → Task conversion | Medium | High |
| P1 | 2.2 Meeting prep intelligence | Medium | Medium |

**Milestone:** Commitments tracked explicitly; people unified; emails convert to tasks with context.

#### Phase 3: Workflow & Rituals (Weeks 7-9)

| Priority | Solution | Effort | Impact |
|----------|----------|--------|--------|
| P0 | 3.1 Command loop / Focus mode | High | Critical |
| P1 | 3.2 Review rituals (daily/weekly) | Medium | High |
| P1 | 5.1 Coverage dashboard | Medium | High |
| P2 | 4.2 Quick wins mode | Low | Medium |

**Milestone:** Focus mode live; daily/weekly reviews implemented; system health visible.

#### Phase 4: Polish & Learning (Weeks 10-12)

| Priority | Solution | Effort | Impact |
|----------|----------|--------|--------|
| P1 | 5.2 Aging alerts & escalation | Medium | High |
| P1 | 5.3 Delegation tracking | Medium | Medium |
| P2 | Feedback loop (track actions) | High | Long-term |
| P2 | AI-suggested effort estimates | Medium | Medium |

**Milestone:** Nothing forgotten guarantee; delegation tracked; system learns from user behavior.

---

### Success Metrics

#### Leading Indicators

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| Priority sources coverage | 3/8 | 8/8 | Count adapters in priority system |
| Snooze reliability | ~60% | 99% | Items that resurface vs. snoozed |
| Items with effort estimate | 0% | 80% | Tasks with effort_minutes set |
| Commitments captured | 0 | 5+/week | New commitments logged |

#### Lagging Indicators

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| Overdue items | Unknown | <5 | Daily count of overdue tasks + commitments |
| Stale companies | Unknown | 0 critical | Companies with >30 days no contact |
| Inbox age | Unknown | <3 days avg | Average age of unresolved inbox items |
| User trust | Low | High | Qualitative: "Do you trust Casper?" |

---

### Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Priority system becomes slow with 8 sources | Medium | High | Implement caching; parallelize fetches |
| User doesn't log commitments | High | Critical | AI extraction from interactions; prompts |
| Effort estimates are wrong | Medium | Medium | Learn from actual completion times |
| Focus mode feels restrictive | Medium | Medium | Allow escape to full dashboard |
| Migration breaks existing data | Low | Critical | Careful migration scripts; backups |

---

### Revised Readiness Projection

| Dimension | Current | After Phase 1 | After Phase 4 |
|-----------|---------|---------------|---------------|
| Data Capture | 6/10 | 7/10 | 9/10 |
| Data Linking | 4/10 | 5/10 | 8/10 |
| Prioritization | 5/10 | 8/10 | 9/10 |
| Actionability | 5/10 | 7/10 | 9/10 |
| Orchestration | 3/10 | 5/10 | 8/10 |
| Peace of Mind | 3/10 | 6/10 | 9/10 |
| Learning | 1/10 | 2/10 | 5/10 |
| **Overall** | **4/10** | **6/10** | **8/10** |

---

*End of Solutions Section*
