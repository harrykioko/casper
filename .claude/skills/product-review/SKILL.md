---
name: product-review
description: "Run a deep product strategy review evaluating whether Casper achieves its core goals as a personal operating system for high-tempo knowledge work. Use when the user says 'product review', 'product teardown', 'are we achieving our goals', 'where am I getting stuck', 'product strategy review', or 'evaluate the product'."
---

# Product Strategy Review — Casper

This is NOT a UI/UX polish audit. This is a strategic evaluation of whether Casper is delivering on its promise as a personal operating system for high-tempo venture capital knowledge work — and where the experience falls short of daily-driver trust.

## Context

Casper is a personal command center for a venture capitalist who operates across radically different contexts throughout every day. The user (Harrison) is the sole user and uses Casper daily as his primary system.

### The VC Operating Reality

Harrison's work spans multiple domains that each require different mindsets, and the day involves constant context-switching between them:

**Portfolio management**: Companies that need introductions, operational help, fundraising support, GTM guidance. Each has its own timeline, stakeholders, and action items.

**Pipeline & deal flow**: Relationships that need nurturing, ongoing value demonstration, evaluation cycles that can be long and patient or suddenly rapid, summarization and presentment of opportunities to the broader team.

**Personal productivity**: Tasks to track and complete, things to read, reservations to book, side projects (including vibe coding), general personal and work obligations.

**The core challenge**: With this many threads across this many contexts, things easily get lost in the shuffle between meetings that require completely different mindsets. Casper must be the safety net that ensures nothing falls through the cracks.

### Core Functional Areas (as built today)
1. **Task Capture & Management**: Focus queue, quick tasks, obligations, follow-ups
2. **Email Processing & Inbox Intelligence**: Entity extraction, attachment handling, collateral linking, action items from emails
3. **Reading List & Content Consumption**: Links, articles, saved content for later reference
4. **Project/Company/People Tracking**: Linked entities, context accumulation, relationship tracking

### Product Goals (Seed — to be refined on first run)

**Vision**: A sleek command center that captures everything you commit to, everything you consume, and everything you're tracking — then turns that messy inflow into a clear, prioritized "what to do next" view.

**The Funnel Model** (current phase focus):
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

**Five Core Goals**:
1. **Frictionless capture from a very wide funnel**: One place to dump any input fast — tasks, emails, notes, links, pipeline updates, reminders. Minimal ceremony. The system meets you where you are, regardless of which context you're in.
2. **Daily clarity, not just storage**: Answer "What matters today? What's overdue? What's waiting? What can I close in 5 minutes?" — a curated focus set, not an infinite list. Reduce the cognitive load of constant context-switching.
3. **Context preservation across work**: Everything linkable to projects, companies, people, prior threads. Progress accumulates across the portfolio/pipeline/personal divide. Not disconnected lists.
4. **Action intelligence**: Time-aware nudges, suggested next moves, enrichment, prioritization. Assistive, skimmable, easy to accept or dismiss. Helps you switch contexts without losing the thread.
5. **Premium, delightful experience**: Modern, glassy, calm UI. Fast, dense, beautiful. A cockpit that makes you want to come back every day.

**What success looks like**:
- **Daily habit + trust**: First and last tab you open. Canonical source of truth for all commitments across portfolio, pipeline, and personal.
- **Nothing slips**: Intros become tracked actions, meetings generate follow-ups, emails become tasks, reading becomes reusable context — without extra manual overhead.
- **Lower cognitive load**: Less time scanning, sorting, re-finding across different contexts. More time executing the right things.
- **Faster throughput on small stuff**: Quick replies and micro-tasks closed in batches because the system surfaces them at the right moment.
- **Compounding workspace**: Each company/project/person page gets denser and more valuable over time — your personal institutional memory.
- **Confidence**: The feeling that if it's in Casper, it will get done. If it's not in Casper, it doesn't need to get done.

---

## First Run: Refine the Goals Baseline

If `docs/product-goals.md` does NOT exist:

