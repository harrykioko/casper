-- Backfill primary_domain for existing portfolio companies
UPDATE companies
SET primary_domain = 
  LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(website_url, '^https?://', ''),
        '/.*$', ''
      ),
      '^www\.', ''
    )
  )
WHERE website_url IS NOT NULL 
  AND website_url != '' 
  AND primary_domain IS NULL;

-- Backfill primary_domain for existing pipeline companies
UPDATE pipeline_companies
SET primary_domain = 
  LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(website, '^https?://', ''),
        '/.*$', ''
      ),
      '^www\.', ''
    )
  )
WHERE website IS NOT NULL 
  AND website != '' 
  AND primary_domain IS NULL;