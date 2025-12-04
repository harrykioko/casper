import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PipelineContact, PipelineFounderInput } from '@/types/pipelineExtended';
import { toast } from 'sonner';

export function usePipelineContacts(pipelineCompanyId: string | undefined) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<PipelineContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    if (!user || !pipelineCompanyId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('pipeline_contacts')
        .select('*')
        .eq('pipeline_company_id', pipelineCompanyId)
        .order('is_primary', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      setContacts((data || []) as PipelineContact[]);
    } catch (err) {
      console.error('Error fetching pipeline contacts:', err);
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [user, pipelineCompanyId]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const createContact = async (contactData: {
    name: string;
    email?: string;
    role?: string;
    is_founder?: boolean;
    is_primary?: boolean;
  }) => {
    if (!user || !pipelineCompanyId) return null;

    try {
      if (contactData.is_primary) {
        await supabase
          .from('pipeline_contacts')
          .update({ is_primary: false })
          .eq('pipeline_company_id', pipelineCompanyId);
      }

      const { data, error } = await supabase
        .from('pipeline_contacts')
        .insert({
          pipeline_company_id: pipelineCompanyId,
          name: contactData.name,
          email: contactData.email || null,
          role: contactData.role || null,
          is_founder: contactData.is_founder ?? true,
          is_primary: contactData.is_primary ?? false,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      await fetchContacts();
      return data as PipelineContact;
    } catch (err) {
      console.error('Error creating pipeline contact:', err);
      toast.error('Failed to add contact');
      return null;
    }
  };

  const updateContact = async (
    contactId: string,
    updates: Partial<Pick<PipelineContact, 'name' | 'email' | 'role' | 'is_founder' | 'is_primary'>>
  ) => {
    if (!pipelineCompanyId) return false;

    try {
      if (updates.is_primary) {
        await supabase
          .from('pipeline_contacts')
          .update({ is_primary: false })
          .eq('pipeline_company_id', pipelineCompanyId)
          .neq('id', contactId);
      }

      const { error } = await supabase
        .from('pipeline_contacts')
        .update(updates)
        .eq('id', contactId);

      if (error) throw error;
      
      await fetchContacts();
      return true;
    } catch (err) {
      console.error('Error updating pipeline contact:', err);
      toast.error('Failed to update contact');
      return false;
    }
  };

  const deleteContact = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('pipeline_contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;
      
      await fetchContacts();
      toast.success('Contact removed');
      return true;
    } catch (err) {
      console.error('Error deleting pipeline contact:', err);
      toast.error('Failed to remove contact');
      return false;
    }
  };

  const upsertFounders = async (founders: PipelineFounderInput[]) => {
    if (!user || !pipelineCompanyId) return false;

    try {
      const existingIds = contacts.map(c => c.id);
      const incomingIds = founders.filter(f => f.id).map(f => f.id);
      
      const toDelete = existingIds.filter(id => !incomingIds.includes(id));
      if (toDelete.length > 0) {
        await supabase
          .from('pipeline_contacts')
          .delete()
          .in('id', toDelete);
      }

      const primaryCount = founders.filter(f => f.is_primary).length;
      let processedFounders = founders;
      if (primaryCount > 1) {
        let foundFirst = false;
        processedFounders = founders.map(f => {
          if (f.is_primary) {
            if (foundFirst) {
              return { ...f, is_primary: false };
            }
            foundFirst = true;
          }
          return f;
        });
      }

      for (const founder of processedFounders) {
        if (founder.id) {
          await supabase
            .from('pipeline_contacts')
            .update({
              name: founder.name,
              email: founder.email || null,
              role: founder.role || null,
              is_primary: founder.is_primary,
            })
            .eq('id', founder.id);
        } else {
          await supabase
            .from('pipeline_contacts')
            .insert({
              pipeline_company_id: pipelineCompanyId,
              name: founder.name,
              email: founder.email || null,
              role: founder.role || null,
              is_founder: true,
              is_primary: founder.is_primary,
              created_by: user.id,
            });
        }
      }

      await fetchContacts();
      return true;
    } catch (err) {
      console.error('Error upserting pipeline founders:', err);
      toast.error('Failed to update founders');
      return false;
    }
  };

  return {
    contacts,
    founders: contacts.filter(c => c.is_founder),
    loading,
    error,
    createContact,
    updateContact,
    deleteContact,
    upsertFounders,
    refetch: fetchContacts,
  };
}
