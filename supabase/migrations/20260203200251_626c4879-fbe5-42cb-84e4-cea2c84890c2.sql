-- Fix Performance Warnings Part 1: auth_rls_initplan for direct ownership tables
-- Replace auth.uid() with (select auth.uid()) for better query planning

-- =====================================
-- 1. CATEGORIES
-- =====================================
DROP POLICY IF EXISTS "Users can access their own categories" ON public.categories;
CREATE POLICY "Users can access their own categories" ON public.categories
  FOR ALL USING ((select auth.uid()) = created_by)
  WITH CHECK ((select auth.uid()) = created_by);

-- =====================================
-- 2. COMPANIES
-- =====================================
DROP POLICY IF EXISTS "Users can view their own companies" ON public.companies;
CREATE POLICY "Users can view their own companies" ON public.companies
  FOR SELECT USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can create companies" ON public.companies;
CREATE POLICY "Users can create companies" ON public.companies
  FOR INSERT WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can update their own companies" ON public.companies;
CREATE POLICY "Users can update their own companies" ON public.companies
  FOR UPDATE USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can delete their own companies" ON public.companies;
CREATE POLICY "Users can delete their own companies" ON public.companies
  FOR DELETE USING ((select auth.uid()) = created_by);

-- =====================================
-- 3. COMMITMENTS
-- =====================================
DROP POLICY IF EXISTS "Users can view their own commitments" ON public.commitments;
CREATE POLICY "Users can view their own commitments" ON public.commitments
  FOR SELECT USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can create their own commitments" ON public.commitments;
CREATE POLICY "Users can create their own commitments" ON public.commitments
  FOR INSERT WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can update their own commitments" ON public.commitments;
CREATE POLICY "Users can update their own commitments" ON public.commitments
  FOR UPDATE USING ((select auth.uid()) = created_by) WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can delete their own commitments" ON public.commitments;
CREATE POLICY "Users can delete their own commitments" ON public.commitments
  FOR DELETE USING ((select auth.uid()) = created_by);

-- =====================================
-- 4. PEOPLE
-- =====================================
DROP POLICY IF EXISTS "Users can view their own people" ON public.people;
CREATE POLICY "Users can view their own people" ON public.people
  FOR SELECT USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can create their own people" ON public.people;
CREATE POLICY "Users can create their own people" ON public.people
  FOR INSERT WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can update their own people" ON public.people;
CREATE POLICY "Users can update their own people" ON public.people
  FOR UPDATE USING ((select auth.uid()) = created_by) WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can delete their own people" ON public.people;
CREATE POLICY "Users can delete their own people" ON public.people
  FOR DELETE USING ((select auth.uid()) = created_by);

-- =====================================
-- 5. PERSON_COMPANY_ROLES
-- =====================================
DROP POLICY IF EXISTS "Users can view their own person roles" ON public.person_company_roles;
CREATE POLICY "Users can view their own person roles" ON public.person_company_roles
  FOR SELECT USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can create their own person roles" ON public.person_company_roles;
CREATE POLICY "Users can create their own person roles" ON public.person_company_roles
  FOR INSERT WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can update their own person roles" ON public.person_company_roles;
CREATE POLICY "Users can update their own person roles" ON public.person_company_roles
  FOR UPDATE USING ((select auth.uid()) = created_by) WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can delete their own person roles" ON public.person_company_roles;
CREATE POLICY "Users can delete their own person roles" ON public.person_company_roles
  FOR DELETE USING ((select auth.uid()) = created_by);

-- =====================================
-- 6. CALENDAR_EVENT_LINKS
-- =====================================
DROP POLICY IF EXISTS "Users can view their own event links" ON public.calendar_event_links;
CREATE POLICY "Users can view their own event links" ON public.calendar_event_links
  FOR SELECT USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can insert their own event links" ON public.calendar_event_links;
CREATE POLICY "Users can insert their own event links" ON public.calendar_event_links
  FOR INSERT WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can update their own event links" ON public.calendar_event_links;
CREATE POLICY "Users can update their own event links" ON public.calendar_event_links
  FOR UPDATE USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can delete their own event links" ON public.calendar_event_links;
CREATE POLICY "Users can delete their own event links" ON public.calendar_event_links
  FOR DELETE USING ((select auth.uid()) = created_by);

-- =====================================
-- 7. CALENDAR_EVENT_LINK_SUGGESTIONS
-- =====================================
DROP POLICY IF EXISTS "Users can view their own link suggestions" ON public.calendar_event_link_suggestions;
CREATE POLICY "Users can view their own link suggestions" ON public.calendar_event_link_suggestions
  FOR SELECT USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can insert their own link suggestions" ON public.calendar_event_link_suggestions;
CREATE POLICY "Users can insert their own link suggestions" ON public.calendar_event_link_suggestions
  FOR INSERT WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can update their own link suggestions" ON public.calendar_event_link_suggestions;