### Step 1: Present the Seed
Show the user the goals above and ask:
- Does this still capture your vision accurately? What's changed?
- Which of the 5 goals are you closest to achieving? Which are furthest away?
- What are your biggest daily frustrations using Casper right now?
- What workflows still pull you out of Casper into other tools (email client, spreadsheets, notes apps, calendar, CRM)?
- Walk me through yesterday — what went into Casper, what didn't, and why?
- What's the one thing that, if it worked perfectly, would make everything else feel worth it?
- Are there functional areas you want to add that don't exist yet (notes & writing, meeting prep, analytics, calendar integration)?

**STOP and wait for answers.**

### Step 2: Save Refined Goals
Save to `docs/product-goals.md` with the refined vision, goals, success criteria, and current honest assessment.

Then proceed to the full review below.

---

## Subsequent Runs: Full Product Teardown

If `docs/product-goals.md` EXISTS, read it first, then ask the user if anything has changed before proceeding.

### Evaluation 1: The Daily Driver Test

This is the most important evaluation. Casper succeeds or fails based on whether it earns daily trust as the single system across all contexts.

**Morning question: "Do I open Casper first?"**
- What does the experience look like when you open Casper at the start of the day?
- Does it immediately tell you what matters today across portfolio, pipeline, AND personal?
- Is there a "daily briefing" feeling, or does it feel like opening a database?
- How many clicks/scrolls to reach "here's what I should do right now"?
- Does it account for what's on your calendar today and prep you accordingly?

**Context-switch moments: "Does Casper help me shift gears?"**
- You just left a portfolio company board call and are about to take a pipeline intro meeting. Does Casper help you mentally transition — surfacing the right context for the next thing?
- When you're between meetings with 10 minutes to spare, does Casper surface quick wins you can knock out?
- When a thread from one context interrupts another (an urgent portfolio email during pipeline research), can you capture it and return to what you were doing without losing your place?

**Throughout the day: "Do I stay in Casper?"**
- When a new input arrives (email, task, idea, link, intro request), is Casper the fastest place to capture it?
- When you need context on a company, person, or deal, does Casper have it or do you go elsewhere?
- Are there moments where you think "I should check Casper" or does it push value to you?
- What are the specific moments you leave Casper for another tool, and why?

**End of day: "Did Casper keep me honest?"**
- Did anything slip through today that Casper should have caught?
- Did the focus queue actually help you prioritize, or did you ignore it?
- Do you feel confident that all commitments made today are captured?
- Do you feel like you accomplished more because of Casper, or despite it?

**The trust test:**
- Do you trust Casper as the single source of truth for ALL commitments — portfolio, pipeline, and personal?
- If something isn't in Casper, does it feel like it doesn't exist? Or do you maintain parallel systems?
- Would you feel anxious if Casper was down for a day? Or would you barely notice?

### Evaluation 2: Intake Funnel Analysis

The wide funnel is Casper's most critical feature. For each input type, evaluate the full capture pipeline:

**Tasks & obligations (from any context)**
- How many steps from "I need to do X" to captured with the right context?
- Can you capture equally fast whether it's a portfolio task, pipeline follow-up, or personal errand?
- Do captured tasks have enough context to act on later, or do you re-derive it?
- Is there a difference between "quick capture" and "properly filed" — and is that gap causing things to get lost?

**Emails**
- How does an email become an action item? Is the flow fast enough to process in batch?
- Does entity extraction actually work — linking emails to the right companies/people/deals?
- Can you process 20 emails in 5 minutes and trust that the important ones became tracked actions?
- Are there email types that Casper handles well vs. poorly (intros, data room links, investor updates, scheduling)?

**Reading & links**
- How does a link go from "save this" to "I found it when I needed it"?
- Is the reading list actually used for retrieval, or is it a graveyard?
- Does saved content connect to the companies/projects where it's relevant?
- When researching a pipeline company, does previously saved content surface?

