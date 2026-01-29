-- Calendar Event Linking: link events to companies (pipeline or portfolio)
-- and store AI-generated suggestions for auto-linking

-- 1. Confirmed links between calendar events and companies
CREATE TABLE IF NOT EXISTS calendar_event_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  company_type TEXT NOT NULL CHECK (company_type IN ('pipeline', 'portfolio')),
  company_name TEXT NOT NULL,
  linked_by TEXT NOT NULL CHECK (linked_by IN ('auto', 'manual')),
  confidence REAL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (calendar_event_id, company_id, company_type)
);

-- 2. Suggestion candidates before user accepts/dismisses
CREATE TABLE IF NOT EXISTS calendar_event_link_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  company_id UUID NOT NULL,
  company_type TEXT NOT NULL CHECK (company_type IN ('pipeline', 'portfolio')),
  company_name TEXT NOT NULL,
  match_reason TEXT,
  matched_domain TEXT,
  matched_attendee_email TEXT,
  confidence REAL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'dismissed')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (calendar_event_id, company_id, company_type)
);

-- 3. RLS policies
ALTER TABLE calendar_event_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_event_link_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own event links"
  ON calendar_event_links FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own event links"
  ON calendar_event_links FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own event links"
  ON calendar_event_links FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own event links"
  ON calendar_event_links FOR DELETE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can view their own link suggestions"
  ON calendar_event_link_suggestions FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own link suggestions"
  ON calendar_event_link_suggestions FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own link suggestions"
  ON calendar_event_link_suggestions FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own link suggestions"
  ON calendar_event_link_suggestions FOR DELETE
  USING (auth.uid() = created_by);

-- 4. Indexes for fast lookups
CREATE INDEX idx_cal_event_links_event ON calendar_event_links(calendar_event_id);
CREATE INDEX idx_cal_event_links_user ON calendar_event_links(created_by);
CREATE INDEX idx_cal_event_suggestions_event ON calendar_event_link_suggestions(calendar_event_id);
CREATE INDEX idx_cal_event_suggestions_user ON calendar_event_link_suggestions(created_by);
CREATE INDEX idx_cal_event_suggestions_status ON calendar_event_link_suggestions(status);
