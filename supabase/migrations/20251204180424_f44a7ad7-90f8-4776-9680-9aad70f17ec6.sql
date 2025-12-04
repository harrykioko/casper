-- Add is_top_of_mind column to pipeline_companies for Dashboard "Pipeline Focus" section
ALTER TABLE pipeline_companies 
ADD COLUMN is_top_of_mind boolean NOT NULL DEFAULT false;

-- Create index for efficient Dashboard queries
CREATE INDEX idx_pipeline_companies_top_of_mind 
ON pipeline_companies(is_top_of_mind) WHERE is_top_of_mind = true;