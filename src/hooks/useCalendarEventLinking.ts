import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { extractAttendeeDomains } from '@/lib/calendarParsing';
import { normalizeHostname } from '@/lib/domainMatching';
import { upsertAttendeesAsPeople } from '@/services/peopleService';
import type { LinkedCompany, CompanySuggestion, PersonRecord, CompanySearchResult } from '@/types/calendarLinking';

interface CalendarEvent {
  id: string;
  title: string;
  attendees?: Array<{ name: string; email?: string }>;
}

export function useCalendarEventLinking(event: CalendarEvent | null) {
  const { user } = useAuth();
  const [linkedCompany, setLinkedCompany] = useState<LinkedCompany | null>(null);
  const [suggestions, setSuggestions] = useState<CompanySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [eventPeople, setEventPeople] = useState<PersonRecord[]>([]);

  // Fetch existing link for this event
  const fetchLink = useCallback(async () => {
    if (!event?.id || !user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('calendar_event_links')
        .select('*')
        .eq('calendar_event_id', event.id)
        .eq('created_by', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setLinkedCompany({
          id: data.id,
          calendarEventId: data.calendar_event_id,
          companyId: data.company_id,
          companyType: data.company_type as 'pipeline' | 'portfolio',
          companyName: data.company_name,
          companyLogoUrl: data.company_logo_url || null,
          linkedBy: data.linked_by as 'auto' | 'manual',
          confidence: data.confidence,
          createdBy: data.created_by,
          createdAt: data.created_at,
        });
      } else {
        setLinkedCompany(null);
        await fetchOrComputeSuggestions();
      }
    } catch (err) {
      console.error('Error fetching event link:', err);
    } finally {
      setLoading(false);
    }
  }, [event?.id, user]);

  // Fetch existing suggestions or compute new ones
  const fetchOrComputeSuggestions = useCallback(async () => {
    if (!event?.id || !user) return;

    // Check for existing suggestions
    const { data: existingSuggestions, error } = await supabase
      .from('calendar_event_link_suggestions')
      .select('*')
      .eq('calendar_event_id', event.id)
      .eq('created_by', user.id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error fetching suggestions:', error);
      return;
    }

    if (existingSuggestions && existingSuggestions.length > 0) {
      setSuggestions(existingSuggestions.map(transformSuggestion));
      return;
    }

    // Compute suggestions client-side
    await computeSuggestions();
  }, [event?.id, user]);

  const computeSuggestions = useCallback(async () => {
    if (!event?.id || !user) return;

    const domains = extractAttendeeDomains(event.attendees || []);
    if (domains.length === 0) return;

    // Fetch all companies with primary_domain from both tables
    const [pipelineRes, companiesRes] = await Promise.all([
      supabase
        .from('pipeline_companies')
        .select('id, company_name, primary_domain')
        .eq('created_by', user.id)
        .not('primary_domain', 'is', null),
      supabase
        .from('companies')
        .select('id, name, primary_domain')
        .eq('created_by', user.id)
        .not('primary_domain', 'is', null),
    ]);

    const newSuggestions: Array<{
      calendar_event_id: string;
      company_id: string;
      company_type: string;
      company_name: string;
      match_reason: string;
      matched_domain: string;
      matched_attendee_email: string | null;
      confidence: number;
      status: string;
      created_by: string;
    }> = [];

    // Match domains against pipeline companies
    for (const company of pipelineRes.data || []) {
      if (!company.primary_domain) continue;
      const companyDomain = normalizeHostname(company.primary_domain);
      for (const domain of domains) {
        if (domain === companyDomain) {
          // Find the matching attendee email
          const matchingAttendee = (event.attendees || []).find(
            a => a.email && a.email.toLowerCase().endsWith(`@${domain}`)
          );
          newSuggestions.push({
            calendar_event_id: event.id,
            company_id: company.id,
            company_type: 'pipeline',
            company_name: company.company_name,
            match_reason: 'domain_match',
            matched_domain: domain,
            matched_attendee_email: matchingAttendee?.email || null,
            confidence: 0.9,
            status: 'pending',
            created_by: user.id,
          });
          break;
        }
      }
    }

    // Match domains against portfolio companies
    for (const company of companiesRes.data || []) {
      if (!company.primary_domain) continue;
      const companyDomain = normalizeHostname(company.primary_domain);
      for (const domain of domains) {
        if (domain === companyDomain) {
          const matchingAttendee = (event.attendees || []).find(
            a => a.email && a.email.toLowerCase().endsWith(`@${domain}`)
          );
          newSuggestions.push({
            calendar_event_id: event.id,
            company_id: company.id,
            company_type: 'portfolio',
            company_name: company.name,
            match_reason: 'domain_match',
            matched_domain: domain,
            matched_attendee_email: matchingAttendee?.email || null,
            confidence: 0.9,
            status: 'pending',
            created_by: user.id,
          });
          break;
        }
      }
    }

    // Also match event title keywords against company names
    const titleWords = event.title.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    for (const company of [...(pipelineRes.data || []), ...(companiesRes.data || [])]) {
      const name = 'company_name' in company ? company.company_name : company.name;
      const type = 'company_name' in company ? 'pipeline' : 'portfolio';
      // Skip if already matched via domain
      if (newSuggestions.some(s => s.company_id === company.id && s.company_type === type)) continue;
      const companyNameLower = name.toLowerCase();
      if (titleWords.some(word => companyNameLower.includes(word) && word.length > 3)) {
        newSuggestions.push({
          calendar_event_id: event.id,
          company_id: company.id,
          company_type: type,
          company_name: name,
          match_reason: 'title_match',
          matched_domain: null,
          matched_attendee_email: null,
          confidence: 0.5,
          status: 'pending',
          created_by: user.id,
        });
      }
    }

    if (newSuggestions.length > 0) {
      const { data: inserted, error } = await supabase
        .from('calendar_event_link_suggestions')
        .upsert(newSuggestions, { onConflict: 'calendar_event_id,company_id,company_type' })
        .select();

      if (!error && inserted) {
        setSuggestions(inserted.map(transformSuggestion));
      }
    }
  }, [event?.id, event?.title, event?.attendees, user]);

  // Background: upsert attendees as people
  useEffect(() => {
    if (!event?.attendees || !user) return;
    upsertAttendeesAsPeople(event.attendees, user.id)
      .then(setEventPeople)
      .catch(err => console.error('Error upserting people:', err));
  }, [event?.attendees, user]);

  // Fetch link on mount
  useEffect(() => {
    fetchLink();
  }, [fetchLink]);

  const linkCompany = useCallback(async (company: CompanySearchResult) => {
    if (!event?.id || !user) return;

    try {
      const { data, error } = await supabase
        .from('calendar_event_links')
        .upsert({
          calendar_event_id: event.id,
          company_id: company.id,
          company_type: company.type,
          company_name: company.name,
          company_logo_url: company.logoUrl || null,
          linked_by: 'manual',
          confidence: 1.0,
          created_by: user.id,
        }, { onConflict: 'calendar_event_id,company_id,company_type' })
        .select()
        .single();

      if (error) throw error;

      setLinkedCompany({
        id: data.id,
        calendarEventId: data.calendar_event_id,
        companyId: data.company_id,
        companyType: data.company_type as 'pipeline' | 'portfolio',
        companyName: data.company_name,
        companyLogoUrl: data.company_logo_url || null,
        linkedBy: data.linked_by as 'auto' | 'manual',
        confidence: data.confidence,
        createdBy: data.created_by,
        createdAt: data.created_at,
      });
      setSuggestions([]);
      toast.success(`Linked to ${company.name}`);
    } catch (err) {
      console.error('Error linking company:', err);
      toast.error('Failed to link company');
    }
  }, [event?.id, user]);

  const unlinkCompany = useCallback(async () => {
    if (!linkedCompany) return;

    try {
      const { error } = await supabase
        .from('calendar_event_links')
        .delete()
        .eq('id', linkedCompany.id);

      if (error) throw error;

      setLinkedCompany(null);
      toast.success('Company unlinked');
      // Re-fetch suggestions
      fetchOrComputeSuggestions();
    } catch (err) {
      console.error('Error unlinking company:', err);
      toast.error('Failed to unlink company');
    }
  }, [linkedCompany, fetchOrComputeSuggestions]);

  const acceptSuggestion = useCallback(async (suggestion: CompanySuggestion) => {
    if (!event?.id || !user) return;

    try {
      // Update suggestion status
      await supabase
        .from('calendar_event_link_suggestions')
        .update({ status: 'accepted' })
        .eq('id', suggestion.id);

      // Fetch the company's logo before linking
      let logoUrl: string | null = null;
      if (suggestion.companyType === 'pipeline') {
        const { data } = await supabase
          .from('pipeline_companies')
          .select('logo_url')
          .eq('id', suggestion.companyId)
          .single();
        logoUrl = data?.logo_url || null;
      } else {
        const { data } = await supabase
          .from('companies')
          .select('logo_url')
          .eq('id', suggestion.companyId)
          .single();
        logoUrl = data?.logo_url || null;
      }

      // Create the actual link with the logo
      await linkCompany({
        id: suggestion.companyId,
        name: suggestion.companyName,
        type: suggestion.companyType,
        primaryDomain: suggestion.matchedDomain,
        logoUrl: logoUrl,
      });
    } catch (err) {
      console.error('Error accepting suggestion:', err);
      toast.error('Failed to accept suggestion');
    }
  }, [event?.id, user, linkCompany]);

  const dismissSuggestion = useCallback(async (suggestion: CompanySuggestion) => {
    try {
      await supabase
        .from('calendar_event_link_suggestions')
        .update({ status: 'dismissed' })
        .eq('id', suggestion.id);

      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    } catch (err) {
      console.error('Error dismissing suggestion:', err);
    }
  }, []);

  const searchCompanies = useCallback(async (query: string): Promise<CompanySearchResult[]> => {
    if (!query || query.length < 2) return [];

    const [pipelineRes, companiesRes] = await Promise.all([
      supabase
        .from('pipeline_companies')
        .select('id, company_name, primary_domain, logo_url')
        .ilike('company_name', `%${query}%`)
        .limit(5),
      supabase
        .from('companies')
        .select('id, name, primary_domain, logo_url')
        .ilike('name', `%${query}%`)
        .limit(5),
    ]);

    const results: CompanySearchResult[] = [];

    for (const c of pipelineRes.data || []) {
      results.push({
        id: c.id,
        name: c.company_name,
        type: 'pipeline',
        primaryDomain: c.primary_domain,
        logoUrl: c.logo_url,
      });
    }

    for (const c of companiesRes.data || []) {
      results.push({
        id: c.id,
        name: c.name,
        type: 'portfolio',
        primaryDomain: c.primary_domain,
        logoUrl: c.logo_url,
      });
    }

    return results;
  }, []);

  return {
    linkedCompany,
    suggestions,
    loading,
    linkCompany,
    unlinkCompany,
    acceptSuggestion,
    dismissSuggestion,
    eventPeople,
    searchCompanies,
  };
}

function transformSuggestion(row: any): CompanySuggestion {
  return {
    id: row.id,
    calendarEventId: row.calendar_event_id,
    companyId: row.company_id,
    companyType: row.company_type,
    companyName: row.company_name,
    matchReason: row.match_reason,
    matchedDomain: row.matched_domain,
    matchedAttendeeEmail: row.matched_attendee_email,
    confidence: row.confidence,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}
