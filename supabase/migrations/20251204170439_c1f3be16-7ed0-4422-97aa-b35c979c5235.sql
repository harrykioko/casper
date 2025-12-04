-- Create enums for portfolio module
CREATE TYPE public.company_kind AS ENUM ('portfolio', 'pipeline', 'other');
CREATE TYPE public.company_status AS ENUM ('active', 'watching', 'exited', 'archived');
CREATE TYPE public.interaction_type AS ENUM ('note', 'call', 'meeting', 'email', 'update');

-- Create companies table
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  website_url text,
  logo_url text,
  kind public.company_kind NOT NULL DEFAULT 'portfolio',
  status public.company_status NOT NULL DEFAULT 'active',
  last_interaction_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies
CREATE POLICY "Users can view their own companies" ON public.companies
  FOR SELECT USING (auth.uid() = created_by);
  
CREATE POLICY "Users can create companies" ON public.companies
  FOR INSERT WITH CHECK (auth.uid() = created_by);
  
CREATE POLICY "Users can update their own companies" ON public.companies
  FOR UPDATE USING (auth.uid() = created_by);
  
CREATE POLICY "Users can delete their own companies" ON public.companies
  FOR DELETE USING (auth.uid() = created_by);

-- Updated_at trigger for companies
CREATE TRIGGER handle_companies_updated_at 
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create company_contacts table
CREATE TABLE public.company_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  role text,
  is_founder boolean NOT NULL DEFAULT true,
  is_primary boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on company_contacts
ALTER TABLE public.company_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policy for company_contacts (through company ownership)
CREATE POLICY "Users can view contacts for their companies" ON public.company_contacts
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.companies WHERE companies.id = company_contacts.company_id AND companies.created_by = auth.uid()
  ));

CREATE POLICY "Users can create contacts for their companies" ON public.company_contacts
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.companies WHERE companies.id = company_contacts.company_id AND companies.created_by = auth.uid()
  ));

CREATE POLICY "Users can update contacts for their companies" ON public.company_contacts
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.companies WHERE companies.id = company_contacts.company_id AND companies.created_by = auth.uid()
  ));

CREATE POLICY "Users can delete contacts for their companies" ON public.company_contacts
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.companies WHERE companies.id = company_contacts.company_id AND companies.created_by = auth.uid()
  ));

-- Create company_interactions table
CREATE TABLE public.company_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES public.company_contacts(id) ON DELETE SET NULL,
  interaction_type public.interaction_type NOT NULL,
  content text NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on company_interactions
ALTER TABLE public.company_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_interactions (through company ownership)
CREATE POLICY "Users can view interactions for their companies" ON public.company_interactions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM public.companies WHERE companies.id = company_interactions.company_id AND companies.created_by = auth.uid()
  ));

CREATE POLICY "Users can create interactions for their companies" ON public.company_interactions
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.companies WHERE companies.id = company_interactions.company_id AND companies.created_by = auth.uid()
  ));

CREATE POLICY "Users can update interactions for their companies" ON public.company_interactions
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.companies WHERE companies.id = company_interactions.company_id AND companies.created_by = auth.uid()
  ));

CREATE POLICY "Users can delete interactions for their companies" ON public.company_interactions
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.companies WHERE companies.id = company_interactions.company_id AND companies.created_by = auth.uid()
  ));

-- Trigger function to update last_interaction_at on companies
CREATE OR REPLACE FUNCTION public.update_company_last_interaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.companies 
  SET last_interaction_at = NEW.occurred_at 
  WHERE id = NEW.company_id 
    AND (last_interaction_at IS NULL OR last_interaction_at < NEW.occurred_at);
  RETURN NEW;
END;
$$;

-- Trigger to update last_interaction_at after interaction insert
CREATE TRIGGER update_last_interaction
  AFTER INSERT ON public.company_interactions
  FOR EACH ROW EXECUTE FUNCTION public.update_company_last_interaction();

-- Extend tasks table with company_id
ALTER TABLE public.tasks 
ADD COLUMN company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;