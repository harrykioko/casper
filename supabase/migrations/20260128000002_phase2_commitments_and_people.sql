-- ============================================================================
-- Phase 2 Migration: Commitments & Unified People
-- ============================================================================
-- This migration creates:
-- 1. Unified people table (single source of truth for all contacts)
-- 2. Person-company roles junction table
-- 3. Commitments table (track promises made to others)
-- 4. Migration of existing contacts data
-- ============================================================================

-- ============================================================================
-- 1. UNIFIED PEOPLE TABLE
-- ============================================================================
-- Single source of truth for all contacts across portfolio and pipeline

CREATE TABLE IF NOT EXISTS people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  linkedin_url TEXT,
  avatar_url TEXT,

  -- Importance/Relationship
  relationship_tier TEXT CHECK (relationship_tier IN ('inner_circle', 'close', 'familiar', 'acquaintance')),
  is_vip BOOLEAN DEFAULT false,

  -- Metadata
  notes TEXT,
  tags TEXT[],

  -- Ownership
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_people_email ON people(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_people_name ON people(name);
CREATE INDEX IF NOT EXISTS idx_people_created_by ON people(created_by);
CREATE INDEX IF NOT EXISTS idx_people_vip ON people(created_by, is_vip) WHERE is_vip = true;

-- RLS
ALTER TABLE people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own people"
  ON people FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own people"
  ON people FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own people"
  ON people FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own people"
  ON people FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

COMMENT ON TABLE people IS 'Unified contact directory - single source of truth for all people across portfolio and pipeline';

-- ============================================================================
-- 2. PERSON-COMPANY ROLES (Junction Table)
-- ============================================================================
-- Links people to companies (portfolio or pipeline) with role information

CREATE TABLE IF NOT EXISTS person_company_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES people(id) ON DELETE CASCADE NOT NULL,

  -- Company reference (polymorphic - can be portfolio or pipeline)
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

  -- Metadata
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Unique constraint: one person can have one active role per company
  UNIQUE(person_id, company_id, company_type, is_current)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_person_roles_person ON person_company_roles(person_id);
CREATE INDEX IF NOT EXISTS idx_person_roles_company ON person_company_roles(company_id, company_type);
CREATE INDEX IF NOT EXISTS idx_person_roles_current ON person_company_roles(company_id, company_type, is_current)
  WHERE is_current = true;

-- RLS
ALTER TABLE person_company_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own person roles"
  ON person_company_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own person roles"
  ON person_company_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own person roles"
  ON person_company_roles FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own person roles"
  ON person_company_roles FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

COMMENT ON TABLE person_company_roles IS 'Links people to companies with role and timeline information';

-- ============================================================================
-- 3. COMMITMENTS TABLE
-- ============================================================================
-- Track promises made to others (the #1 source of things slipping)

CREATE TYPE commitment_status AS ENUM ('open', 'completed', 'broken', 'delegated', 'cancelled');
CREATE TYPE commitment_source AS ENUM ('call', 'email', 'meeting', 'message', 'manual');

CREATE TABLE IF NOT EXISTS commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What was promised
  content TEXT NOT NULL,
  context TEXT,

  -- To whom (links to people table)
  person_id UUID REFERENCES people(id) ON DELETE SET NULL,
  person_name TEXT, -- Denormalized for display even if person deleted

  -- Related company (optional)
  company_id UUID,
  company_type TEXT CHECK (company_type IN ('portfolio', 'pipeline')),
  company_name TEXT, -- Denormalized for display

  -- When
  promised_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_at TIMESTAMPTZ,
  implied_urgency TEXT CHECK (implied_urgency IN ('asap', 'today', 'this_week', 'next_week', 'this_month', 'when_possible')),

  -- Source (where did this commitment come from?)
  source_type commitment_source NOT NULL DEFAULT 'manual',
  source_id UUID, -- Link to interaction, inbox_item, calendar_event
  source_reference TEXT, -- Human-readable source description

  -- Status
  status commitment_status NOT NULL DEFAULT 'open',
  completed_at TIMESTAMPTZ,
  completed_via TEXT, -- How it was fulfilled
  completion_notes TEXT,

  -- Delegation (if delegated to someone else)
  delegated_to_person_id UUID REFERENCES people(id) ON DELETE SET NULL,
  delegated_to_name TEXT,
  delegated_at TIMESTAMPTZ,

  -- Snooze/Escalation tracking (same as tasks)
  snoozed_until TIMESTAMPTZ,
  snooze_count INTEGER DEFAULT 0,
  last_snoozed_at TIMESTAMPTZ,

  -- Ownership
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_commitments_open
  ON commitments(created_by, status)
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_commitments_due
  ON commitments(due_at)
  WHERE status = 'open' AND due_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_commitments_person
  ON commitments(person_id)
  WHERE person_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_commitments_company
  ON commitments(company_id, company_type)
  WHERE company_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_commitments_snoozed
  ON commitments(created_by, snoozed_until)
  WHERE snoozed_until IS NOT NULL AND status = 'open';

CREATE INDEX IF NOT EXISTS idx_commitments_delegated
  ON commitments(created_by, status)
  WHERE status = 'delegated';

-- RLS
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own commitments"
  ON commitments FOR SELECT
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own commitments"
  ON commitments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own commitments"
  ON commitments FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own commitments"
  ON commitments FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);

COMMENT ON TABLE commitments IS 'Track promises made to others - the #1 source of things slipping through cracks';

-- ============================================================================
-- 4. MIGRATE EXISTING CONTACTS
-- ============================================================================
-- Migrate pipeline_contacts and company_contacts to the unified people table

-- 4a. Migrate pipeline_contacts
INSERT INTO people (name, email, created_by, created_at, updated_at)
SELECT DISTINCT ON (pc.email, pc.created_by)
  pc.name,
  pc.email,
  pc.created_by,
  pc.created_at,
  COALESCE(pc.created_at, now())
FROM pipeline_contacts pc
WHERE pc.name IS NOT NULL
ON CONFLICT DO NOTHING;

-- Create role links for pipeline contacts
INSERT INTO person_company_roles (person_id, company_id, company_type, role, is_founder, is_primary_contact, created_by, created_at)
SELECT
  p.id as person_id,
  pc.pipeline_company_id as company_id,
  'pipeline' as company_type,
  pc.role,
  COALESCE(pc.is_founder, false),
  COALESCE(pc.is_primary, false),
  pc.created_by,
  pc.created_at
FROM pipeline_contacts pc
JOIN people p ON (
  (pc.email IS NOT NULL AND p.email = pc.email AND p.created_by = pc.created_by)
  OR (pc.email IS NULL AND p.name = pc.name AND p.created_by = pc.created_by)
)
ON CONFLICT DO NOTHING;

-- 4b. Migrate company_contacts (portfolio)
INSERT INTO people (name, email, created_by, created_at, updated_at)
SELECT DISTINCT ON (cc.email, cc.created_by)
  cc.name,
  cc.email,
  cc.created_by,
  cc.created_at,
  COALESCE(cc.created_at, now())
FROM company_contacts cc
WHERE cc.name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM people p
    WHERE p.email = cc.email
    AND p.created_by = cc.created_by
    AND cc.email IS NOT NULL
  )
