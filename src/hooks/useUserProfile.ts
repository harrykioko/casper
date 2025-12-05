import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useUserProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const updateProfile = async (updates: { full_name?: string; avatar_url?: string }) => {
    if (!user?.id) return;
    
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);
    
    if (error) throw error;
    
    queryClient.invalidateQueries({ queryKey: ['user-profile', user.id] });
  };

  return { profile, isLoading, updateProfile };
}
