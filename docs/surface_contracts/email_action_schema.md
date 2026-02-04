# Email Action Schema

## Purpose

This document defines the **canonical set of actions** that may be taken from the Email surface, along with their required inputs, outputs, and side effects.

The goal is to:
- Keep email actions finite and predictable
- Ensure every action produces a durable, first-class object
- Eliminate ad-hoc or UI-specific behaviors
- Provide a stable contract for manual actions, AI suggestions, and Triage

No email action may exist outside this schema.

---

## Design Principles

1. **Finite actions**
   - All email actions must belong to a small, closed set.
   - New actions require explicit addition to this document.

2. **Explicit confirmation**
   - No action auto-executes.
   - All actions require user confirmation before creation or mutation.

3. **First-class outputs**
   - Actions must create or update durable system objects.
   - Email itself never becomes the primary record of work.

4. **Local resolution**
   - Actions must resolve visibly within the email drawer context.
   - No hidden modals or background execution.

---

## Canonical Email Actions

### 1. Create Task

**Intent**  
Convert email content into an actionable task.

**Required Inputs**
- Task title (string)

**Optional Inputs**
- Due date
- Priority
- Linked entity (company, project, person)
- Initial note (prefilled from email excerpt)

**Outputs**
- `task` record created
- Task linked back to email
- Task linked to selected entities

**Side Effects**
- Email remains visible
- Email becomes eligible for clearing

**Notes**
- Email attachments may optionally be attached to the task
- Task creation never auto-clears the email

---

### 2. Create Obligation

**Intent**  
Represent an external commitment or expectation implied by the email.

**Required Inputs**
- Obligation title
- Due date
- Counterparty (person or company)

**Optional Inputs**
- Category (payment, response, deliverable, renewal, etc.)
- Notes / context

**Outputs**
- `obligation` record created
- Obligation linked to email
- Obligation linked to counterparty

**Side Effects**
- Email remains visible
- Email becomes eligible for clearing

**Notes**
- Obligations are stricter than tasks
- Due date is mandatory before confirmation

---

### 3. Add Note

**Intent**  
Preserve context or commentary derived from the email.

**Required Inputs**
- Note content (prefilled from email, editable)

**Optional Inputs**
- Linked entities (company, project, person)

**Outputs**
- `note` record created
- Note linked to email and selected entities

**Side Effects**
- Email remains visible
- Email becomes eligible for clearing

**Notes**
- Notes do not imply follow-up or work
- Notes are informational, not actionable

---

### 4. Link to Existing Entity

**Intent**  
Associate the email with an existing object for future context.

**Required Inputs**
- Entity selection (company, person, project)

**Outputs**
- Link record created between email and entity

**Side Effects**
- Email remains visible
- Email becomes eligible for clearing

**Notes**
- No new objects are created
- This action may be repeated multiple times

---

### 5. Create Pipeline Company

**Intent**  
Turn an inbound email into a new pipeline opportunity.

**Required Inputs**
- Company name

**Optional Inputs**
- Website / domain
- Stage
- Notes / context

**Outputs**
- `pipeline_company` record created
- Email linked to pipeline company

**Side Effects**
- Email remains visible
- Email becomes eligible for clearing

**Notes**
- Enrichment may occur asynchronously after creation
- This action should feel lightweight and reversible

---

### 6. Log Intro

**Intent**  
Record an introduction or connection implied by the email.

**Required Inputs**
- Parties involved (people and/or companies)

**Optional Inputs**
- Notes
- Linked entities

**Outputs**
- `intro` or relationship log record created
- Email linked to intro record

**Side Effects**
- Email remains visible
- Email becomes eligible for clearing

**Notes**
- Logging an intro does not imply follow-up
- Follow-ups should be explicit via Create Task or Obligation

---

### 7. Snooze

**Intent**  
Defer judgment to a later time.

**Required Inputs**
- Snooze until date/time

**Outputs**
- Email state updated to snoozed
- Email removed from active Inbox/Triage views

**Side Effects**
- Email reappears automatically at the specified time

**Notes**
- Snoozing does not count as clearing
- Snoozed emails still require judgment when resurfaced

---

### 8. Dismiss / Archive

**Intent**  
Explicitly mark that no action is required.

**Required Inputs**
- None

**Outputs**
- Email marked as dismissed / archived

**Side Effects**
- Email removed from active Inbox/Triage views
- Email remains searchable and linked

**Notes**
- Dismissal is a valid form of judgment
- Dismissed emails should not generate reminders or actions

---

## AI Suggested Actions

AI may suggest **only** actions defined in this schema.

Each suggestion must include:
- Action type
- Rationale (plain language)
- Confidence indicator (low / medium / high)
- Editable preview of inputs

AI suggestions:
- Must be explicitly confirmed
- May be dismissed without penalty
- Must never auto-execute

---

## Clearing Rules

After **any** action:
- The email remains visible
- The user may take additional actions
- The email becomes eligible for clearing

Clearing:
- Is always explicit
- Is never implied by action execution
- Is reversible via search/history

---

## Prohibited Behaviors

Email actions must never:
- Create tasks or obligations implicitly
- Execute without user confirmation
- Spawn UI outside the email drawer context
- Clear or archive emails automatically
- Introduce surface-specific action variants

---

## Change Control

Any change to this schema requires:
- Updating this document
- Explicit review of UI and AI implications
- Backward compatibility consideration

This schema is a contract, not a suggestion.
