-- Add columns for company link metadata
ALTER TABLE inbox_items 
ADD COLUMN IF NOT EXISTS related_company_type TEXT,
ADD COLUMN IF NOT EXISTS related_company_logo_url TEXT;