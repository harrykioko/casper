
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Prompt {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
}

export function useProjectPrompts() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  
  // Fetch project prompts
  useEffect(() => {
    if (!id) return;
    
    const fetchPrompts = async () => {
      try {
        const { data: promptsData, error: promptsError } = await supabase
          .from('prompts')
          .select('*')
          .eq('project_id', id)
          .order('created_at', { ascending: false });

        if (promptsError) throw promptsError;

        if (promptsData) {
          const transformedPrompts = promptsData.map(prompt => ({
            id: prompt.id,
            title: prompt.title,
            description: prompt.description || "",
            content: prompt.content,
            tags: prompt.tags || []
          }));
          setPrompts(transformedPrompts);
        }
      } catch (error) {
        console.error('Error fetching prompts:', error);
        toast({
          title: "Error",
          description: "Failed to load prompts",
          variant: "destructive"
        });
      }
    };

    fetchPrompts();
  }, [id, toast]);
  
  const addPrompt = async (prompt: Omit<Prompt, 'id'>) => {
    if (!id) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('prompts')
        .insert({
          title: prompt.title,
          description: prompt.description,
          content: prompt.content,
          tags: prompt.tags,
          project_id: id,
          created_by: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      const newPrompt: Prompt = {
        id: data.id,
        title: data.title,
        description: data.description || "",
        content: data.content,
        tags: data.tags || []
      };
      
      setPrompts(prev => [newPrompt, ...prev]);
      toast({
        title: "Success",
        description: "Prompt added to project"
      });
    } catch (error) {
      console.error('Error adding prompt:', error);
      toast({
        title: "Error",
        description: "Failed to add prompt",
        variant: "destructive"
      });
    }
  };
  
  return {
    prompts,
    addPrompt
  };
}
