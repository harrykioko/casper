/**
 * usePeople Hook
 *
 * Manages the unified people directory with CRUD operations,
 * company role assignments, and relationship tracking.
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Person,
  PersonWithRoles,
  PersonInsert,
  PersonUpdate,
  CompanyRole,
  CompanyRoleInsert,
  PersonProfile,
  transformPerson,
  transformPersonWithRoles,
  transformPersonForDatabase,
  transformCompanyRoleForDatabase,
} from '@/types/person';

interface UsePeopleOptions {
  companyId?: string;
  companyType?: 'portfolio' | 'pipeline';
  vipOnly?: boolean;
  relationshipTier?: string;
  search?: string;
}

interface UsePeopleReturn {
  people: PersonWithRoles[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createPerson: (data: PersonInsert) => Promise<Person>;
  updatePerson: (id: string, updates: PersonUpdate) => Promise<Person>;
  deletePerson: (id: string) => Promise<void>;
  addCompanyRole: (data: CompanyRoleInsert) => Promise<CompanyRole>;
  removeCompanyRole: (roleId: string) => Promise<void>;
  updateCompanyRole: (roleId: string, updates: Partial<CompanyRoleInsert>) => Promise<CompanyRole>;
  getVipPeople: () => PersonWithRoles[];
  getPeopleByCompany: (companyId: string, companyType: 'portfolio' | 'pipeline') => PersonWithRoles[];
  searchPeople: (query: string) => PersonWithRoles[];
}

export function usePeople(options: UsePeopleOptions = {}): UsePeopleReturn {
  const [people, setPeople] = useState<PersonWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPeople = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Use the view that includes company roles
      let query = supabase
        .from('people_with_roles')
        .select('*')
        .order('name', { ascending: true });

      // Apply VIP filter
      if (options.vipOnly) {
        query = query.eq('is_vip', true);
      }

      // Apply relationship tier filter
      if (options.relationshipTier) {
        query = query.eq('relationship_tier', options.relationshipTier);
      }

      // Apply search filter
      if (options.search) {
        query = query.or(`name.ilike.%${options.search}%,email.ilike.%${options.search}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      let transformedPeople = (data || []).map(transformPersonWithRoles);

      // Apply company filter (post-fetch since it requires checking nested roles)
      if (options.companyId) {
        transformedPeople = transformedPeople.filter(p =>
          p.companyRoles.some(
            r => r.companyId === options.companyId &&
              (!options.companyType || r.companyType === options.companyType)
          )
        );
      }

      setPeople(transformedPeople);
    } catch (err) {
      setError('Failed to fetch people');
    } finally {
      setLoading(false);
    }
  }, [options.companyId, options.companyType, options.vipOnly, options.relationshipTier, options.search]);

  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);

  const createPerson = async (data: PersonInsert): Promise<Person> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const dbData = transformPersonForDatabase(data);

    const { data: created, error: createError } = await supabase
      .from('people')
      .insert({
        ...dbData,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) throw createError;

    const transformedPerson = transformPerson(created);

    // Add to state with empty roles
    const personWithRoles: PersonWithRoles = {
      ...transformedPerson,
      companyRoles: [],
    };
    setPeople(prev => [personWithRoles, ...prev]);

    return transformedPerson;
  };

  const updatePerson = async (id: string, updates: PersonUpdate): Promise<Person> => {
    const dbUpdates = transformPersonForDatabase(updates);

    const { data, error: updateError } = await supabase
      .from('people')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    const transformedPerson = transformPerson(data);

    // Update in state, preserving existing roles
    setPeople(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...transformedPerson,
          companyRoles: p.companyRoles,
        };
      }
      return p;
    }));

    return transformedPerson;
  };

  const deletePerson = async (id: string): Promise<void> => {
    const { error: deleteError } = await supabase
      .from('people')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    setPeople(prev => prev.filter(p => p.id !== id));
  };

  const addCompanyRole = async (data: CompanyRoleInsert): Promise<CompanyRole> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const dbData = transformCompanyRoleForDatabase(data);

    const { data: created, error: createError } = await supabase
      .from('person_company_roles')
      .insert({
        ...dbData,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) throw createError;

    const role: CompanyRole = {
      roleId: created.id,
      companyId: created.company_id,
      companyType: created.company_type as 'portfolio' | 'pipeline',
      role: created.role,
      isFounder: created.is_founder,
      isPrimaryContact: created.is_primary_contact,
      isCurrent: created.is_current,
      startedAt: created.started_at,
      endedAt: created.ended_at,
    };

    // Update person in state with new role
    setPeople(prev => prev.map(p => {
      if (p.id === data.personId) {
        return {
          ...p,
          companyRoles: [...p.companyRoles, role],
        };
      }
      return p;
    }));

    return role;
  };

  const removeCompanyRole = async (roleId: string): Promise<void> => {
    const { error: deleteError } = await supabase
      .from('person_company_roles')
      .delete()
      .eq('id', roleId);

    if (deleteError) throw deleteError;

    // Remove role from state
    setPeople(prev => prev.map(p => ({
      ...p,
      companyRoles: p.companyRoles.filter(r => r.roleId !== roleId),
    })));
  };

  const updateCompanyRole = async (
    roleId: string,
    updates: Partial<CompanyRoleInsert>
  ): Promise<CompanyRole> => {
    const dbUpdates: any = {};
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.isFounder !== undefined) dbUpdates.is_founder = updates.isFounder;
    if (updates.isPrimaryContact !== undefined) dbUpdates.is_primary_contact = updates.isPrimaryContact;
    if (updates.isCurrent !== undefined) dbUpdates.is_current = updates.isCurrent;
    if (updates.startedAt !== undefined) dbUpdates.started_at = updates.startedAt;
    if (updates.endedAt !== undefined) dbUpdates.ended_at = updates.endedAt;

    const { data, error: updateError } = await supabase
      .from('person_company_roles')
      .update(dbUpdates)
      .eq('id', roleId)
      .select()
      .single();

    if (updateError) throw updateError;

    const role: CompanyRole = {
      roleId: data.id,
      companyId: data.company_id,
      companyType: data.company_type as 'portfolio' | 'pipeline',
      role: data.role,
      isFounder: data.is_founder,
      isPrimaryContact: data.is_primary_contact,
      isCurrent: data.is_current,
      startedAt: data.started_at,
      endedAt: data.ended_at,
    };

    // Update role in state
    setPeople(prev => prev.map(p => ({
      ...p,
      companyRoles: p.companyRoles.map(r =>
        r.roleId === roleId ? role : r
      ),
    })));

    return role;
  };

  // Computed getters
  const getVipPeople = useCallback(() => {
    return people.filter(p => p.isVip);
  }, [people]);

  const getPeopleByCompany = useCallback((
    companyId: string,
    companyType: 'portfolio' | 'pipeline'
  ) => {
    return people.filter(p =>
      p.companyRoles.some(
        r => r.companyId === companyId && r.companyType === companyType && r.isCurrent
      )
    );
  }, [people]);

  const searchPeople = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return people.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      (p.email && p.email.toLowerCase().includes(lowerQuery))
    );
  }, [people]);

  return {
    people,
    loading,
    error,
    refetch: fetchPeople,
    createPerson,
    updatePerson,
    deletePerson,
    addCompanyRole,
    removeCompanyRole,
    updateCompanyRole,
    getVipPeople,
    getPeopleByCompany,
    searchPeople,
  };
}

/**
 * Hook to get a single person with their full profile
 */
