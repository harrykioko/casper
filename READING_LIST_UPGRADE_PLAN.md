# Reading List Curation — Implementation Plan

## Overview

Upgrade Reading from a flat link dump into a curated library. Focus is the intake/triage surface; the Reading page becomes a browsable, sectioned bookshelf.

**Three phases:**
- Phase 1: Schema + triage actions + Reading page redesign
- Phase 2: AI enrichment + topics + semantic search
- Phase 3: Batch triage + extract-to-note + drag-reorder + fuzzy dedup

---

## Phase 1: Core Schema, Focus Triage & Reading Page Redesign

### 1.1 Schema Migration — `reading_items` Table

Add the following columns to the existing `reading_items` table:

```sql
-- Processing lifecycle
ALTER TABLE reading_items
  ADD COLUMN processing_status text NOT NULL DEFAULT 'unprocessed'
    CHECK (processing_status IN ('unprocessed','queued','up_next','signal','read','archived')),
  ADD COLUMN processed_at timestamptz,
  ADD COLUMN archived_at timestamptz,

-- Classification
  ADD COLUMN content_type text
    CHECK (content_type IN ('x_post','article','blog_post','newsletter','tool')),
  ADD COLUMN priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high')),
  ADD COLUMN read_later_bucket text
    CHECK (read_later_bucket IN ('today','this_week','someday')),

-- Enrichment (Phase 2 columns added now to avoid future migration)
  ADD COLUMN one_liner text,
  ADD COLUMN topics text[] DEFAULT '{}',
  ADD COLUMN actionability text NOT NULL DEFAULT 'none'
    CHECK (actionability IN ('none','idea','follow_up','diligence')),
  ADD COLUMN saved_from text
    CHECK (saved_from IN ('x','email','web','manual','other')),
  ADD COLUMN entities jsonb DEFAULT '[]';
```

**Indexes:**

```sql
CREATE INDEX idx_reading_items_status ON reading_items (created_by, processing_status);
CREATE INDEX idx_reading_items_bucket ON reading_items (created_by, read_later_bucket);
CREATE INDEX idx_reading_items_content_type ON reading_items (created_by, content_type);
CREATE INDEX idx_reading_items_topics ON reading_items USING GIN (topics);
```

**RLS:** Follows existing pattern — owner-only via `created_by = auth.uid()`.

### 1.2 Data Migration — Existing Items

Run once after schema migration:

```sql
UPDATE reading_items SET
  processing_status = CASE
    WHEN is_archived = true THEN 'archived'
    WHEN is_read = true THEN 'read'
    WHEN is_flagged = true THEN 'up_next'
    ELSE 'queued'
  END,
  processed_at = CASE
    WHEN is_archived = true OR is_read = true OR is_flagged = true THEN now()
    ELSE null
  END,
  archived_at = CASE
    WHEN is_archived = true THEN now()
    ELSE null
  END;
```

All existing items map to curated states (no Focus flood). Only new items default to `unprocessed`.

### 1.3 Deterministic Content Type Classification

**File:** `src/utils/readingContentClassifier.ts` (new)

Runs on item creation (in `useReadingItems.createReadingItem`) and on metadata update:

```typescript
export function classifyContentType(url: string, hostname: string | null, title: string | null): string {
  const host = (hostname || '').toLowerCase();
  const path = new URL(url).pathname.toLowerCase();

  // X/Twitter
  if (host.includes('x.com') || host.includes('twitter.com')) return 'x_post';

  // Newsletters
  const newsletterHosts = ['substack.com', 'beehiiv.com', 'buttondown.email', 'mailchi.mp', 'convertkit.com'];
  if (newsletterHosts.some(h => host.includes(h))) return 'newsletter';

  // Blog patterns
  if (path.includes('/blog') || path.includes('/posts/') || host.startsWith('blog.')) return 'blog_post';

  // Tool/product patterns
  const toolIndicators = ['/pricing', '/docs', '/features', '/changelog'];
  if (toolIndicators.some(t => path.includes(t))) return 'tool';

  // Default
  return 'article';
}
```

Also infers `saved_from`:

