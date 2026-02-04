-- Add effort estimation columns to tasks table
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS effort_minutes INTEGER,
ADD COLUMN IF NOT EXISTS effort_category TEXT CHECK (effort_category IN ('quick', 'medium', 'deep', 'unknown'));