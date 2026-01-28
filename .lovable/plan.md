# Upgrade Inbox Suggestions to VC-Intent Aware Engine

## Status: IMPLEMENTED

**Completed:**
- Type definitions (`src/types/inboxSuggestions.ts`)
- Candidate company retrieval library (`src/lib/candidateCompanyRetrieval.ts`)
- Database migration (added intent, version, dismissed_ids, candidate_companies, updated_at)
- Edge function `inbox-suggest-v2` with OpenAI tool calling
- Frontend hook `useInboxSuggestionsV2`
- SuggestionCard component
- Updated InboxActionRail with V2 suggestions
- Documentation (`docs/inbox_suggestions_types.md`)

## Overview

Transform the current bullet-based task extractor into a structured, VC-domain-aware suggestion engine that:
- Classifies email intent (intro, follow-up, portfolio update, etc.)
- Produces typed suggestions with entity references
- Uses candidate retrieval to ensure LINK_COMPANY suggestions only reference real company IDs

## Architecture

```text
+------------------+     +----------------------+     +------------------+
| InboxActionRail  | --> | useInboxSuggestionsV2| --> | inbox-suggest-v2 |
| (UI Rendering)   |     | (Frontend Hook)      |     | (Edge Function)  |
+------------------+     +----------------------+     +------------------+
                                  |
                                  v
                         +------------------+
                         | Candidate        |
                         | Retrieval Lib    |
                         +------------------+
                                  |
                                  v
                    +---------------------------+
                    | companies + pipeline_co.  |
                    +---------------------------+
```

## Data Models

### Suggestion Types

| Type | Description | When to suggest |
|------|-------------|-----------------|
| `LINK_COMPANY` | Link this email to an existing company | Domain match or name mention found |
| `CREATE_PIPELINE_COMPANY` | Create new pipeline company | Intro/first touch with no strong match |
| `CREATE_FOLLOW_UP_TASK` | Follow-up task linked to company | Pipeline or portfolio follow-up email |
| `CREATE_PERSONAL_TASK` | Personal/one-off task (no company) | Self-sent reminders, scheduling |
| `CREATE_INTRO_TASK` | Task to make an intro | Request for intro emails |
| `SET_STATUS` | Update pipeline stage | Status change implied in email |
| `EXTRACT_UPDATE_HIGHLIGHTS` | Extract key metrics/updates | Portfolio update emails |

### Email Intent Categories

| Intent | Description |
|--------|-------------|
| `intro_first_touch` | First contact from a new company or intro request |
| `pipeline_follow_up` | Ongoing deal discussion |
| `portfolio_update` | Company update from portfolio co |
| `intro_request` | Someone asking for an intro |
| `scheduling` | Meeting scheduling |
| `personal_todo` | Self-sent or personal reminder |
| `fyi_informational` | No action needed |

### Candidate Company Structure

```typescript
interface CandidateCompany {
  id: string;
  name: string;
  type: "portfolio" | "pipeline";
  primary_domain: string | null;
  match_score: number;
  match_reason: "domain" | "name_mention" | "prior_link" | "sender_history";
}
```

### Structured Suggestion

```typescript
interface StructuredSuggestion {
  id: string;
  type: SuggestionType;
  title: string;
  confidence: "low" | "medium" | "high";
  effort_bucket: "quick" | "medium" | "long";
  effort_minutes: number;
  rationale: string;
  company_id?: string | null;      // Only from candidate_companies
  company_name?: string | null;
  company_type?: "portfolio" | "pipeline";
  due_hint?: string | null;
  metadata?: Record<string, unknown>;  // For EXTRACT_UPDATE_HIGHLIGHTS etc.
}
```

## Implementation Steps

### Step 1: Candidate Retrieval Library

Create `src/lib/candidateCompanyRetrieval.ts`:

**Matching Strategies (in order of score):**

1. **Domain Match (score: 100)** - Extract domain from sender email, match against `primary_domain` in both `companies` and `pipeline_companies`

2. **Name Mention (score: 75)** - Search for company names from both tables appearing in subject or first 500 chars of body. Use Fuse.js for fuzzy matching.

3. **Prior Link (score: 90)** - Check if this sender email has been previously linked to a company via `related_company_id` on past inbox items

4. **Sender History (score: 50)** - Check if any email from this sender domain has been linked to a company before

**Output:** Top 8 candidates with score and match reason

### Step 2: Database Schema Updates

**Modify `inbox_suggestions` table:**