```typescript
export function inferSavedFrom(url: string, hostname: string | null): string {
  const host = (hostname || '').toLowerCase();
  if (host.includes('x.com') || host.includes('twitter.com')) return 'x';
  if (host.includes('mail.google.com') || host.includes('outlook.')) return 'email';
  return 'web';
}
```

### 1.4 Duplicate Detection — Exact URL Match

**Where:** `useReadingItems.createReadingItem` and `useAddLinkForm`

Before inserting, query:

```typescript
const { data: existing } = await supabase
  .from('reading_items')
  .select('id, title, processing_status')
  .eq('created_by', userId)
  .eq('url', normalizedUrl)
  .maybeSingle();

if (existing) {
  toast.warning(`Already saved: "${existing.title}"`);
  return existing; // or null — do not insert
}
```

URL normalization: strip trailing slash, remove `utm_*` params, lowercase hostname.

**File:** `src/utils/urlNormalization.ts` (new, ~15 lines)

### 1.5 Focus Integration — Backfill & Reason Codes

**Modified files:**
- `src/hooks/useBackfillWorkItems.ts`
- `src/hooks/useEnsureWorkItem.ts`

**Change backfill trigger:** Replace current `!item.project_id` check with `processing_status = 'unprocessed'`:

```typescript
// useBackfillWorkItems.ts — reading section
const { data: readingItems } = await supabase
  .from('reading_items')
  .select('id, processing_status')
  .eq('created_by', userId)
  .eq('processing_status', 'unprocessed')
  .order('created_at', { ascending: false })
  .limit(50);
```

**Reason codes for reading items** (in `useEnsureWorkItem.ts`):

```typescript
case 'reading': {
  const { data: reading } = await supabase
    .from('reading_items')
    .select('project_id, processing_status, one_liner, content_type')
    .eq('id', sourceId)
    .single();

  if (reading) {
    const codes: string[] = [];

    // Primary reason: unprocessed
    if (reading.processing_status === 'unprocessed') {
      codes.push('unprocessed');
    }

    // Secondary: missing context
    if (!reading.one_liner) codes.push('missing_summary');

    reasonCodes = codes;
    priority = 2; // Bump from current 1
  }
}
```

**Auto-resolve:** When `processing_status` changes away from `unprocessed`, the work item should be resolved (status → `trusted`). Add this to the triage action handler.

### 1.6 Focus Reading Triage UI

**Replace `FocusGenericSheet` usage for reading items** with a new dedicated component.

**New file:** `src/components/focus/FocusReadingSheet.tsx`

This replaces `FocusGenericSheet` when `source_type === 'reading'`. Reuses the existing `Sheet` (from shadcn/ui) component and `FocusTriageBar` pattern.

**Layout:**

```
┌─────────────────────────────────────────┐
│ [favicon] hostname · content_type chip  │
│ Title (large)                           │
│ one_liner or "Needs triage" placeholder │
│                                         │
│ [image preview if available]            │
│                                         │
│ ─── Quick Classification ───            │
│ Content Type:  [article] [x_post] ...   │  ← chip selector
│ Priority:      [low] [normal] [high]    │  ← chip selector
│ Bucket:        [today] [this_week] ...  │  ← chip selector (optional)
│ Project:       [dropdown]               │  ← reuse existing project selector
│                                         │
│ ─── Actions ───                         │
│ [Keep/Queue] [Up Next] [Signal] [Archive] │  ← primary row
│ [Open Link ↗]  [Edit Details]           │  ← secondary row
│                                         │
│ [Snooze ▾]                              │  ← from FocusTriageBar
└─────────────────────────────────────────┘
```

**Action handlers** (new hook):

**New file:** `src/hooks/useFocusReadingActions.ts`