ON CONFLICT DO NOTHING;

-- Create role links for company contacts
INSERT INTO person_company_roles (person_id, company_id, company_type, role, is_founder, is_primary_contact, created_by, created_at)
SELECT
  p.id as person_id,
  cc.company_id as company_id,
  'portfolio' as company_type,
  cc.role,
  COALESCE(cc.is_founder, false),
  COALESCE(cc.is_primary, false),
  cc.created_by,
  cc.created_at
FROM company_contacts cc
JOIN people p ON (
  (cc.email IS NOT NULL AND p.email = cc.email AND p.created_by = cc.created_by)
  OR (cc.email IS NULL AND p.name = cc.name AND p.created_by = cc.created_by)
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 5. HELPER VIEWS
-- ============================================================================

-- View: People with their current company roles
CREATE OR REPLACE VIEW people_with_roles AS
SELECT
  p.*,
  COALESCE(
    json_agg(
      json_build_object(
        'role_id', pcr.id,
        'company_id', pcr.company_id,
        'company_type', pcr.company_type,
        'role', pcr.role,
        'is_founder', pcr.is_founder,
        'is_primary_contact', pcr.is_primary_contact,
        'is_current', pcr.is_current
      )
    ) FILTER (WHERE pcr.id IS NOT NULL),
    '[]'
  ) as company_roles
FROM people p
LEFT JOIN person_company_roles pcr ON p.id = pcr.person_id AND pcr.is_current = true
GROUP BY p.id;

COMMENT ON VIEW people_with_roles IS 'People with their current company affiliations';

-- View: Open commitments with person and company details
CREATE OR REPLACE VIEW open_commitments_detailed AS
SELECT
  c.*,
  p.email as person_email,
  p.avatar_url as person_avatar
FROM commitments c
LEFT JOIN people p ON c.person_id = p.id
WHERE c.status = 'open';

COMMENT ON VIEW open_commitments_detailed IS 'Open commitments with related person details';

-- View: Overdue commitments
CREATE OR REPLACE VIEW overdue_commitments AS
SELECT *
FROM commitments
WHERE status = 'open'
  AND due_at IS NOT NULL
  AND due_at < now();

COMMENT ON VIEW overdue_commitments IS 'Commitments past their due date';

-- ============================================================================
-- 6. TRIGGERS
-- ============================================================================

-- Auto-update updated_at on people
CREATE OR REPLACE FUNCTION update_people_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_people_updated_at ON people;
CREATE TRIGGER trigger_people_updated_at
  BEFORE UPDATE ON people
  FOR EACH ROW
  EXECUTE FUNCTION update_people_updated_at();

-- Auto-update updated_at on commitments
CREATE OR REPLACE FUNCTION update_commitments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_commitments_updated_at ON commitments;
CREATE TRIGGER trigger_commitments_updated_at
  BEFORE UPDATE ON commitments
  FOR EACH ROW
  EXECUTE FUNCTION update_commitments_updated_at();

-- Auto-set completed_at when status changes to completed
CREATE OR REPLACE FUNCTION set_commitment_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = now();
  END IF;
  IF NEW.status = 'delegated' AND OLD.status != 'delegated' THEN
    NEW.delegated_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_commitment_status_change ON commitments;
CREATE TRIGGER trigger_commitment_status_change
  BEFORE UPDATE ON commitments
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION set_commitment_completed_at();

-- ============================================================================
-- 7. ADD PERSON_ID TO INTERACTIONS
-- ============================================================================
-- Link interactions to the unified people table

ALTER TABLE company_interactions
  ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES people(id) ON DELETE SET NULL;

ALTER TABLE pipeline_interactions
  ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES people(id) ON DELETE SET NULL;

-- ============================================================================
-- Done!
-- ============================================================================
