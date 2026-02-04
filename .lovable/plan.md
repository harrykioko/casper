
# Smart "Create New Pipeline Company" Suggestions from Email

## Overview

Upgrade the email drawer to intelligently detect intro/follow-up emails and suggest creating a new pipeline company when no match exists. This involves enhancing the pipeline company draft builder, improving the inline form with progressive disclosure, and adding smarter domain inference.

---

## Current State Analysis

The system already has:
- `CREATE_PIPELINE_COMPANY` as a suggestion type in `inbox-suggest-v2`
- `CreatePipelineCompanyMetadata` interface for AI-extracted prefills
- `InlineCreatePipelineForm` component that accepts prefill data
- `candidateCompanyRetrieval.ts` for company matching
- Domain matching utilities in `src/lib/domainMatching.ts`

What needs improvement:
- Frontend-side intro/follow-up signal detection (backup if AI misses)
- Dedicated `PipelineCompanyDraft` type for structured prefills with confidence
- Generic domain exclusion for domain inference
- Progressive disclosure in the create form
- Manual "Add to Pipeline" button prefills with smart defaults

---

## Phase 1: Types and Draft Schema

### 1.1 Add PipelineCompanyDraft Type

**File: `src/types/emailActionDrafts.ts`**

Add a new draft type for pipeline company creation:

```typescript
export interface PipelineCompanyDraft {
  companyName: string;
  companyNameConfidence?: ConfidenceLevel;
  domain?: string | null;
  domainConfidence?: ConfidenceLevel;
  website?: string | null;
  contacts: Array<{
    name: string;
    email: string;
    role?: string;
    confidence?: ConfidenceLevel;
  }>;
  contextSummary?: string;
  keyPoints?: string[];
  introSource?: string;
  suggestedStage?: string;
  suggestedTags?: string[];
  reason: string;
  sourceEmailId: string;
  confidence: {
    isIntroOrFollowup: number;
    companyMatch: number;
    domainInferred: number;
  };
}
```

---

## Phase 2: Domain Inference and Detection Utilities

### 2.1 Create Pipeline Draft Builder

**New File: `src/lib/inbox/buildPipelineDraft.ts`**

This utility builds a `PipelineCompanyDraft` from email data with smart inference:

