import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CompanyContact, FounderInput } from '@/types/portfolio';
import { toast } from 'sonner';

export function useCompanyContacts(companyId: string | undefined) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<CompanyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    if (!user || !companyId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('company_contacts')
        .select('*')
        .eq('company_id', companyId)
        .order('is_primary', { ascending: false });
      
      if (fetchError) throw fetchError;
      
      setContacts((data || []) as CompanyContact[]);
    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

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
    if (!user || !companyId) return null;

    try {
      // If setting as primary, unset other primaries first
      if (contactData.is_primary) {
        await supabase
          .from('company_contacts')
          .update({ is_primary: false })
          .eq('company_id', companyId);
      }

      const { data, error } = await supabase
        .from('company_contacts')
        .insert({
          company_id: companyId,
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
      return data as CompanyContact;
    } catch (err) {
      console.error('Error creating contact:', err);
      toast.error('Failed to add contact');
      return null;
    }
  };

  const updateContact = async (
    contactId: string,
    updates: Partial<Pick<CompanyContact, 'name' | 'email' | 'role' | 'is_founder' | 'is_primary'>>
  ) => {
    if (!companyId) return false;

    try {
      // If setting as primary, unset other primaries first
      if (updates.is_primary) {
        await supabase
          .from('company_contacts')
          .update({ is_primary: false })
          .eq('company_id', companyId)
          .neq('id', contactId);
      }

      const { error } = await supabase
        .from('company_contacts')
        .update(updates)
        .eq('id', contactId);

      if (error) throw error;
      
      await fetchContacts();
      return true;
    } catch (err) {
      console.error('Error updating contact:', err);
      toast.error('Failed to update contact');
      return false;
    }
  };

  const deleteContact = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('company_contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;
      
      await fetchContacts();
      toast.success('Contact removed');
      return true;
    } catch (err) {
      console.error('Error deleting contact:', err);
      toast.error('Failed to remove contact');
      return false;
    }
  };

  const upsertFounders = async (founders: FounderInput[]) => {
    if (!user || !companyId) return false;

    try {
      // Get existing contacts
      const existingIds = contacts.map(c => c.id);
      const incomingIds = founders.filter(f => f.id).map(f => f.id);
      
      // Delete removed contacts
      const toDelete = existingIds.filter(id => !incomingIds.includes(id));
      if (toDelete.length > 0) {
        await supabase
          .from('company_contacts')
          .delete()
          .in('id', toDelete);
      }

      // Ensure only one primary
      const primaryCount = founders.filter(f => f.is_primary).length;
      if (primaryCount > 1) {
        // Keep only the first primary
        let foundFirst = false;
        founders = founders.map(f => {
          if (f.is_primary) {
            if (foundFirst) {
              return { ...f, is_primary: false };
            }
            foundFirst = true;
          }
          return f;
        });
      }

      // Upsert each founder
      for (const founder of founders) {
        if (founder.id) {
          // Update existing
          await supabase
            .from('company_contacts')
            .update({
              name: founder.name,
              email: founder.email || null,
              role: founder.role || null,
              is_primary: founder.is_primary,
            })
            .eq('id', founder.id);
        } else {
          // Insert new
          await supabase
            .from('company_contacts')
            .insert({
              company_id: companyId,
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
      console.error('Error upserting founders:', err);
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