```typescript
export function useFocusReadingActions() {
  const queryClient = useQueryClient();

  // Each action: update reading_items + resolve work_item
  const keepAsQueued = async (readingItemId: string, workItemId: string) => {
    await supabase.from('reading_items').update({
      processing_status: 'queued',
      processed_at: new Date().toISOString(),
    }).eq('id', readingItemId);

    await supabase.from('work_items').update({
      status: 'trusted',
      trusted_at: new Date().toISOString(),
    }).eq('id', workItemId);

    queryClient.invalidateQueries({ queryKey: ['focus_queue'] });
    queryClient.invalidateQueries({ queryKey: ['reading_items'] });
  };

  const markUpNext = async (readingItemId: string, workItemId: string, bucket?: string) => {
    // Similar — processing_status = 'up_next', optional bucket
  };

  const markSignal = async (readingItemId: string, workItemId: string) => {
    // processing_status = 'signal'
  };

  const archiveFromFocus = async (readingItemId: string, workItemId: string) => {
    // processing_status = 'archived', archived_at = now
  };

  const updateClassification = async (readingItemId: string, updates: Partial<ReadingItem>) => {
    // content_type, priority, bucket, project_id — any inline edit
  };

  return { keepAsQueued, markUpNext, markSignal, archiveFromFocus, updateClassification };
}
```

**Wire into FocusQueue.tsx:**

In `FocusQueue.tsx`, when `selectedItem.source_type === 'reading'`, render `FocusReadingSheet` instead of `FocusGenericSheet`. Pass the reading item data (fetched via source_id from `reading_items`) and the triage actions.

### 1.7 Reading Page Redesign

**Modified files:**
- `src/pages/ReadingList.tsx` (major refactor)
- `src/components/reading/ReadingCommandPanel.tsx` (update filters + stats)
- `src/components/reading/readingHelpers.ts` (new filtering logic)

**New files:**
- `src/components/reading/ReadingUpNextSection.tsx`
- `src/components/reading/ReadingQueueSection.tsx`
- `src/components/reading/ReadingSignalsSection.tsx`
- `src/components/reading/ReadingItemCard.tsx` (extracted, shared card component)

#### 1.7a Default View — Sectioned Scrollable Page

Replace the current flat grid with sections:

```
┌──────────────────────────────────────────────────────┐
│ [CommandPanel]  │  Reading Library                    │
│                 │                                     │
│  Stats:         │  ═══ Up Next (spotlight shelf) ═══  │
│  · 3 Up Next    │  ┌─────┐ ┌─────┐ ┌─────┐          │
│  · 12 Queued    │  │ ★   │ │ ★   │ │ ★   │          │
│  · 8 Signals    │  │card │ │card │ │card │          │
│  · 2 Inbox      │  └─────┘ └─────┘ └─────┘          │
│                 │                                     │
│  Views:         │  ─── Queue ───                      │
│  ● Library      │  ┌─────┐ ┌─────┐ ┌─────┐          │
│  ○ Inbox (2)    │  │card │ │card │ │card │          │
│  ○ Signals      │  └─────┘ └─────┘ └─────┘          │
│  ○ Read         │  ┌─────┐ ┌─────┐                   │
│  ○ Archived     │  │card │ │card │                   │
│                 │  └─────┘ └─────┘                   │
│  By Project:    │                                     │
│  ○ Project A    │                                     │
│  ○ Project B    │                                     │
└──────────────────────────────────────────────────────┘
```

#### 1.7b Up Next Spotlight Shelf

Inspired by Kindle/Audible bookshelf:

- Slightly larger cards than Queue
- Subtle gradient background or elevated surface (e.g., `bg-gradient-to-r from-primary/5 to-primary/10` with a soft border)
- Cards have a subtle glow/ring (`ring-1 ring-primary/20`)
- Section header: "Up Next" with count and optional "today" / "this week" sub-tabs
- If bucket is set, group: "Today" items first, then "This Week"
- Sort within bucket: priority desc → created_at desc

#### 1.7c Queue Section

- Same card structure as current grid (3-col responsive)
- No special styling — standard dark cards
- Sort: priority desc → created_at desc
- Show content_type chip and topic pills on each card

#### 1.7d Signals View

- Accessed via command panel filter (not on default scrollable page — keeps default clean)
- Denser layout possible: 2-line list or smaller cards
- Emphasis on author/source + one_liner rather than full description
- Sort: recency

#### 1.7e Card Enhancements

Update the existing reading item card (currently inline in `ReadingList.tsx`) to show new fields:

