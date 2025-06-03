
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type AssetType = 'domain' | 'repository' | 'social' | 'notion' | 'figma' | 'drive' | 'other';

export interface Asset {
  id: string;
  project_id: string;
  name: string;
  url: string;
  type: AssetType;
  notes?: string;
  icon?: string;
  created_at: string;
}

export function useAssets(projectId: string) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch assets for the project
  useEffect(() => {
    if (!projectId) return;
    
    const fetchAssets = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('assets')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setAssets(data || []);
      } catch (error) {
        console.error('Error fetching assets:', error);
        toast({
          title: "Error",
          description: "Failed to fetch project assets",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, [projectId, toast]);

  const addAsset = async (assetData: Omit<Asset, 'id' | 'created_at' | 'project_id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Normalize URL (add https:// if missing)
      let normalizedUrl = assetData.url;
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = `https://${normalizedUrl}`;
      }

      const { data, error } = await supabase
        .from('assets')
        .insert({
          ...assetData,
          url: normalizedUrl,
          project_id: projectId
        })
        .select()
        .single();

      if (error) throw error;
      
      setAssets(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Asset added to project"
      });
      
      return data;
    } catch (error) {
      console.error('Error adding asset:', error);
      toast({
        title: "Error",
        description: "Failed to add asset",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteAsset = async (assetId: string) => {
    try {
      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetId);

      if (error) throw error;
      
      setAssets(prev => prev.filter(asset => asset.id !== assetId));
      toast({
        title: "Success",
        description: "Asset removed from project"
      });
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast({
        title: "Error",
        description: "Failed to remove asset",
        variant: "destructive"
      });
    }
  };

  const updateAsset = async (assetId: string, updates: Partial<Omit<Asset, 'id' | 'created_at' | 'project_id'>>) => {
    try {
      // Normalize URL if being updated
      if (updates.url && !updates.url.startsWith('http://') && !updates.url.startsWith('https://')) {
        updates.url = `https://${updates.url}`;
      }

      const { data, error } = await supabase
        .from('assets')
        .update(updates)
        .eq('id', assetId)
        .select()
        .single();

      if (error) throw error;
      
      setAssets(prev => prev.map(asset => asset.id === assetId ? data : asset));
      toast({
        title: "Success",
        description: "Asset updated"
      });
      
      return data;
    } catch (error) {
      console.error('Error updating asset:', error);
      toast({
        title: "Error",
        description: "Failed to update asset",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    assets,
    loading,
    addAsset,
    deleteAsset,
    updateAsset
  };
}