**Pipeline & relationship signals**
- How do you track where a pipeline relationship stands?
- When a relationship needs nurturing (follow-up overdue, haven't connected in a while), does Casper surface that?
- Can you quickly capture a signal ("met at conference, interested in our thesis") and trust it'll be there when needed?

**Notes & quick thoughts**
- When something comes up in a meeting, how fast can you capture it?
- Do captured notes link to the right context automatically, or do you have to file them?
- Can you dump a messy thought and trust Casper will help you organize it later?

**For each pipeline, rate:**
- Capture speed (seconds from thought to system)
- Context preservation (does enough metadata survive?)
- Cross-context linking (does it connect to the right entities?)
- Retrieval reliability (can you find it when you need it?)
- Action conversion (does it lead to doing something, or just storage?)

### Evaluation 3: Enrichment & Intelligence Layer

Casper's enrichment layer should turn raw inputs into actionable, contextualized items:

**Automatic enrichment**
- When you capture a company name, does Casper know what it is? Domain, stage, sector?
- When you forward an email, does it extract the right entities, action items, and deadlines?
- When you save a link, does it summarize and connect it to relevant projects?
- Where does enrichment feel magical vs. where does it feel broken or noisy?

**Prioritization intelligence**
- Does the focus queue surface the right things at the right time?
- Does it understand the difference between urgent (portfolio company crisis) and important (pipeline nurturing)?
- Can it batch similar items ("clear these 4 quick follow-ups")?
- Do you trust it enough to follow it, or do you override constantly?

**Contextual nudges**
- Are there proactive suggestions ("you haven't followed up with X in 2 weeks", "3 overdue pipeline items")?
- If they exist: helpful or annoying? Do you act on them or dismiss?
- If they don't exist: where would they add the most value?

**The key question**: Is the intelligence layer reducing your cognitive load, or is it just generating content you have to evaluate?

### Evaluation 4: Context Switching & Cross-Domain Coherence

This is unique to the VC use case — Casper must work across radically different contexts:

**Portfolio ↔ Pipeline ↔ Personal boundaries**
- Are these contexts clearly separated when they need to be (you don't see personal tasks during a portfolio review)?
- Are they connected when they should be (a portfolio company's hiring need links to a pipeline company's talent)?
- Can you fluidly move between contexts without feeling like you're using three different apps?

**Meeting-to-meeting transitions**
- Before a meeting: does Casper surface the right prep context?
- After a meeting: can you rapidly capture follow-ups and get back to your queue?
- Between meetings: does Casper help you use the gap productively?

**The "institutional memory" test**
- Pick a portfolio company you've been working with for months. Does Casper reconstruct the full relationship timeline?
- Pick a pipeline company you've been tracking. Can you see the full nurturing arc — first contact, meetings, follow-ups, shared content, current status?
- Pick a personal project. Does Casper have the full thread, or just fragments?

### Evaluation 5: Foundation for Future Execution

Casper's current phase is intake → enrichment → prioritization, but the architecture should support eventual on-platform execution. Evaluate readiness:

**Data model completeness**
- Are entities rich enough to support future actions (sending emails, booking, following up)?
- Are relationships between entities captured (this person works at this company, this company is in this pipeline stage)?
- Is activity history complete enough to power future intelligence?

**Action readiness**
- For the highest-value future execution features (send a pass email, follow up on an intro, review a data room), what data/context would be needed?
- Is that data currently being captured through the intake funnel?
- What gaps would need to be filled before execution features could work?

**Integration surface area**
- What external systems would execution need to connect to (email, calendar, CRM, data rooms)?
- Are there already integration points that could be extended?
- What would break if you added execution features to the current architecture?

### Evaluation 6: Experience & Delight

Casper aims to be a cockpit you want to return to:

**Speed & responsiveness**
- Does the UI feel instant, or are there loading delays that break flow?
- Is navigation fast enough for rapid context-switching between portfolio/pipeline/personal?
- Can you get in, capture something, and get out in under 5 seconds?

**Information density**
- Is density calibrated right — enough to scan quickly without scrolling, not so much it overwhelms?
- Does the layout respect the VC workflow (fast scanning, batch processing, context at a glance)?
- Are different views optimized for different modes (quick capture vs. deep review vs. daily planning)?

**Emotional response**
- Does opening Casper reduce anxiety ("I've got this, nothing is falling through") or increase it ("look at everything I'm behind on")?
- Is there satisfaction in completing tasks, processing inbox, clearing the queue?
- Does it feel like a premium tool worthy of being your primary system?

---

## Output: Prioritized Action Plan

Save to `docs/product-review-<date>.md`:

### Executive Summary
3-5 sentences: Is Casper earning daily-driver trust across all of Harrison's contexts? What's the single biggest thing holding it back from "I can't work without this"?

### Daily Driver Scorecard
| Dimension | Rating | One-Liner |
|---|---|---|
| Morning: Do I open it first? | 🟢🟡🔴 | ... |
| Context switches: Does it help me shift gears? | 🟢🟡🔴 | ... |
| During day: Do I stay in it? | 🟢🟡🔴 | ... |
| End of day: Did it keep me honest? | 🟢🟡🔴 | ... |
| Trust: Single source of truth? | 🟢🟡🔴 | ... |
| Confidence: Nothing falling through cracks? | 🟢🟡🔴 | ... |

### Intake Funnel Scorecard
| Input Type | Capture Speed | Context Preserved | Cross-Linking | Retrieval | Action Conversion |
|---|---|---|---|---|---|
| Tasks (any context) | 🟢🟡🔴 | 🟢🟡🔴 | 🟢🟡🔴 | 🟢🟡🔴 | 🟢🟡🔴 |
| Emails | 🟢🟡🔴 | 🟢🟡🔴 | 🟢🟡🔴 | 🟢🟡🔴 | 🟢🟡🔴 |
| Reading/Links | 🟢🟡🔴 | 🟢🟡🔴 | 🟢🟡🔴 | 🟢🟡🔴 | 🟢🟡🔴 |
| Pipeline signals | 🟢🟡🔴 | 🟢🟡🔴 | 🟢🟡🔴 | 🟢🟡🔴 | 🟢🟡🔴 |
| Notes/quick thoughts | 🟢🟡🔴 | 🟢🟡🔴 | 🟢🟡🔴 | 🟢🟡🔴 | 🟢🟡🔴 |

### Intelligence Layer Scorecard
| Capability | Working? | Trusted? | Biggest Gap |
|---|---|---|---|
| Entity enrichment | 🟢🟡🔴 | 🟢🟡🔴 | ... |
| Prioritization / focus queue | 🟢🟡🔴 | 🟢🟡🔴 | ... |
| Contextual nudges | 🟢🟡🔴 | 🟢🟡🔴 | ... |
| Cross-domain linking | 🟢🟡🔴 | 🟢🟡🔴 | ... |

### Execution Readiness
| Future Capability | Data Ready? | Architecture Ready? | What's Missing |
|---|---|---|---|
| Send follow-up emails | 🟢🟡🔴 | 🟢🟡🔴 | ... |
| Follow up on intros | 🟢🟡🔴 | 🟢🟡🔴 | ... |
| Review data rooms | 🟢🟡🔴 | 🟢🟡🔴 | ... |
| Book reservations | 🟢🟡🔴 | 🟢🟡🔴 | ... |

### Critical Gaps (Blocking daily-driver trust)
Issues actively preventing Casper from being the canonical system across all contexts. Each with:
- What the gap is
- How it shows up in daily use (specific VC workflow scenario)
- Recommended fix
- Complexity: small / medium / large
- Phase: intake / enrichment / prioritization / foundation-for-execution

### High-Impact Opportunities (From "useful" to "indispensable")
Changes that would cross the line from "I use it" to "I genuinely cannot do my job without it." Same format.

### Quick Wins (Noticeable improvement, low effort)
Small changes that would improve the daily experience. Same format.

### Strategic Bets (Transformative if executed well)
Larger initiatives — new intelligence features, new functional areas, execution capabilities. With rationale and phasing recommendation.

### Goals Assessment
Compare current state against `docs/product-goals.md`:
- Which goals are closest to achieved?
- Which are furthest away?
- What's improved since last review?
- Updated priority order for the next development cycle
- Recommendation: Is it time to start building execution features, or does the funnel need more work first?