- Content type chip (small, colored by type: blue for article, purple for x_post, green for tool, etc.)
- Topic pills (max 3 shown, "+N" overflow)
- Priority indicator (small colored dot: red/amber/green for high/normal/low — only shown if not 'normal')
- Bucket badge on Up Next cards ("Today" / "This Week")

**Card actions update** (hover actions):
- Keep existing: project dropdown, favorite (→ now means "flag"), mark read, delete
- Add: move to Up Next / move to Queue / archive (contextual based on current section)
- Content type is a small dropdown chip on the card, always visible

#### 1.7f Command Panel Updates

**Modified file:** `src/components/reading/ReadingCommandPanel.tsx`

Replace current view filters with:

```typescript
type ReadingPrimaryView = 'library' | 'inbox' | 'signals' | 'read' | 'archived';
```

Stats section shows:
- Up Next count
- Queue count
- Signals count
- Inbox (unprocessed) count — with attention badge if > 0

"Library" is the default view (shows Up Next + Queue sections).

Suggested Reading section remains but uses `processing_status = 'up_next'` items with `read_later_bucket = 'today'` first.

#### 1.7g Filter/Sort Logic Updates

**Modified file:** `src/components/reading/readingHelpers.ts`

```typescript
export type ReadingPrimaryView = 'library' | 'inbox' | 'signals' | 'read' | 'archived';

export interface ReadingFilter {
  primaryView: ReadingPrimaryView;
  projects: string[];
  contentTypes: string[];  // new
  topics: string[];        // new (Phase 2 semantic search adds to this)
}

export function getReadingCounts(items: ReadingItem[]): ReadingCounts {
  return {
    upNext: items.filter(i => i.processing_status === 'up_next').length,
    queue: items.filter(i => i.processing_status === 'queued').length,
    signals: items.filter(i => i.processing_status === 'signal').length,
    inbox: items.filter(i => i.processing_status === 'unprocessed').length,
    read: items.filter(i => i.processing_status === 'read').length,
    archived: items.filter(i => i.processing_status === 'archived').length,
  };
}

export function applyReadingFilter(items, filter, searchQuery) {
  let filtered = items;

  switch (filter.primaryView) {
    case 'library':
      filtered = items.filter(i => ['up_next', 'queued'].includes(i.processing_status));
      break;
    case 'inbox':
      filtered = items.filter(i => i.processing_status === 'unprocessed');
      break;
    case 'signals':
      filtered = items.filter(i => i.processing_status === 'signal');
      break;
    case 'read':
      filtered = items.filter(i => i.processing_status === 'read');
      break;
    case 'archived':
      filtered = items.filter(i => i.processing_status === 'archived');
      break;
  }

  // Project filter
  if (filter.projects.length) {
    filtered = filtered.filter(i => filter.projects.includes(i.project_id));
  }

  // Content type filter
  if (filter.contentTypes.length) {
    filtered = filtered.filter(i => filter.contentTypes.includes(i.content_type));
  }

  // Search
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(i =>
      i.title?.toLowerCase().includes(q) ||
      i.description?.toLowerCase().includes(q) ||
      i.one_liner?.toLowerCase().includes(q) ||
      i.hostname?.toLowerCase().includes(q) ||
      i.topics?.some(t => t.toLowerCase().includes(q))
    );
  }

  return filtered;
}
```

### 1.8 Type Updates

**Modified files:**
- `src/types/readingItem.ts` — add new fields to `ReadingItem` interface
- `src/utils/readingItemTransforms.ts` — update `transformReadingItem` and `transformReadingItemForDatabase`
- `src/integrations/supabase/types.ts` — will auto-update after migration via Supabase type gen

```typescript
// src/types/readingItem.ts additions
export interface ReadingItem {
  // ... existing fields ...
  processingStatus: string;    // processing_status
  processedAt?: string;        // processed_at
  archivedAt?: string;         // archived_at
  contentType?: string;        // content_type
  priority: string;            // priority
  readLaterBucket?: string;    // read_later_bucket
  oneLiner?: string;           // one_liner
  topics: string[];            // topics
  actionability: string;       // actionability
  savedFrom?: string;          // saved_from
  entities?: any[];            // entities (jsonb)
}
```

