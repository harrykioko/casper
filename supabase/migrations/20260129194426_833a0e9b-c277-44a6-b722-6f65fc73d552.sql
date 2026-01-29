-- Add microsoft_event_id column to linking tables for stable lookups across calendar syncs
ALTER TABLE calendar_event_links 
ADD COLUMN IF NOT EXISTS microsoft_event_id TEXT;

ALTER TABLE calendar_event_link_suggestions
ADD COLUMN IF NOT EXISTS microsoft_event_id TEXT;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_calendar_event_links_ms_event_id 
ON calendar_event_links(microsoft_event_id);

CREATE INDEX IF NOT EXISTS idx_calendar_event_link_suggestions_ms_event_id 
ON calendar_event_link_suggestions(microsoft_event_id);

-- Backfill existing links with Microsoft Event IDs from current calendar_events
UPDATE calendar_event_links cel
SET microsoft_event_id = ce.microsoft_event_id
FROM calendar_events ce
WHERE cel.calendar_event_id = ce.id
  AND cel.microsoft_event_id IS NULL;

-- Backfill existing suggestions
UPDATE calendar_event_link_suggestions cels
SET microsoft_event_id = ce.microsoft_event_id
FROM calendar_events ce
WHERE cels.calendar_event_id = ce.id
  AND cels.microsoft_event_id IS NULL;