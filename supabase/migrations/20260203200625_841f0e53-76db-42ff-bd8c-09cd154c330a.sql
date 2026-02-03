-- Fix Performance Warnings Part 2: Tables with subquery-based RLS (related to parent table ownership)
-- Replace auth.uid() with (select auth.uid()) in EXISTS subqueries

-- =====================================
-- 15. COMPANY_CONTACTS (via companies)
-- =====================================
DROP POLICY IF EXISTS "Users can view contacts for their companies" ON public.company_contacts;
CREATE POLICY "Users can view contacts for their companies" ON public.company_contacts
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = company_contacts.company_id 
    AND companies.created_by = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can create contacts for their companies" ON public.company_contacts;
CREATE POLICY "Users can create contacts for their companies" ON public.company_contacts
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = company_contacts.company_id 
    AND companies.created_by = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can update contacts for their companies" ON public.company_contacts;
CREATE POLICY "Users can update contacts for their companies" ON public.company_contacts
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = company_contacts.company_id 
    AND companies.created_by = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can delete contacts for their companies" ON public.company_contacts;
CREATE POLICY "Users can delete contacts for their companies" ON public.company_contacts
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = company_contacts.company_id 
    AND companies.created_by = (select auth.uid())
  ));

-- =====================================
-- 16. COMPANY_INTERACTIONS (via companies)
-- =====================================
DROP POLICY IF EXISTS "Users can view interactions for their companies" ON public.company_interactions;
CREATE POLICY "Users can view interactions for their companies" ON public.company_interactions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = company_interactions.company_id 
    AND companies.created_by = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can create interactions for their companies" ON public.company_interactions;
CREATE POLICY "Users can create interactions for their companies" ON public.company_interactions
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = company_interactions.company_id 
    AND companies.created_by = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can update interactions for their companies" ON public.company_interactions;
CREATE POLICY "Users can update interactions for their companies" ON public.company_interactions
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = company_interactions.company_id 
    AND companies.created_by = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can delete interactions for their companies" ON public.company_interactions;
CREATE POLICY "Users can delete interactions for their companies" ON public.company_interactions
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.companies 
    WHERE companies.id = company_interactions.company_id 
    AND companies.created_by = (select auth.uid())
  ));

-- =====================================
-- 17. PIPELINE_COMPANIES
-- =====================================
DROP POLICY IF EXISTS "Pipeline owner write" ON public.pipeline_companies;
CREATE POLICY "Pipeline owner write" ON public.pipeline_companies
  FOR ALL USING ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);

-- =====================================
-- 18. PIPELINE_NOTES
-- =====================================
DROP POLICY IF EXISTS "Notes write" ON public.pipeline_notes;
DROP POLICY IF EXISTS "Notes read" ON public.pipeline_notes;
-- Consolidate into single policy per action to fix multiple_permissive_policies
CREATE POLICY "Users can manage their pipeline notes" ON public.pipeline_notes
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.pipeline_companies 
    WHERE pipeline_companies.id = pipeline_notes.pipeline_id 
    AND pipeline_companies.created_by = (select auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.pipeline_companies 
    WHERE pipeline_companies.id = pipeline_notes.pipeline_id 
    AND pipeline_companies.created_by = (select auth.uid())
  ));

-- =====================================
-- 19. PIPELINE_CONTACTS (via pipeline_companies)
-- =====================================
DROP POLICY IF EXISTS "Users can view contacts for their pipeline companies" ON public.pipeline_contacts;
CREATE POLICY "Users can view contacts for their pipeline companies" ON public.pipeline_contacts
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.pipeline_companies 
    WHERE pipeline_companies.id = pipeline_contacts.pipeline_company_id 
    AND pipeline_companies.created_by = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can create contacts for their pipeline companies" ON public.pipeline_contacts;
CREATE POLICY "Users can create contacts for their pipeline companies" ON public.pipeline_contacts
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.pipeline_companies 
    WHERE pipeline_companies.id = pipeline_contacts.pipeline_company_id 
    AND pipeline_companies.created_by = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can update contacts for their pipeline companies" ON public.pipeline_contacts;
CREATE POLICY "Users can update contacts for their pipeline companies" ON public.pipeline_contacts
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.pipeline_companies 
    WHERE pipeline_companies.id = pipeline_contacts.pipeline_company_id 
    AND pipeline_companies.created_by = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can delete contacts for their pipeline companies" ON public.pipeline_contacts;
