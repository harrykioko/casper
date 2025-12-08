-- Add primary_domain to portfolio companies
ALTER TABLE companies ADD COLUMN primary_domain text NULL;

-- Add primary_domain to pipeline companies  
ALTER TABLE pipeline_companies ADD COLUMN primary_domain text NULL;