Add columns via migration:
- `intent` (text, nullable) - Classified email intent
- `version` (integer, default 1) - Schema version for future migrations
- `dismissed_ids` (jsonb, default []) - IDs of dismissed suggestions
- `candidate_companies` (jsonb, nullable) - Cached candidates used for generation
- `updated_at` (timestamptz, default now()) - For cache validation

Add index on `(inbox_item_id, updated_at)` for cache lookups.

### Step 3: Edge Function inbox-suggest-v2

**File:** `supabase/functions/inbox-suggest-v2/index.ts`

**Flow:**

1. Validate auth, get user ID
2. Check cache: if `inbox_suggestions` row exists with `updated_at` within 1 hour and `force !== true`, return cached
3. Fetch inbox item (subject, text_body, from_email, from_name)
4. Fetch candidate companies from both tables (portfolio + pipeline)
5. Run domain/name matching on candidates
6. Build OpenAI prompt with:
   - System prompt defining intents and suggestion types
   - User message with email content + candidate company list (IDs + names only)
7. Parse response using tool calling for strict schema
8. Validate all `company_id` references exist in candidates
9. Upsert to `inbox_suggestions` with full structured data
10. Return suggestions

**OpenAI Prompt Structure:**

System prompt defines:
- VC context (investor managing deal flow)
- Intent classification rules
- Suggestion type rules
- Quality rules (e.g., portfolio updates get EXTRACT_UPDATE_HIGHLIGHTS, not task lists)

Tool schema enforces:
- `intent` must be one of defined enum values
- `suggestions[].type` must be one of defined enum values
- `suggestions[].company_id` must be string or null (validated post-hoc against candidates)

### Step 4: Frontend Hook Update

**File:** `src/hooks/useInboxSuggestionsV2.ts`

Changes from current hook:
- Call `inbox-suggest-v2` instead of `inbox-suggest`
- Parse structured suggestions with new type
- Provide `generateSuggestions(force?: boolean)` for regeneration
- Expose `dismissSuggestion(id)` - updates local state and persists to `dismissed_ids`
- Expose `intent` classification for UI display
- Handle candidate companies for display

### Step 5: UI Updates

**File:** `src/components/inbox/InboxActionRail.tsx`

**Suggestion Card Redesign:**

```text
+--------------------------------------------------+
| [Type Badge]  [Confidence: high]                 |
| Title of the suggestion goes here                |
| Effort: ~15 min  |  Due: tomorrow                |
| ------------------------------------------------ |
| "Rationale text in muted color"                  |
| ------------------------------------------------ |
| [  Approve  ]  [Edit]  [Dismiss]                 |
+--------------------------------------------------+
```

**Type-specific styling:**
- `LINK_COMPANY`: Building2 icon, blue accent
- `CREATE_PIPELINE_COMPANY`: PlusCircle icon, violet accent
- `CREATE_FOLLOW_UP_TASK`: ArrowRight icon, amber accent
- `CREATE_PERSONAL_TASK`: ListTodo icon, slate accent
- `CREATE_INTRO_TASK`: Users icon, emerald accent
- `SET_STATUS`: Flag icon, orange accent
- `EXTRACT_UPDATE_HIGHLIGHTS`: Sparkles icon, sky accent

**Generate Button:**
- Always visible at bottom of suggestions section
- Shows "Generate with AI" or "Regenerate" based on state
- Loading state with spinner

**Intent Badge:**
- Small badge above suggestions showing classified intent
- Helps user understand context

### Step 6: Type Definitions

**File:** `src/types/inboxSuggestions.ts`

```typescript
export type EmailIntent = 
  | "intro_first_touch"
  | "pipeline_follow_up"
  | "portfolio_update"
  | "intro_request"
  | "scheduling"
  | "personal_todo"
  | "fyi_informational";

export type SuggestionType =
  | "LINK_COMPANY"
  | "CREATE_PIPELINE_COMPANY"
  | "CREATE_FOLLOW_UP_TASK"
  | "CREATE_PERSONAL_TASK"
  | "CREATE_INTRO_TASK"
  | "SET_STATUS"
  | "EXTRACT_UPDATE_HIGHLIGHTS";

export interface StructuredSuggestion {
  id: string;
  type: SuggestionType;
  title: string;
  confidence: "low" | "medium" | "high";
  effort_bucket: "quick" | "medium" | "long";
  effort_minutes: number;
  rationale: string;
  company_id?: string | null;
  company_name?: string | null;
  company_type?: "portfolio" | "pipeline";
  due_hint?: string | null;
  metadata?: Record<string, unknown>;
  is_dismissed?: boolean;
}

export interface CandidateCompany {
  id: string;
  name: string;
  type: "portfolio" | "pipeline";
  primary_domain: string | null;
  match_score: number;
  match_reason: "domain" | "name_mention" | "prior_link" | "sender_history";
}

export interface InboxSuggestionsResponse {
  intent: EmailIntent;
  intent_confidence: "low" | "medium" | "high";
  asks: string[];       // Extracted asks from email
  entities: string[];   // Mentioned entities (people, companies)
  suggestions: StructuredSuggestion[];
  candidate_companies: CandidateCompany[];
  generated_at: string;
}
```

