# Email Surface Contract

## 1. Purpose

Email is an **inbound signal surface**.

Its job is to:
- Capture intent, context, and commitments arriving via email
- Present that information clearly for human judgment
- Enable graduation into first-class objects (tasks, obligations, pipeline, notes)
- Then get out of the way

Email is not where work is done. It is where work is *recognized*.

---

## 2. What Email Is Not

To prevent scope creep, Email is explicitly **not**:

- A task manager
- A CRM
- A notes system
- A long-term workspace
- A productivity dashboard

Email should never become the “place things live.”  
It is a **transient review surface** that feeds durable systems.

---

## 3. Core User Promise

> “If something important arrives by email, Casper will not lose it — and I can confidently clear it once I’ve applied judgment.”

Everything in this contract exists to uphold that promise.

---

## 4. Email Lifecycle

Every email moves through the following conceptual states:

1. **Ingested**
   - Received via the forward email system
   - Normalized and stored
   - Linked metadata extracted (sender, recipients, thread, timestamp)

2. **Reviewable**
   - Appears in Inbox and/or Triage
   - Ready for human judgment

3. **Reviewed**
   - User has read the email (explicitly or implicitly)
   - Optional actions may be taken

4. **Cleared**
   - User has applied judgment
   - Email leaves Triage / Inbox active views
   - Email remains searchable and linkable forever

5. **Archived**
   - Email is no longer active
   - Still fully accessible via search, linked entities, and history

An email may be cleared **with or without** actions taken.

---

## 5. Invariants

These rules must always hold true.

### 5.1 Judgment Invariant

Every email must require **explicit human judgment** before leaving Triage.

Judgment can take one of three forms:
- An action is taken
- The email is explicitly trusted as-is
- The email is explicitly dismissed as requiring no action

Emails must never silently disappear.

---

### 5.2 Action Safety Invariant

No action initiated from an email may:
- Auto-execute without confirmation
- Create hidden or implicit state
- Remove the email without user acknowledgment

All actions are **advisory until confirmed**.

---

### 5.3 Object Ownership Invariant

Email does not own long-lived work.

Any durable outcome must be represented as a first-class object:
- Task
- Obligation
- Pipeline entity
- Note
- Relationship / intro log

Email may link to these objects, but does not replace them.

---

### 5.4 UI Consistency Invariant

The Email Detail experience must be identical regardless of entry point:
- Inbox
- Triage
- Linked context (company, person, project)

There is exactly **one Email Detail Drawer** in the system.

---

## 6. Email Reading Experience

### 6.1 Dual-Layer Model

Email content is presented in two layers:

#### Layer 1: Extracted Summary (Primary)

Default visible layer focused on comprehension:
- One-sentence summary
- Key points (bulleted)
- Explicit “Next step” or “No action required” indicator

This layer exists to answer:

> “Do I need to do anything here?”

Most emails should be cleared from this layer alone.

---

#### Layer 2: Original Email (Secondary)

- Full raw email body
- HTML, signatures, links, formatting preserved
- Collapsible / deemphasized

This layer exists for verification, nuance, and edge cases.

---

## 7. Actions

### 7.1 Canonical Action Set

All email actions must map to a finite, documented set of primitives:

- Create Task
- Create Obligation
- Add Note
- Link to Existing Entity (company, person, project)
- Create Pipeline Company
- Log Intro
- Snooze
- Dismiss / Archive

No bespoke or one-off actions are allowed outside this set.

---

### 7.2 Action Interaction Rules

- Actions must resolve **within the email drawer context**
- Actions must never spawn hidden or obscured modals
- Every action requires explicit confirmation
- Success feedback must be visible and local

After an action:
- The email remains visible
- The user may continue reviewing
- The email becomes eligible for clearing

---

## 8. AI Suggested Actions

AI suggestions are:
- Advisory only
- Mapped 1:1 to canonical actions
- Previewable and editable
- Explicitly confirmable
- Explicitly dismissible

AI must never:
- Auto-create objects
- Auto-clear emails
- Block clearing if dismissed

Suggested actions exist to **reduce thinking**, not replace judgment.

---

## 9. Clearing Semantics

Clearing an email means:

> “I have reviewed this, and it is safe to leave the intake stream.”

Clearing:
- Removes the email from Triage / active Inbox views
- Does not delete the email
- Does not undo actions taken
- Is reversible (via search or history)

Clearing is a *positive*, intentional act.

---

## 10. Relationship to Triage

- Email is a surface
- Triage is a layer

When viewed in Triage:
- Email behaves identically
- Same drawer
- Same actions
- Same summaries

Triage only adds the invariant:

> Judgment must be applied before clearing.

---

## 11. Non-Goals (Explicit)

Email will not:
- Track task progress
- Replace CRM pipelines
- Become a notes database
- Accumulate long-term state
- Introduce surface-specific workflows

Those responsibilities belong elsewhere.

---

## 12. Success Criteria

The Email surface is “done” when:
- Most emails can be cleared in under 10 seconds
- Actions feel deliberate and visible
- Nothing important slips through
- Users trust clearing
- Inbox anxiety decreases rather than increases