### 1.9 Hook Updates

**Modified file:** `src/hooks/useReadingItems.ts`

- `createReadingItem`: Run `classifyContentType` and `inferSavedFrom` before insert. Check for duplicate URL. Set `processing_status = 'unprocessed'` (default). If project_id is provided at creation, set `processing_status = 'queued'` and `processed_at = now()` instead (skip Focus).
- `updateReadingItem`: Handle new fields. When `processing_status` changes from `unprocessed`, resolve any associated work_item.
- Transform functions updated for all new columns.

### 1.10 Auto-create Work Item on Reading Item Creation

**Where:** `useReadingItems.createReadingItem` (or a `useEffect` in a wrapper)

After creating a reading item with `processing_status = 'unprocessed'`:

```typescript
if (newItem.processing_status === 'unprocessed') {
  await ensureWorkItem('reading', newItem.id, userId);
}
```

This ensures new unprocessed items immediately appear in Focus without waiting for the next backfill cycle.

---

## Phase 2: AI Enrichment, Topics & Semantic Search

### 2.1 AI Enrichment Edge Function

**New file:** `supabase/functions/reading-enrich/index.ts`

Follows the `focus-enrich` pattern. Uses OpenAI `gpt-4o-mini`.

**Trigger:** Called automatically after reading item creation (when `processing_status = 'unprocessed'` and enrichment fields are empty).

**Input:**

```typescript
{
  reading_item_id: string;
  url: string;
  title: string;
  description: string | null;
  hostname: string | null;
  content_type: string | null;  // from deterministic classifier
}
```

**System prompt** (abbreviated):

```
You are classifying a saved web link for a fintech/SaaS VC's reading library.
Return structured JSON with:
- one_liner (max 120 chars): why this is worth reading
- topics (3-6 from taxonomy, freeform OK): [list]
- actionability: none | idea | follow_up | diligence
- content_type_suggestion: article | x_post | blog_post | newsletter | tool
- entities: [{name, type: "company"|"person"|"product"}] (max 5)

Taxonomy reference: [B2B Sales, Vibe Coding, Venture Trends, Fintech, SaaS Metrics,
AI/ML, Developer Tools, Product Strategy, Go-to-Market, Fundraising, LP Relations,
Portfolio Ops, Market Maps, Regulatory/Compliance, Infrastructure, Growth/PLG,
Enterprise Sales, Data & Analytics, Payments, Banking-as-a-Service]

You may generate topics outside this list if clearly warranted.
Do NOT generate long summaries.
```

**Response format:** OpenAI JSON mode (`response_format: { type: "json_object" }`)

**Persistence:**
- Update `reading_items` directly: `one_liner`, `topics`, `actionability`, `entities`, `content_type` (only if deterministic was null/generic)
- Also store in `item_extracts` with `source_type='reading'` for consistency with existing enrichment system

**Frontend hook:** `src/hooks/useReadingEnrichment.ts` (new)

```typescript
export function useReadingEnrichment() {
  const enrichItem = async (readingItemId: string) => {
    const { data: item } = await supabase
      .from('reading_items')
      .select('id, url, title, description, hostname, content_type, one_liner')
      .eq('id', readingItemId)
      .single();

    if (!item || (item.one_liner && item.topics?.length)) return; // already enriched

    await supabase.functions.invoke('reading-enrich', {
      body: { reading_item_id: item.id, ...item },
    });

    queryClient.invalidateQueries({ queryKey: ['reading_items'] });
  };

  return { enrichItem };
}
```

**Auto-trigger:** In `useReadingItems.createReadingItem`, after successful insert and work item creation, fire enrichment in background (non-blocking).

### 2.2 Topic Taxonomy & Management

**Seed taxonomy** (stored as a constant, not a table):

```typescript
// src/constants/readingTopics.ts
export const READING_TOPIC_TAXONOMY = [
  'B2B Sales', 'Vibe Coding', 'Venture Trends', 'Fintech',
  'SaaS Metrics', 'AI/ML', 'Developer Tools', 'Product Strategy',
  'Go-to-Market', 'Fundraising', 'LP Relations', 'Portfolio Ops',
  'Market Maps', 'Regulatory/Compliance', 'Infrastructure',
  'Growth/PLG', 'Enterprise Sales', 'Data & Analytics',
  'Payments', 'Banking-as-a-Service',
];
```