## Quality Rules (in Edge Function prompt)

1. **Portfolio Updates:**
   - Suggest `LINK_COMPANY` if not already linked
   - Suggest `EXTRACT_UPDATE_HIGHLIGHTS` to capture metrics
   - Do NOT create tasks for each metric mentioned

2. **Intro/First Touch:**
   - If strong company match exists: suggest `LINK_COMPANY`
   - If no match: suggest `CREATE_PIPELINE_COMPANY`
   - One follow-up task at most

3. **Pipeline Follow-ups:**
   - Suggest single `CREATE_FOLLOW_UP_TASK` with context in notes
   - Optionally suggest `SET_STATUS` if status change implied

4. **Intro Requests:**
   - Suggest `CREATE_INTRO_TASK`
   - Link to relevant company if mentioned

5. **Personal/Self-sent:**
   - Suggest `CREATE_PERSONAL_TASK` with cleaned title
   - No company linking

6. **FYI/Informational:**
   - Return empty suggestions or just `LINK_COMPANY` if relevant

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/types/inboxSuggestions.ts` | Create - New type definitions |
| `src/lib/candidateCompanyRetrieval.ts` | Create - Client-side candidate retrieval |
| `supabase/functions/inbox-suggest-v2/index.ts` | Create - New edge function |
| `supabase/config.toml` | Modify - Add inbox-suggest-v2 function |
| `src/hooks/useInboxSuggestionsV2.ts` | Create - New hook with structured suggestions |
| `src/components/inbox/InboxActionRail.tsx` | Modify - New suggestion card UI |
| `src/components/inbox/SuggestionCard.tsx` | Create - Reusable suggestion card component |
| Migration for inbox_suggestions schema | Create - Add new columns |
| `docs/inbox_suggestions_types.md` | Create - README snippet |

## Migration SQL

```sql
-- Add new columns to inbox_suggestions
ALTER TABLE inbox_suggestions
ADD COLUMN IF NOT EXISTS intent text,
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS dismissed_ids jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS candidate_companies jsonb,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add index for cache validation
CREATE INDEX IF NOT EXISTS idx_inbox_suggestions_cache 
ON inbox_suggestions (inbox_item_id, updated_at DESC);

-- Update RLS to allow update for dismissed_ids
-- (Already has update policy, no change needed)
```

## Edge Function Pseudocode

```typescript
// inbox-suggest-v2/index.ts

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

serve(async (req) => {
  // 1. Auth validation
  // 2. Parse request body { inbox_item_id, force?: boolean }
  
  // 3. Check cache
  const cached = await getCachedSuggestions(inbox_item_id);
  if (cached && !force && Date.now() - cached.updated_at < CACHE_TTL_MS) {
    return Response.json(cached);
  }
  
  // 4. Fetch inbox item
  const item = await fetchInboxItem(inbox_item_id);
  
  // 5. Fetch candidate companies (both portfolio + pipeline)
  const candidates = await fetchCandidateCompanies(userId, item);
  
  // 6. Build and call OpenAI with tool calling
  const response = await callOpenAI(item, candidates);
  
  // 7. Validate company_id references
  const validated = validateCompanyReferences(response, candidates);
  
  // 8. Persist to database
  await upsertSuggestions(inbox_item_id, validated, candidates);
  
  // 9. Return response
  return Response.json(validated);
});
```

## Testing Scenarios

| Email Type | Expected Intent | Expected Suggestions |
|------------|-----------------|---------------------|
| Cold intro from new startup | `intro_first_touch` | CREATE_PIPELINE_COMPANY, CREATE_FOLLOW_UP_TASK |
| Reply from pipeline company | `pipeline_follow_up` | LINK_COMPANY (if not linked), CREATE_FOLLOW_UP_TASK |
| Quarterly update from portfolio | `portfolio_update` | LINK_COMPANY, EXTRACT_UPDATE_HIGHLIGHTS |
| "Can you intro me to X?" | `intro_request` | CREATE_INTRO_TASK, possibly LINK_COMPANY |
| Self-sent "call dentist" | `personal_todo` | CREATE_PERSONAL_TASK |
| Newsletter / FYI email | `fyi_informational` | Empty or LINK_COMPANY only |

