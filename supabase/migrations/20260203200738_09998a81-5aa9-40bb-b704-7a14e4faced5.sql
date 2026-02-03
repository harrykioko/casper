-- Fix Performance Warnings Part 3: Remaining tables with auth_rls_initplan + fix assets duplicate policies

-- =====================================
-- 23. INBOX_SUGGESTIONS (via inbox_items)
-- =====================================
DROP POLICY IF EXISTS "Users can view suggestions for their items" ON public.inbox_suggestions;
CREATE POLICY "Users can view suggestions for their items" ON public.inbox_suggestions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.inbox_items 
    WHERE inbox_items.id = inbox_suggestions.inbox_item_id 
    AND inbox_items.created_by = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can insert suggestions for their items" ON public.inbox_suggestions;
CREATE POLICY "Users can insert suggestions for their items" ON public.inbox_suggestions
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.inbox_items 
    WHERE inbox_items.id = inbox_suggestions.inbox_item_id 
    AND inbox_items.created_by = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can update suggestions for their items" ON public.inbox_suggestions;
CREATE POLICY "Users can update suggestions for their items" ON public.inbox_suggestions
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.inbox_items 
    WHERE inbox_items.id = inbox_suggestions.inbox_item_id 
    AND inbox_items.created_by = (select auth.uid())
  ));

-- =====================================
-- 24. NOTE_LINKS (via project_notes)
-- =====================================
DROP POLICY IF EXISTS "Users can view links for their notes" ON public.note_links;
CREATE POLICY "Users can view links for their notes" ON public.note_links
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.project_notes 
    WHERE project_notes.id = note_links.note_id 
    AND project_notes.created_by = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can create links for their notes" ON public.note_links;
CREATE POLICY "Users can create links for their notes" ON public.note_links
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.project_notes 
    WHERE project_notes.id = note_links.note_id 
    AND project_notes.created_by = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can delete links for their notes" ON public.note_links;
CREATE POLICY "Users can delete links for their notes" ON public.note_links
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.project_notes 
    WHERE project_notes.id = note_links.note_id 
    AND project_notes.created_by = (select auth.uid())
  ));

-- =====================================
-- 25. PROJECT_NOTES
-- =====================================
DROP POLICY IF EXISTS "Users can view their own notes" ON public.project_notes;
CREATE POLICY "Users can view their own notes" ON public.project_notes
  FOR SELECT USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can create notes" ON public.project_notes;
CREATE POLICY "Users can create notes" ON public.project_notes
  FOR INSERT WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can update their own notes" ON public.project_notes;
CREATE POLICY "Users can update their own notes" ON public.project_notes
  FOR UPDATE USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can delete their own notes" ON public.project_notes;
CREATE POLICY "Users can delete their own notes" ON public.project_notes
  FOR DELETE USING ((select auth.uid()) = created_by);

-- =====================================
-- 26. ASSETS - Fix duplicate policies (multiple_permissive_policies warning)
-- Drop all duplicates and consolidate into single optimized policy
-- =====================================
DROP POLICY IF EXISTS "Allow access to assets tied to user-owned projects" ON public.assets;
DROP POLICY IF EXISTS "Users can view assets for their projects" ON public.assets;
DROP POLICY IF EXISTS "Users can create assets for their projects" ON public.assets;
DROP POLICY IF EXISTS "Users can update assets for their projects" ON public.assets;
DROP POLICY IF EXISTS "Users can delete assets for their projects" ON public.assets;

-- Recreate as single optimized policies with (select auth.uid())
CREATE POLICY "Users can view assets for their projects" ON public.assets
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = assets.project_id 
    AND projects.created_by = (select auth.uid())
  ));

CREATE POLICY "Users can create assets for their projects" ON public.assets
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = assets.project_id 
    AND projects.created_by = (select auth.uid())
  ));

CREATE POLICY "Users can update assets for their projects" ON public.assets
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = assets.project_id 
    AND projects.created_by = (select auth.uid())
  ));

CREATE POLICY "Users can delete assets for their projects" ON public.assets
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = assets.project_id 
    AND projects.created_by = (select auth.uid())
  ));