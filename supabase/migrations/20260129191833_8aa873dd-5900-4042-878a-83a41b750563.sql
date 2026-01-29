-- Add company_logo_url column to calendar_event_links table
ALTER TABLE public.calendar_event_links 
ADD COLUMN company_logo_url TEXT;