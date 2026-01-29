-- Add cleaned content and signal columns to inbox_items
ALTER TABLE inbox_items
  ADD COLUMN IF NOT EXISTS cleaned_text text,
  ADD COLUMN IF NOT EXISTS display_snippet text,
  ADD COLUMN IF NOT EXISTS display_subject text,
  ADD COLUMN IF NOT EXISTS display_from_email text,
  ADD COLUMN IF NOT EXISTS display_from_name text,
  ADD COLUMN IF NOT EXISTS is_forwarded boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_thread boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_disclaimer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_calendar boolean NOT NULL DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN inbox_items.cleaned_text IS 'Cleaned email body for UI display - stripped of signatures, disclaimers, calendar junk';
COMMENT ON COLUMN inbox_items.display_snippet IS 'Clean snippet for list views (280 chars)';
COMMENT ON COLUMN inbox_items.display_subject IS 'Canonicalized subject without Re:/Fwd: prefixes';
COMMENT ON COLUMN inbox_items.display_from_email IS 'Original sender email (extracted from forwards)';
COMMENT ON COLUMN inbox_items.display_from_name IS 'Original sender name (extracted from forwards)';
COMMENT ON COLUMN inbox_items.is_forwarded IS 'Whether this email was forwarded';
COMMENT ON COLUMN inbox_items.has_thread IS 'Whether quoted reply thread was detected and stripped';
COMMENT ON COLUMN inbox_items.has_disclaimer IS 'Whether legal disclaimer was detected and stripped';
COMMENT ON COLUMN inbox_items.has_calendar IS 'Whether calendar invite content was detected and stripped';