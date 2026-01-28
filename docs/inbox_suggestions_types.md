# Inbox Suggestions V2 - VC-Intent Aware Engine

This document describes the structured suggestion types and when they appear.

## Email Intent Classification

| Intent | Description | Example |
|--------|-------------|---------|
| `intro_first_touch` | First contact from a new company or intro request | Cold email from a startup founder |
| `pipeline_follow_up` | Ongoing deal discussion with a pipeline company | Reply about term sheet |
| `portfolio_update` | Company update from a portfolio company | Quarterly metrics email |
| `intro_request` | Someone asking you to make an intro | "Can you intro me to X?" |
| `scheduling` | Meeting scheduling logistics | Calendar invites, time coordination |
| `personal_todo` | Self-sent reminder or personal task | Reminder you sent yourself |
| `fyi_informational` | Informational email, no action required | Newsletter, announcement |

## Suggestion Types

### LINK_COMPANY
**When:** Domain match or name mention found for an existing company  
**Action:** Link the inbox item to the matched company  
**Entity Required:** Yes - uses `company_id` from candidate_companies

### CREATE_PIPELINE_COMPANY
**When:** Intro/first touch email with no strong existing company match  
**Action:** Create a new pipeline company from this email  
**Entity Required:** No - creates new company from email metadata

### CREATE_FOLLOW_UP_TASK
**When:** Pipeline or portfolio follow-up requiring action  
**Action:** Create a task linked to the relevant company  
**Entity Required:** Optional - can link to company if matched

### CREATE_PERSONAL_TASK
**When:** Self-sent reminders, scheduling, personal one-offs  
**Action:** Create a personal task (no company link)  
**Entity Required:** No

### CREATE_INTRO_TASK
**When:** Request for an introduction to someone  
**Action:** Create an intro task with the relevant parties  
**Entity Required:** Optional - can link to requesting company

### SET_STATUS
**When:** Email implies a status change (e.g., "we're passing", "moving to diligence")  
**Action:** Update pipeline stage for the company  
**Entity Required:** Yes - requires matched pipeline company

### EXTRACT_UPDATE_HIGHLIGHTS
**When:** Portfolio update emails with metrics or milestones  
**Action:** Extract and store key updates from the email  
**Entity Required:** Yes - requires matched portfolio company

## Quality Rules

1. **Portfolio Updates:** Suggest LINK_COMPANY + EXTRACT_UPDATE_HIGHLIGHTS, NOT individual metric tasks
2. **Intro/First Touch:** Suggest CREATE_PIPELINE_COMPANY if no strong match exists
3. **Pipeline Follow-ups:** Suggest single CREATE_FOLLOW_UP_TASK with context
4. **Personal/Self-sent:** Suggest CREATE_PERSONAL_TASK with cleaned title
5. **FYI/Informational:** Return minimal or no suggestions

## Candidate Company Retrieval

Before generating suggestions, the system retrieves up to 8 candidate companies using:

1. **Domain Match (score: 100)** - Sender email domain matches company's primary_domain
2. **Prior Link (score: 90)** - This exact sender was previously linked to a company
3. **Name Mention (score: 75)** - Company name appears in subject/body
4. **Sender History (score: 50)** - Other emails from this domain linked to a company

All `LINK_COMPANY` suggestions must reference a `company_id` from this candidate list to prevent hallucinated company references.
