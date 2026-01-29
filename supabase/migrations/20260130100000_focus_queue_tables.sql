-- Focus Queue: work_items, entity_links, item_extracts
-- Provides a unified review queue for all incoming work items

-- ============================================================
-- 1. work_items
-- ============================================================
CREATE TABLE IF NOT EXISTS public.work_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type text NOT NULL CHECK (source_type IN ('email','calendar_event','task','note','reading')),
  source_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'needs_review' CHECK (status IN ('needs_review','enriched_pending','trusted','snoozed','ignored')),
  reason_codes text[] NOT NULL DEFAULT '{}',
  priority integer NOT NULL DEFAULT 0,
  snooze_until timestamptz,
  last_touched_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  trusted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_type, source_id, created_by)
);

CREATE INDEX idx_work_items_user_status ON public.work_items (created_by, status);
CREATE INDEX idx_work_items_user_snooze ON public.work_items (created_by, snooze_until);
CREATE INDEX idx_work_items_user_touched ON public.work_items (created_by, last_touched_at);

ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own work_items"
  ON public.work_items FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own work_items"
  ON public.work_items FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own work_items"
  ON public.work_items FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own work_items"
  ON public.work_items FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================================
-- 2. entity_links
-- ============================================================
CREATE TABLE IF NOT EXISTS public.entity_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('company','project')),
  target_id uuid NOT NULL,
  link_reason text,
  confidence numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_type, source_id, target_type, target_id, created_by)
);

CREATE INDEX idx_entity_links_user_target ON public.entity_links (created_by, target_type, target_id);
CREATE INDEX idx_entity_links_source ON public.entity_links (source_type, source_id);

ALTER TABLE public.entity_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own entity_links"
  ON public.entity_links FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own entity_links"
  ON public.entity_links FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own entity_links"
  ON public.entity_links FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own entity_links"
  ON public.entity_links FOR DELETE
  USING (auth.uid() = created_by);

-- ============================================================
-- 3. item_extracts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.item_extracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type text NOT NULL,
  source_id uuid NOT NULL,
  extract_type text NOT NULL CHECK (extract_type IN ('summary','highlights','decisions','followups','key_entities','tasks_suggested')),
  content jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_item_extracts_user_source ON public.item_extracts (created_by, source_type, source_id);
CREATE INDEX idx_item_extracts_type ON public.item_extracts (extract_type);

ALTER TABLE public.item_extracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own item_extracts"
  ON public.item_extracts FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert own item_extracts"
  ON public.item_extracts FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own item_extracts"
  ON public.item_extracts FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete own item_extracts"
  ON public.item_extracts FOR DELETE
  USING (auth.uid() = created_by);
