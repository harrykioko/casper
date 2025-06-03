
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Link {
  id: string;
  title: string;
  url: string;
}

export function useProjectLinks() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [links, setLinks] = useState<Link[]>([]);
  
  // Fetch project reading items
  useEffect(() => {
    if (!id) return;
    
    const fetchLinks = async () => {
      try {
        const { data: linksData, error: linksError } = await supabase
          .from('reading_items')
          .select('*')
          .eq('project_id', id)
          .order('created_at', { ascending: false });

        if (linksError) throw linksError;

        if (linksData) {
          const transformedLinks = linksData.map(item => ({
            id: item.id,
            title: item.title,
            url: item.url
          }));
          setLinks(transformedLinks);
        }
      } catch (error) {
        console.error('Error fetching links:', error);
        toast({
          title: "Error",
          description: "Failed to load links",
          variant: "destructive"
        });
      }
    };

    fetchLinks();
  }, [id, toast]);
  
  const addLink = async (link: { title: string, url: string }) => {
    if (!id) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('reading_items')
        .insert({
          title: link.title,
          url: link.url,
          project_id: id,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      const newLink: Link = {
        id: data.id,
        title: data.title,
        url: data.url
      };
      
      setLinks(prev => [newLink, ...prev]);
      toast({
        title: "Success",
        description: "Link added to project"
      });
    } catch (error) {
      console.error('Error adding link:', error);
      toast({
        title: "Error",
        description: "Failed to add link",
        variant: "destructive"
      });
    }
  };
  
  const removeLink = async (linkId: string) => {
    try {
      const { error } = await supabase
        .from('reading_items')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
      
      setLinks(prev => prev.filter(link => link.id !== linkId));
      toast({
        title: "Success",
        description: "Link removed from project"
      });
    } catch (error) {
      console.error('Error removing link:', error);
      toast({
        title: "Error",
        description: "Failed to remove link",
        variant: "destructive"
      });
    }
  };
  
  return {
    links,
    addLink,
    removeLink
  };
}