In the UI, topic selection uses a combobox: shows taxonomy suggestions + allows freeform entry.

**Periodic canonicalization** (Phase 3 or later): A utility/edge function that queries all distinct topics, clusters similar ones (e.g., "AI" and "AI/ML"), and suggests merges.

### 2.3 Semantic Search on Reading Page

**Approach:** Client-side fuzzy matching for Phase 2 (no vector DB needed).

Enhance the search bar in `ReadingList.tsx`:

```typescript
// When user types "fintech trends", match against:
// 1. Exact substring in title, description, one_liner, hostname (existing)
// 2. Topic matching: split query into tokens, match against item.topics with fuzzy tolerance
// 3. Content type names (e.g., "newsletters" matches content_type = 'newsletter')
```

For Phase 2, use a lightweight fuzzy library (e.g., `fuse.js` if already in deps, or simple token overlap scoring). True vector/embedding search is a future enhancement.

### 2.4 Signals Section on Reading Page

Add Signals as a command panel view (`primaryView = 'signals'`).

**Layout:**
- Denser than main library: list-style rows or 2-col smaller cards
- Each row: favicon + source + one_liner + topic pills + date
- No preview images (signals are reference material, not deep reads)
- Quick actions: open link, convert to note, archive

### 2.5 AI Suggestions in Focus Triage

When AI enrichment has run, show suggestion pills in `FocusReadingSheet`:

```
AI suggests: [Keep as Signal] [Up Next — follow_up detected]
```

Accepting a suggestion triggers the same action as the manual button. These are displayed only when enrichment data exists and are non-intrusive pills.

---

## Phase 3: Batch Triage, Extract-to-Note, Drag & Polish

### 3.1 Batch Triage

**Where:** Focus queue (when filtered to reading source type) and Reading page Inbox view.

**UX:**
- Checkbox on each row/card
- Floating action bar appears when ≥1 selected: "Keep (N)" | "Signal (N)" | "Archive (N)" | "Set Project"
- Bulk update via single Supabase `.in('id', selectedIds).update(...)` call

### 3.2 Extract-to-Note Workflow

**Trigger:** Button on reading item card and in Focus triage sheet: "Extract to Note"

**Behavior:**
1. Open a note editor (reuse existing note creation pattern from `useNotes`)
2. Prefill:
   - Title: item title
   - Content: `one_liner` + `\n\n` + URL + `\n\n` + topics as tags
3. Create `note_link` with `target_type = 'reading_item'`, `target_id = item.id`
4. Prompt: "Set reading item to Signal or Archive?" → default Signal

### 3.3 Drag-to-Reorder Between Sections

**Library:** Use `@dnd-kit/core` (or `react-beautiful-dnd` if already in deps).

**Behavior:**
- Drag a card from Queue to Up Next → updates `processing_status` to `up_next`
- Drag from Up Next to Queue → updates to `queued`
- Drag within Up Next → reorder (requires a `sort_order` integer column, added in Phase 3 migration)
- Visual feedback: drop zones highlight between sections

### 3.4 Fuzzy Duplicate Detection

On item creation, after exact URL check:
- Query items with same hostname from last 30 days
- Compare titles using Levenshtein distance or token overlap
- If similarity > 0.8: show warning toast "Similar item found: {title}" with link to existing item
- User decides whether to keep or discard

### 3.5 Topic Canonicalization

Edge function or manual utility:
- Query `SELECT DISTINCT unnest(topics) FROM reading_items WHERE created_by = $1`
- Cluster similar topics (AI or string distance)
- Suggest merge operations
- Apply via batch update

---

## File Change Summary

### New Files