```typescript
import { getDomainFromEmail } from "@/lib/domainMatching";
import type { InboxItem } from "@/types/inbox";
import type { StructuredSuggestion, CreatePipelineCompanyMetadata } from "@/types/inboxSuggestions";
import type { PipelineCompanyDraft, ConfidenceLevel } from "@/types/emailActionDrafts";
import { buildTaskNoteFromEmail } from "./buildTaskNote";

const GENERIC_DOMAINS = new Set([
  "gmail.com", "googlemail.com",
  "yahoo.com", "ymail.com",
  "outlook.com", "hotmail.com", "live.com", "msn.com",
  "icloud.com", "me.com", "mac.com",
  "aol.com",
  "protonmail.com", "proton.me",
  "zoho.com", "mail.com", "fastmail.com",
]);

function isGenericDomain(domain: string): boolean {
  return GENERIC_DOMAINS.has(domain.toLowerCase());
}

// Strong signals for intro/follow-up detection
const INTRO_SUBJECT_PATTERNS = [
  /intro(?:duction)?/i,
  /connect(?:ing)?/i,
  /meet(?:ing)?/i,
  /follow(?:ing)?\s*up/i,
  /circling\s*back/i,
  /warm\s*intro/i,
];

const SCHEDULING_BODY_PATTERNS = [
  /\b(demo|walkthrough|quick\s+call|availability|calendar)\b/i,
  /\b(schedule|meeting|book\s+a\s+time)\b/i,
];

export function detectIntroSignals(item: InboxItem): {
  isLikelyIntro: boolean;
  signals: string[];
  confidence: number;
} {
  const signals: string[] = [];
  const subject = item.displaySubject || item.subject || "";
  const body = item.cleanedText || item.displaySnippet || "";
  
  // Subject pattern matching
  for (const pattern of INTRO_SUBJECT_PATTERNS) {
    if (pattern.test(subject)) {
      signals.push(`Subject contains intro/connect language`);
      break;
    }
  }
  
  // Body scheduling language
  for (const pattern of SCHEDULING_BODY_PATTERNS) {
    if (pattern.test(body)) {
      signals.push(`Body contains scheduling language`);
      break;
    }
  }
  
  // Extracted categories
  const categories = item.extractedCategories || [];
  if (categories.some(c => ["intro", "follow_up", "scheduling"].includes(c))) {
    signals.push(`AI categorized as intro/follow-up/scheduling`);
  }
  
  // Has extracted entities (company/product)
  const entities = item.extractedEntities || [];
  if (entities.some(e => ["company", "product", "organization"].includes(e.type))) {
    signals.push(`Contains company/product entity`);
  }
  
  // Non-generic sender domain
  const senderDomain = getDomainFromEmail(item.senderEmail);
  if (senderDomain && !isGenericDomain(senderDomain)) {
    signals.push(`Professional sender domain`);
  }
  
  const confidence = Math.min(signals.length / 3, 1);
  
  return {
    isLikelyIntro: signals.length >= 2,
    signals,
    confidence,
  };
}

export function inferDomainFromEmail(item: InboxItem): {
  domain: string | null;
  source: "sender" | "body_url" | "entity" | null;
  confidence: number;
} {
  // 1. Try sender email domain (if not generic)
  const senderDomain = getDomainFromEmail(item.senderEmail);
  if (senderDomain && !isGenericDomain(senderDomain)) {
    return { domain: senderDomain, source: "sender", confidence: 0.9 };
  }
  
  // 2. Try extracting from body URLs
  const body = item.cleanedText || item.body || "";
  const urlMatch = body.match(/https?:\/\/([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (urlMatch) {
    const extractedDomain = urlMatch[1].replace(/^www\./, "");
    if (!isGenericDomain(extractedDomain)) {
      return { domain: extractedDomain, source: "body_url", confidence: 0.7 };
    }
  }
  
  return { domain: null, source: null, confidence: 0 };
}

export function inferCompanyName(item: InboxItem): {
  name: string;
  source: "entity" | "sender" | "domain" | null;
  confidence: ConfidenceLevel;
} {
  // 1. From extracted entities
  const entities = item.extractedEntities || [];
  const companyEntity = entities.find(e => 
    ["company", "organization", "product"].includes(e.type) && e.confidence > 0.6
  );
  if (companyEntity) {
    return { name: companyEntity.name, source: "entity", confidence: "suggested" };
  }
  
  // 2. From sender name (if professional format)
  if (item.senderName) {
    // Check if sender name might be a company (has Inc, Ltd, etc.)
    if (/\b(inc|ltd|llc|corp|co)\b/i.test(item.senderName)) {
      return { name: item.senderName, source: "sender", confidence: "suggested" };
    }
  }
  
  // 3. Derive from inferred domain
  const domainInfo = inferDomainFromEmail(item);
  if (domainInfo.domain) {
    // Capitalize domain root as company name guess
    const domainRoot = domainInfo.domain.split(".")[0];
    const guessedName = domainRoot.charAt(0).toUpperCase() + domainRoot.slice(1);
    return { name: guessedName, source: "domain", confidence: "suggested" };
  }
  
  return { name: "", source: null, confidence: "suggested" };
}

export function inferStageFromContext(item: InboxItem): string | null {
  const subject = (item.displaySubject || item.subject || "").toLowerCase();
  const body = (item.cleanedText || "").toLowerCase();
  const combined = subject + " " + body;
  
  if (/\b(intro|introduction|connect|first\s+meeting)\b/.test(combined)) {
    return "new";
  }
  if (/\b(demo|deep\s+dive|schedule|walkthrough)\b/.test(combined)) {
    return "in_progress";
  }
  return null;
}

/**
 * Build a PipelineCompanyDraft from AI suggestion
 */
export function buildPipelineDraftFromSuggestion(
  item: InboxItem,
  suggestion: StructuredSuggestion
): PipelineCompanyDraft {
  const metadata = suggestion.metadata as unknown as CreatePipelineCompanyMetadata | undefined;
  const domainInfo = inferDomainFromEmail(item);
  
  return {
    companyName: metadata?.extracted_company_name || "",
    companyNameConfidence: "suggested",
    domain: metadata?.extracted_domain || domainInfo.domain,
    domainConfidence: metadata?.extracted_domain ? "suggested" : domainInfo.source ? "suggested" : undefined,
    website: metadata?.extracted_domain ? `https://${metadata.extracted_domain}` : 
             domainInfo.domain ? `https://${domainInfo.domain}` : undefined,
    contacts: metadata?.primary_contact_name ? [{
      name: metadata.primary_contact_name,
      email: metadata.primary_contact_email || item.senderEmail,
      confidence: "suggested",
    }] : [{
      name: item.senderName || "",
      email: item.senderEmail,
      confidence: "suggested",
    }],
    contextSummary: metadata?.notes_summary || buildTaskNoteFromEmail(item),
    keyPoints: item.extractedKeyPoints?.slice(0, 3) || [],
    introSource: metadata?.intro_source || `Email from ${item.senderName || item.senderEmail}`,
    suggestedStage: inferStageFromContext(item) || undefined,
    suggestedTags: metadata?.suggested_tags || [],
    reason: suggestion.rationale,
    sourceEmailId: item.id,
    confidence: {
      isIntroOrFollowup: suggestion.confidence === "high" ? 0.9 : suggestion.confidence === "medium" ? 0.7 : 0.5,
      companyMatch: 0,
      domainInferred: domainInfo.confidence,
    },
  };
}

