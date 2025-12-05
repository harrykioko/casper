-- Create inbox_items table for forwarded emails
CREATE TABLE public.inbox_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  from_name TEXT,
  from_email TEXT NOT NULL,
  to_email TEXT,
  snippet TEXT,
  text_body TEXT,
  html_body TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  snoozed_until TIMESTAMPTZ,
  related_company_id UUID,
  related_company_name TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inbox_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can only access their own items
CREATE POLICY "Users can view their own inbox items"
  ON public.inbox_items FOR SELECT
  USING (auth.uid() = created_by);

CREATE POLICY "Users can update their own inbox items"
  ON public.inbox_items FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own inbox items"
  ON public.inbox_items FOR DELETE
  USING (auth.uid() = created_by);

-- Service role insert policy (for edge function with service key)
CREATE POLICY "Service role can insert inbox items"
  ON public.inbox_items FOR INSERT
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX idx_inbox_items_created_by ON public.inbox_items(created_by);
CREATE INDEX idx_inbox_items_received_at ON public.inbox_items(received_at DESC);
CREATE INDEX idx_inbox_items_is_resolved ON public.inbox_items(is_resolved);
CREATE INDEX idx_inbox_items_snoozed ON public.inbox_items(snoozed_until) WHERE snoozed_until IS NOT NULL;

-- Updated_at trigger
CREATE TRIGGER handle_inbox_items_updated_at
  BEFORE UPDATE ON public.inbox_items
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();