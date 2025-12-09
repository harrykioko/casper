-- Create table to store dismissed priority items (like calendar events)
CREATE TABLE public.dismissed_priority_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source_type TEXT NOT NULL, -- 'calendar_event', 'task', 'inbox', etc.
  source_id TEXT NOT NULL, -- the original item's ID
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, source_type, source_id)
);

-- Fast lookup index
CREATE INDEX idx_dismissed_priority_lookup 
  ON public.dismissed_priority_items(user_id, source_type);

-- Enable RLS
ALTER TABLE public.dismissed_priority_items ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can only manage their own dismissals
CREATE POLICY "Users can view own dismissals"
  ON public.dismissed_priority_items FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own dismissals"
  ON public.dismissed_priority_items FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own dismissals"
  ON public.dismissed_priority_items FOR DELETE
  USING (user_id = auth.uid());