/**
 * Build a PipelineCompanyDraft for manual creation (no AI suggestion)
 */
export function buildManualPipelineDraft(item: InboxItem): PipelineCompanyDraft {
  const domainInfo = inferDomainFromEmail(item);
  const nameInfo = inferCompanyName(item);
  const introSignals = detectIntroSignals(item);
  
  return {
    companyName: nameInfo.name,
    companyNameConfidence: nameInfo.confidence,
    domain: domainInfo.domain,
    domainConfidence: domainInfo.source ? "suggested" : undefined,
    website: domainInfo.domain ? `https://${domainInfo.domain}` : undefined,
    contacts: [{
      name: item.senderName || "",
      email: item.senderEmail,
      confidence: "suggested",
    }],
    contextSummary: buildTaskNoteFromEmail(item),
    keyPoints: item.extractedKeyPoints?.slice(0, 3) || [],
    introSource: `Email from ${item.senderName || item.senderEmail}`,
    suggestedStage: inferStageFromContext(item) || undefined,
    suggestedTags: [],
    reason: introSignals.signals.length > 0 
      ? `Detected signals: ${introSignals.signals.join(", ")}`
      : "Manual pipeline company creation from email",
    sourceEmailId: item.id,
    confidence: {
      isIntroOrFollowup: introSignals.confidence,
      companyMatch: 0,
      domainInferred: domainInfo.confidence,
    },
  };
}
```

### 2.2 Export from index

**File: `src/lib/inbox/index.ts`**

Add export for new builder:

```typescript
export * from "./buildPipelineDraft";
```

---

## Phase 3: Redesign Inline Pipeline Form

### 3.1 Progressive Disclosure UI

**File: `src/components/inbox/inline-actions/InlineCreatePipelineForm.tsx`**

Redesign to use progressive disclosure with suggestion chips:

Key changes:
1. Accept `PipelineCompanyDraft` as optional prefill
2. Show core fields by default (name, domain, primary contact)
3. Show suggested fields as editable chips
4. "More details" expands stage, sector, additional contacts, tags
5. Pre-populated notes from context summary

```text
+-----------------------------------------------+
| [Plus] Add to Pipeline                        |
+-----------------------------------------------+
| "AI rationale: Warm intro from John Smith..." |
+-----------------------------------------------+
| Company: [Acme Inc                          ] |
|                                               |
| [Domain: acme.com (Suggested)]                |
| [Stage: Seed (Suggested)]                     |
|                                               |
| Primary Contact                               |
| Name:  [Jane Doe             ]                |
| Email: [jane@acme.com        ]                |
|                                               |
| Context                                       |
| [AI-generated summary from email...       ]   |
|                                               |
| [+ More details]                              |
|                                               |
| [Cancel]              [Add to Pipeline]       |
+-----------------------------------------------+
```

**Expanded state** shows:
- Sector dropdown
- Additional contacts (if extracted)
- Tags input

### 3.2 Suggestion Chips for Pipeline Form

Reuse the chip pattern from `InlineTaskForm`:

```typescript
interface PipelineChipProps {
  label: string;
  value: string;
  confidence?: ConfidenceLevel;
  onEdit: () => void;
  onClear: () => void;
}
```

Chips for:
- Domain (with popover to edit)
- Stage (with dropdown)
- Tags (if suggested)

---

## Phase 4: Wire Suggestion Selection

### 4.1 Update InlineActionPanel

**File: `src/components/inbox/InlineActionPanel.tsx`**

Update `handleSuggestionSelect` for `CREATE_PIPELINE_COMPANY`:

```typescript
case "CREATE_PIPELINE_COMPANY": {
  const pipelineDraft = buildPipelineDraftFromSuggestion(item, suggestion);
  setActiveAction("create_pipeline");
  setPrefillData({
    ...pipelineDraft,
    rationale: suggestion.rationale,
    confidence: suggestion.confidence,
  });
  break;
}
```

### 4.2 Update Manual Button Click

When user clicks "Add to Pipeline" button manually, build draft with smart defaults:

```typescript
const handleSelectAction = (action: ActionType) => {
  setActiveAction(action);
  setSuccessResult(null);
  setActiveSuggestion(null);
  
  // Pre-populate with smart defaults for pipeline creation
  if (action === "create_pipeline") {
    const draft = buildManualPipelineDraft(item);
    setPrefillData(draft);
  } else {
    setPrefillData({});
  }
};
```

---

## Phase 5: Update Form Props and Integration

### 5.1 Update InlineCreatePipelineForm Props

**File: `src/components/inbox/inline-actions/InlineCreatePipelineForm.tsx`**

Update props to accept the new draft type:

```typescript
interface InlineCreatePipelineFormProps {
  emailItem: InboxItem;
  prefill?: Partial<PipelineCompanyDraft> & {
    rationale?: string;
    confidence?: string;
  };
  suggestion?: StructuredSuggestion | null;
  onConfirm: (data: PipelineFormData) => Promise<void>;
  onCancel: () => void;
}
```

Update initialization to use draft data:

```typescript
const [companyName, setCompanyName] = useState(prefill?.companyName || "");
const [domain, setDomain] = useState(prefill?.domain || "");
const [stage, setStage] = useState<RoundEnum>(
  (prefill?.suggestedStage as RoundEnum) || "Seed"
);
const [contactName, setContactName] = useState(
  prefill?.contacts?.[0]?.name || emailItem.senderName || ""
);
const [contactEmail, setContactEmail] = useState(
  prefill?.contacts?.[0]?.email || emailItem.senderEmail || ""
);
const [notes, setNotes] = useState(prefill?.contextSummary || "");
const [showMoreDetails, setShowMoreDetails] = useState(false);
```

---

## Files Changed Summary

| File | Action | Description |
|------|--------|-------------|
| `src/types/emailActionDrafts.ts` | Modify | Add `PipelineCompanyDraft` interface |
| `src/lib/inbox/buildPipelineDraft.ts` | Create | Draft builder with domain inference, signal detection |
| `src/lib/inbox/index.ts` | Modify | Export new builder |
| `src/components/inbox/inline-actions/InlineCreatePipelineForm.tsx` | Modify | Progressive disclosure, chip UI, accept draft |
| `src/components/inbox/InlineActionPanel.tsx` | Modify | Use draft builders for suggestion and manual flows |

---

## Technical Notes

- **Generic Domain List**: Reuses pattern from `useEnsureWorkItem.ts` and `calendarParsing.ts`
- **No Backend Changes**: All detection and inference happens client-side; the edge function already extracts metadata
- **Progressive Disclosure**: Core fields always visible; advanced fields expandable
- **Confidence Indicators**: Chips show "(Suggested)" when auto-filled
- **Form State**: Prefill from draft but allow full user editing
- **After Creation**: Email is linked to new company via existing `handleConfirmCreatePipeline`

---

## Success Criteria

1. For intro/follow-up emails where no pipeline company matches, clicking "Add to Pipeline" shows a pre-filled form with:
   - Company name (from entities or domain)
   - Domain (from sender email if professional)
   - Primary contact (from sender)
   - Context notes (from AI summary)

2. AI suggestions for `CREATE_PIPELINE_COMPANY` appear with full metadata and open the same form

3. Users can edit suggested values quickly via chips without seeing empty dropdowns

4. Created pipeline companies are linked to the source email

5. All flows remain inline within the email drawer with explicit confirmation
