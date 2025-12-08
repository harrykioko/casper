-- Add snoozed_until column to tasks table for snooze functionality
ALTER TABLE tasks ADD COLUMN snoozed_until TIMESTAMPTZ NULL;

-- Create index for efficient filtering of snoozed tasks
CREATE INDEX idx_tasks_snoozed_until ON tasks(snoozed_until);