import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Company, CompanyContact, CompanyWithStats } from '@/types/portfolio';
import { toast } from 'sonner';

export function useCompany(companyId: string | undefined) {
  const { user } = useAuth();
  const [company, setCompany] = useState<CompanyWithStats | null>(null);
  const [contacts, setContacts] = useState<CompanyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompany = useCallback(async () => {
    if (!user || !companyId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .maybeSingle();
      
      if (companyError) throw companyError;
      if (!companyData) {
        setError('Company not found');
        setLoading(false);
        return;
      }
      
      // Fetch contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from('company_contacts')
        .select('*')
        .eq('company_id', companyId)
        .order('is_primary', { ascending: false });
      
      if (contactsError) throw contactsError;
      
      // Fetch open task count
      const { count } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('completed', false);
      
      setCompany({
        ...companyData,
        open_task_count: count || 0,
        contacts: contactsData || [],
      } as CompanyWithStats);
      
      setContacts((contactsData || []) as CompanyContact[]);
    } catch (err) {
      console.error('Error fetching company:', err);
      setError('Failed to load company');
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const updateCompany = async (
    updates: Partial<Pick<Company, 'name' | 'website_url' | 'logo_url' | 'status'>>
  ) => {
    if (!companyId) return false;
    
    try {
      const { error } = await supabase
        .from('companies')
        .update(updates)
        .eq('id', companyId);

      if (error) throw error;
      
      await fetchCompany();
      toast.success('Company updated');
      return true;
    } catch (err) {
      console.error('Error updating company:', err);
      toast.error('Failed to update company');
      return false;
    }
  };

  const deleteCompany = async () => {
    if (!companyId) return false;
    
    try {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;
      
      toast.success('Company deleted');
      return true;
    } catch (err) {
      console.error('Error deleting company:', err);
      toast.error('Failed to delete company');
      return false;
    }
  };

  return {
    company,
    contacts,
    loading,
    error,
    updateCompany,
    deleteCompany,
    refetch: fetchCompany,
  };
}