CREATE POLICY "Users can delete contacts for their pipeline companies" ON public.pipeline_contacts
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.pipeline_companies 
    WHERE pipeline_companies.id = pipeline_contacts.pipeline_company_id 
    AND pipeline_companies.created_by = (select auth.uid())
  ));

-- =====================================
-- 20. PIPELINE_INTERACTIONS (via pipeline_companies)
-- =====================================
DROP POLICY IF EXISTS "Users can view interactions for their pipeline companies" ON public.pipeline_interactions;
CREATE POLICY "Users can view interactions for their pipeline companies" ON public.pipeline_interactions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.pipeline_companies 
    WHERE pipeline_companies.id = pipeline_interactions.pipeline_company_id 
    AND pipeline_companies.created_by = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can create interactions for their pipeline companies" ON public.pipeline_interactions;
CREATE POLICY "Users can create interactions for their pipeline companies" ON public.pipeline_interactions
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.pipeline_companies 
    WHERE pipeline_companies.id = pipeline_interactions.pipeline_company_id 
    AND pipeline_companies.created_by = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can update interactions for their pipeline companies" ON public.pipeline_interactions;
CREATE POLICY "Users can update interactions for their pipeline companies" ON public.pipeline_interactions
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.pipeline_companies 
    WHERE pipeline_companies.id = pipeline_interactions.pipeline_company_id 
    AND pipeline_companies.created_by = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can delete interactions for their pipeline companies" ON public.pipeline_interactions;
CREATE POLICY "Users can delete interactions for their pipeline companies" ON public.pipeline_interactions
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.pipeline_companies 
    WHERE pipeline_companies.id = pipeline_interactions.pipeline_company_id 
    AND pipeline_companies.created_by = (select auth.uid())
  ));

-- =====================================
-- 21. PIPELINE_ATTACHMENTS (via pipeline_companies)
-- =====================================
DROP POLICY IF EXISTS "Users can view attachments for their companies" ON public.pipeline_attachments;
CREATE POLICY "Users can view attachments for their companies" ON public.pipeline_attachments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.pipeline_companies 
    WHERE pipeline_companies.id = pipeline_attachments.pipeline_company_id 
    AND pipeline_companies.created_by = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can create attachments for their companies" ON public.pipeline_attachments;
CREATE POLICY "Users can create attachments for their companies" ON public.pipeline_attachments
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.pipeline_companies 
    WHERE pipeline_companies.id = pipeline_attachments.pipeline_company_id 
    AND pipeline_companies.created_by = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can delete attachments for their companies" ON public.pipeline_attachments;
CREATE POLICY "Users can delete attachments for their companies" ON public.pipeline_attachments
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.pipeline_companies 
    WHERE pipeline_companies.id = pipeline_attachments.pipeline_company_id 
    AND pipeline_companies.created_by = (select auth.uid())
  ));

-- =====================================
-- 22. PIPELINE_COMPANY_ENRICHMENTS (via pipeline_companies)
-- =====================================
DROP POLICY IF EXISTS "Users can view enrichments for their pipeline companies" ON public.pipeline_company_enrichments;
CREATE POLICY "Users can view enrichments for their pipeline companies" ON public.pipeline_company_enrichments
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.pipeline_companies 
    WHERE pipeline_companies.id = pipeline_company_enrichments.pipeline_company_id 
    AND pipeline_companies.created_by = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can create enrichments for their pipeline companies" ON public.pipeline_company_enrichments;
CREATE POLICY "Users can create enrichments for their pipeline companies" ON public.pipeline_company_enrichments
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.pipeline_companies 
    WHERE pipeline_companies.id = pipeline_company_enrichments.pipeline_company_id 
    AND pipeline_companies.created_by = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can update enrichments for their pipeline companies" ON public.pipeline_company_enrichments;
CREATE POLICY "Users can update enrichments for their pipeline companies" ON public.pipeline_company_enrichments
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.pipeline_companies 
    WHERE pipeline_companies.id = pipeline_company_enrichments.pipeline_company_id 
    AND pipeline_companies.created_by = (select auth.uid())
  ));

DROP POLICY IF EXISTS "Users can delete enrichments for their pipeline companies" ON public.pipeline_company_enrichments;
CREATE POLICY "Users can delete enrichments for their pipeline companies" ON public.pipeline_company_enrichments
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.pipeline_companies 
    WHERE pipeline_companies.id = pipeline_company_enrichments.pipeline_company_id 
    AND pipeline_companies.created_by = (select auth.uid())
  ));