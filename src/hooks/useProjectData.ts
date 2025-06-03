
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  context: string;
}

export function useProjectData() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [project, setProject] = useState<Project>({
    id: "",
    name: "",
    description: "",
    color: "#FF1464",
    context: ""
  });
  const [loading, setLoading] = useState(true);
  
  // Fetch project data
  useEffect(() => {
    if (!id) return;
    
    const fetchProject = async () => {
      try {
        setLoading(true);
        
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();

        if (projectError) throw projectError;

        if (projectData) {
          setProject({
            id: projectData.id,
            name: projectData.name,
            description: projectData.description || "",
            color: projectData.color || "#FF1464",
            context: projectData.context || ""
          });
        }
      } catch (error) {
        console.error('Error fetching project data:', error);
        toast({
          title: "Error",
          description: "Failed to load project data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id, toast]);
  
  const updateProjectContext = async (newContext: string) => {
    if (!id) return;
    
    try {
      const { error } = await supabase
        .from('projects')
        .update({ context: newContext })
        .eq('id', id);

      if (error) throw error;
      
      setProject(prev => ({ ...prev, context: newContext }));
      toast({
        title: "Success",
        description: "Project context updated"
      });
    } catch (error) {
      console.error('Error updating project context:', error);
      toast({
        title: "Error",
        description: "Failed to update project context",
        variant: "destructive"
      });
    }
  };
  
  return {
    project,
    loading,
    updateProjectContext
  };
}
