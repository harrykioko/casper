-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can create notes for their projects" ON public.project_notes;
DROP POLICY IF EXISTS "Users can view notes for their projects" ON public.project_notes;
DROP POLICY IF EXISTS "Users can update notes for their projects" ON public.project_notes;
DROP POLICY IF EXISTS "Users can delete notes for their projects" ON public.project_notes;

-- Create new policies that support notes with or without project_id
CREATE POLICY "Users can create notes"
ON public.project_notes
FOR INSERT
WITH CHECK (
  created_by = auth.uid() AND (
    project_id IS NULL 
    OR EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_notes.project_id 
      AND projects.created_by = auth.uid()
    )
  )
);

CREATE POLICY "Users can view their own notes"
ON public.project_notes
FOR SELECT
USING (created_by = auth.uid());

CREATE POLICY "Users can update their own notes"
ON public.project_notes
FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own notes"
ON public.project_notes
FOR DELETE
USING (created_by = auth.uid());