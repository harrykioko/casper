-- Enable real-time replication for pipeline_companies table
ALTER TABLE pipeline_companies REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE pipeline_companies;