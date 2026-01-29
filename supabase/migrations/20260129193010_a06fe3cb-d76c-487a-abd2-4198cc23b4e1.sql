-- Backfill pipeline company logos
UPDATE calendar_event_links cel
SET company_logo_url = pc.logo_url
FROM pipeline_companies pc
WHERE cel.company_id = pc.id
  AND cel.company_type = 'pipeline'
  AND cel.company_logo_url IS NULL
  AND pc.logo_url IS NOT NULL;

-- Backfill portfolio company logos  
UPDATE calendar_event_links cel
SET company_logo_url = c.logo_url
FROM companies c
WHERE cel.company_id = c.id
  AND cel.company_type = 'portfolio'
  AND cel.company_logo_url IS NULL
  AND c.logo_url IS NOT NULL;