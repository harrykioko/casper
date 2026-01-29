-- Create pipeline_company_enrichments table for Harmonic enrichment data
CREATE TABLE pipeline_company_enrichments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_company_id UUID UNIQUE NOT NULL REFERENCES pipeline_companies(id) ON DELETE CASCADE,
  
  -- Harmonic identifiers
  harmonic_company_id TEXT,
  match_method TEXT CHECK (match_method IN ('domain', 'linkedin', 'search')),
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  
  -- Company info
  description_short TEXT,
  description_long TEXT,
  hq_city TEXT,
  hq_region TEXT,
  hq_country TEXT,
  employee_range TEXT,
  founding_year INTEGER,
  
  -- Funding info
  funding_stage TEXT,
  total_funding_usd NUMERIC,
  last_funding_date DATE,
  
  -- Links
  linkedin_url TEXT,
  twitter_url TEXT,
  
  -- Key people (founders, executives)
  key_people JSONB DEFAULT '[]',
  
  -- Full response for debugging
  source_payload JSONB,
  
  -- Timestamps
  enriched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_refreshed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for lookups
CREATE INDEX idx_enrichments_pipeline_company ON pipeline_company_enrichments(pipeline_company_id);

-- Enable RLS
ALTER TABLE pipeline_company_enrichments ENABLE ROW LEVEL SECURITY;

-- RLS policies matching pipeline_companies patterns
CREATE POLICY "Users can view enrichments for their pipeline companies"
ON pipeline_company_enrichments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM pipeline_companies 
  WHERE id = pipeline_company_enrichments.pipeline_company_id 
  AND created_by = auth.uid()
));

CREATE POLICY "Users can create enrichments for their pipeline companies"
ON pipeline_company_enrichments FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM pipeline_companies 
  WHERE id = pipeline_company_enrichments.pipeline_company_id 
  AND created_by = auth.uid()
));

CREATE POLICY "Users can update enrichments for their pipeline companies"
ON pipeline_company_enrichments FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM pipeline_companies 
  WHERE id = pipeline_company_enrichments.pipeline_company_id 
  AND created_by = auth.uid()
));

CREATE POLICY "Users can delete enrichments for their pipeline companies"
ON pipeline_company_enrichments FOR DELETE
USING (EXISTS (
  SELECT 1 FROM pipeline_companies 
  WHERE id = pipeline_company_enrichments.pipeline_company_id 
  AND created_by = auth.uid()
));