export function usePerson(personId: string | undefined) {
  const [person, setPerson] = useState<PersonWithRoles | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!personId) {
      setPerson(null);
      setLoading(false);
      return;
    }

    const fetchPerson = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('people_with_roles')
          .select('*')
          .eq('id', personId)
          .single();

        if (fetchError) {
          setError(fetchError.message);
          return;
        }

        setPerson(transformPersonWithRoles(data));
      } catch (err) {
        setError('Failed to fetch person');
      } finally {
        setLoading(false);
      }
    };

    fetchPerson();
  }, [personId]);

  return { person, loading, error };
}

/**
 * Hook to get a full person profile with related data
 */
export function usePersonProfile(personId: string | undefined) {
  const [profile, setProfile] = useState<PersonProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!personId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch person with roles
        const { data: personData, error: personError } = await supabase
          .from('people_with_roles')
          .select('*')
          .eq('id', personId)
          .single();

        if (personError) {
          setError(personError.message);
          return;
        }

        const person = transformPersonWithRoles(personData);

        // Fetch related data in parallel
        const [
          commitmentsResult,
          interactionsResult,
          meetingsResult,
          tasksResult,
          emailsResult,
        ] = await Promise.all([
          // Open commitments for this person
          supabase
            .from('commitments')
            .select('id, content, status, due_at, promised_at')
            .eq('person_id', personId)
            .eq('status', 'open')
            .order('due_at', { ascending: true })
            .limit(5),

          // Recent interactions (from both portfolio and pipeline)
          supabase
            .from('company_interactions')
            .select('id, interaction_type, content, occurred_at')
            .eq('person_id', personId)
            .order('occurred_at', { ascending: false })
            .limit(5),

          // Upcoming meetings (from calendar)
          supabase
            .from('calendar_events')
            .select('id, title, start_time')
            .gte('start_time', new Date().toISOString())
            .order('start_time', { ascending: true })
            .limit(5),

          // Related tasks (placeholder - will need to implement task<->person linking)
          Promise.resolve({ data: [], error: null }),

          // Related emails (from inbox_items)
          supabase
            .from('inbox_items')
            .select('id, subject, received_at, is_read')
            .ilike('from_email', person.email || '')
            .order('received_at', { ascending: false })
            .limit(5),
        ]);

        // Build companies list from roles
        const companiesPromises = person.companyRoles.map(async (role) => {
          let companyData;
          if (role.companyType === 'portfolio') {
            const { data } = await supabase
              .from('companies')
              .select('id, name, logo_url')
              .eq('id', role.companyId)
              .single();
            companyData = data;
          } else {
            const { data } = await supabase
              .from('pipeline_companies')
              .select('id, name, logo_url')
              .eq('id', role.companyId)
              .single();
            companyData = data;
          }

          return {
            id: role.companyId,
            name: companyData?.name || role.companyName || 'Unknown',
            type: role.companyType,
            role: role.role,
            isFounder: role.isFounder,
            isPrimaryContact: role.isPrimaryContact,
            isCurrent: role.isCurrent,
            logoUrl: companyData?.logo_url,
          };
        });

        const companies = await Promise.all(companiesPromises);

        const fullProfile: PersonProfile = {
          person,
          companies,
          commitments: (commitmentsResult.data || []).map(c => ({
            id: c.id,
            content: c.content,
            status: c.status,
            dueAt: c.due_at,
            promisedAt: c.promised_at,
          })),
          recentInteractions: ((interactionsResult.data as any[]) || []).map((i: any) => ({
            id: i.id,
            type: i.interaction_type,
            content: i.content,
            occurredAt: i.occurred_at,
          })),
          upcomingMeetings: (meetingsResult.data || []).map(m => ({
            id: m.id,
            title: m.title,
            startTime: m.start_time,
          })),
          relatedTasks: tasksResult.data || [],
          relatedEmails: (emailsResult.data || []).map(e => ({
            id: e.id,
            subject: e.subject,
            receivedAt: e.received_at,
            isRead: e.is_read,
          })),
        };

        setProfile(fullProfile);
      } catch (err) {
        setError('Failed to fetch person profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [personId]);

  return { profile, loading, error };
}

/**
 * Hook to find or create a person by email
 */
export function useFindOrCreatePerson() {
  const findOrCreate = async (
    name: string,
    email?: string
  ): Promise<Person> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Try to find existing person by email
    if (email) {
      const { data: existing } = await supabase
        .from('people')
        .select('*')
        .eq('email', email)
        .eq('created_by', user.id)
        .single();

      if (existing) {
        return transformPerson(existing);
      }
    }

    // Create new person
    const { data: created, error: createError } = await supabase
      .from('people')
      .insert({
        name,
        email,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) throw createError;

    return transformPerson(created);
  };

  return { findOrCreate };
}