CREATE POLICY "Users can update their own link suggestions" ON public.calendar_event_link_suggestions
  FOR UPDATE USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can delete their own link suggestions" ON public.calendar_event_link_suggestions;
CREATE POLICY "Users can delete their own link suggestions" ON public.calendar_event_link_suggestions
  FOR DELETE USING ((select auth.uid()) = created_by);

-- =====================================
-- 8. INBOX_ITEMS
-- =====================================
DROP POLICY IF EXISTS "Users can view their own inbox items" ON public.inbox_items;
CREATE POLICY "Users can view their own inbox items" ON public.inbox_items
  FOR SELECT USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can update their own inbox items" ON public.inbox_items;
CREATE POLICY "Users can update their own inbox items" ON public.inbox_items
  FOR UPDATE USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can delete their own inbox items" ON public.inbox_items;
CREATE POLICY "Users can delete their own inbox items" ON public.inbox_items
  FOR DELETE USING ((select auth.uid()) = created_by);

-- =====================================
-- 9. INBOX_ATTACHMENTS
-- =====================================
DROP POLICY IF EXISTS "Users can view their own attachments" ON public.inbox_attachments;
CREATE POLICY "Users can view their own attachments" ON public.inbox_attachments
  FOR SELECT USING ((select auth.uid()) = created_by);

-- =====================================
-- 10. INBOX_ACTIVITY
-- =====================================
DROP POLICY IF EXISTS "Users can read own inbox activity" ON public.inbox_activity;
CREATE POLICY "Users can read own inbox activity" ON public.inbox_activity
  FOR SELECT USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can insert own inbox activity" ON public.inbox_activity;
CREATE POLICY "Users can insert own inbox activity" ON public.inbox_activity
  FOR INSERT WITH CHECK ((select auth.uid()) = created_by);

-- =====================================
-- 11. DISMISSED_PRIORITY_ITEMS
-- =====================================
DROP POLICY IF EXISTS "Users can view own dismissals" ON public.dismissed_priority_items;
CREATE POLICY "Users can view own dismissals" ON public.dismissed_priority_items
  FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own dismissals" ON public.dismissed_priority_items;
CREATE POLICY "Users can create own dismissals" ON public.dismissed_priority_items
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own dismissals" ON public.dismissed_priority_items;
CREATE POLICY "Users can delete own dismissals" ON public.dismissed_priority_items
  FOR DELETE USING ((select auth.uid()) = user_id);

-- =====================================
-- 12. WORK_ITEMS
-- =====================================
DROP POLICY IF EXISTS "Users can view own work_items" ON public.work_items;
CREATE POLICY "Users can view own work_items" ON public.work_items
  FOR SELECT USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can insert own work_items" ON public.work_items;
CREATE POLICY "Users can insert own work_items" ON public.work_items
  FOR INSERT WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can update own work_items" ON public.work_items;
CREATE POLICY "Users can update own work_items" ON public.work_items
  FOR UPDATE USING ((select auth.uid()) = created_by) WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can delete own work_items" ON public.work_items;
CREATE POLICY "Users can delete own work_items" ON public.work_items
  FOR DELETE USING ((select auth.uid()) = created_by);

-- =====================================
-- 13. ENTITY_LINKS
-- =====================================
DROP POLICY IF EXISTS "Users can view own entity_links" ON public.entity_links;
CREATE POLICY "Users can view own entity_links" ON public.entity_links
  FOR SELECT USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can insert own entity_links" ON public.entity_links;
CREATE POLICY "Users can insert own entity_links" ON public.entity_links
  FOR INSERT WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can update own entity_links" ON public.entity_links;
CREATE POLICY "Users can update own entity_links" ON public.entity_links
  FOR UPDATE USING ((select auth.uid()) = created_by) WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can delete own entity_links" ON public.entity_links;
CREATE POLICY "Users can delete own entity_links" ON public.entity_links
  FOR DELETE USING ((select auth.uid()) = created_by);

-- =====================================
-- 14. ITEM_EXTRACTS
-- =====================================
DROP POLICY IF EXISTS "Users can view own item_extracts" ON public.item_extracts;
CREATE POLICY "Users can view own item_extracts" ON public.item_extracts
  FOR SELECT USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can insert own item_extracts" ON public.item_extracts;
CREATE POLICY "Users can insert own item_extracts" ON public.item_extracts
  FOR INSERT WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can update own item_extracts" ON public.item_extracts;
CREATE POLICY "Users can update own item_extracts" ON public.item_extracts
  FOR UPDATE USING ((select auth.uid()) = created_by) WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can delete own item_extracts" ON public.item_extracts;
CREATE POLICY "Users can delete own item_extracts" ON public.item_extracts
  FOR DELETE USING ((select auth.uid()) = created_by);