| File | Phase | Purpose |
|------|-------|---------|
| `src/utils/readingContentClassifier.ts` | 1 | Deterministic content_type + saved_from |
| `src/utils/urlNormalization.ts` | 1 | URL dedup normalization |
| `src/hooks/useFocusReadingActions.ts` | 1 | Focus triage actions for reading items |
| `src/components/focus/FocusReadingSheet.tsx` | 1 | Reading-specific Focus triage sheet |
| `src/components/reading/ReadingUpNextSection.tsx` | 1 | Spotlight bookshelf section |
| `src/components/reading/ReadingQueueSection.tsx` | 1 | Queue grid section |
| `src/components/reading/ReadingSignalsSection.tsx` | 2 | Signals list/grid |
| `src/components/reading/ReadingItemCard.tsx` | 1 | Shared card component (extracted from page) |
| `src/constants/readingTopics.ts` | 2 | Topic taxonomy |
| `src/hooks/useReadingEnrichment.ts` | 2 | AI enrichment trigger hook |
| `supabase/functions/reading-enrich/index.ts` | 2 | AI enrichment edge function |

### Modified Files

| File | Phase | Changes |
|------|-------|---------|
| `src/types/readingItem.ts` | 1 | Add new fields to interface |
| `src/utils/readingItemTransforms.ts` | 1 | Transform new columns |
| `src/hooks/useReadingItems.ts` | 1 | Classification on create, dedup check, status-aware CRUD |
| `src/hooks/useBackfillWorkItems.ts` | 1 | Change trigger to `processing_status = 'unprocessed'` |
| `src/hooks/useEnsureWorkItem.ts` | 1 | New reason codes for reading items |
| `src/pages/ReadingList.tsx` | 1 | Sectioned layout, new default view |
| `src/components/reading/ReadingCommandPanel.tsx` | 1 | New views, stats, filters |
| `src/components/reading/readingHelpers.ts` | 1 | New filter/sort logic |
| `src/pages/FocusQueue.tsx` | 1 | Route reading items to FocusReadingSheet |
| `src/hooks/useAddLinkForm.ts` | 1 | Run classifier, check duplicates |

### No Changes Needed

| File | Reason |
|------|--------|
| `src/services/linkMetadataService.ts` | Microlink flow unchanged |
| `src/components/focus/FocusTriageBar.tsx` | Reused as-is in new sheet |
| `src/components/notes/ReadingItemNotesSection.tsx` | Reused in Phase 3 extract-to-note |
| `src/components/modals/AddLinkDialog.tsx` | Works as-is (creation flow unchanged) |

---

## Migration & Rollout Strategy

### Phase 1 Rollout Steps (in order)

1. **Schema migration** — add columns with defaults, run data migration
2. **Type updates** — regenerate Supabase types, update `ReadingItem` interface + transforms
3. **Content classifier + URL normalization** — pure utility, no UI impact
4. **Hook updates** — `useReadingItems` (classifier on create, dedup), backfill/ensure changes
5. **Focus triage** — `FocusReadingSheet` + `useFocusReadingActions` + wire into `FocusQueue.tsx`
6. **Reading page** — extract card component, build sections, update command panel + helpers
7. **Smoke test** — create new item → appears in Focus → triage → appears in Reading Library

### Phase 2 Rollout Steps

1. Deploy `reading-enrich` edge function
2. Add `useReadingEnrichment` hook, wire auto-trigger on create
3. Add topic taxonomy constant + combobox UI for topic editing
4. Enhance search with fuzzy topic matching
5. Build Signals view

### Phase 3 Rollout Steps

1. Batch triage UI
2. Extract-to-note workflow
3. Drag-to-reorder (add `sort_order` column)
4. Fuzzy duplicate detection
5. Topic canonicalization utility

---

## Constraints Checklist

- [x] No new tables — all columns added to existing `reading_items`
- [x] Reuse `work_items` for Focus integration
- [x] Reuse existing `Sheet`, `FocusTriageBar`, project selector components
- [x] Reuse `item_extracts` and `entity_links` for AI enrichment storage
- [x] Reuse `note_links` with `target_type='reading_item'` for extract-to-note
- [x] No new UI paradigms — sheets, command panel, card grid all exist
- [x] RLS mirrors existing owner-only pattern
- [x] Existing items won't flood Focus (migrated to curated states)
