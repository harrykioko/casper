-- Create pipeline_attachments table
CREATE TABLE pipeline_attachments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_company_id uuid NOT NULL REFERENCES pipeline_companies(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  file_name text NOT NULL,
  storage_path text NOT NULL,
  file_type text,
  file_size integer,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row-Level Security
ALTER TABLE pipeline_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view attachments for their companies"
  ON pipeline_attachments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM pipeline_companies
    WHERE pipeline_companies.id = pipeline_attachments.pipeline_company_id
    AND pipeline_companies.created_by = auth.uid()
  ));

CREATE POLICY "Users can create attachments for their companies"
  ON pipeline_attachments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM pipeline_companies
    WHERE pipeline_companies.id = pipeline_attachments.pipeline_company_id
    AND pipeline_companies.created_by = auth.uid()
  ));

CREATE POLICY "Users can delete attachments for their companies"
  ON pipeline_attachments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM pipeline_companies
    WHERE pipeline_companies.id = pipeline_attachments.pipeline_company_id
    AND pipeline_companies.created_by = auth.uid()
  ));

-- Index for fast lookups
CREATE INDEX idx_pipeline_attachments_company ON pipeline_attachments(pipeline_company_id);

-- Create storage bucket for pipeline attachments (private bucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pipeline-attachments', 'pipeline-attachments', false);

-- Storage RLS policies
CREATE POLICY "Users can upload pipeline attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pipeline-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view their pipeline attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pipeline-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their pipeline attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'pipeline-attachments' AND auth.role() = 'authenticated');