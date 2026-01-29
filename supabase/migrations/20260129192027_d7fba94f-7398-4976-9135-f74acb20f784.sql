-- Add 'calendar_event' to the note_target_type enum
ALTER TYPE public.note_target_type ADD VALUE IF NOT EXISTS 'calendar_event';