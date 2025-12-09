import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProjectNote {
  id: string;
  project_id: string;
  title: string | null;
  content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useProjectNotes() {
  const { id: projectId } = useParams<{ id: string }>();
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!projectId) return;

    const fetchNotes = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_notes')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: 'Error loading notes',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setNotes(data || []);
      }
      setLoading(false);
    };

    fetchNotes();
  }, [projectId, toast]);

  const createNote = async (content: string, title?: string) => {
    if (!projectId) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create notes',
        variant: 'destructive',
      });
      return null;
    }

    const { data, error } = await supabase
      .from('project_notes')
      .insert({
        project_id: projectId,
        content,
        title: title || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error creating note',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }

    setNotes(prev => [data, ...prev]);
    toast({ title: 'Note created' });
    return data;
  };

  const updateNote = async (noteId: string, updates: { content?: string; title?: string }) => {
    const { data, error } = await supabase
      .from('project_notes')
      .update(updates)
      .eq('id', noteId)
      .select()
      .single();

    if (error) {
      toast({
        title: 'Error updating note',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    }

    setNotes(prev => prev.map(n => n.id === noteId ? data : n));
    toast({ title: 'Note updated' });
    return data;
  };

  const deleteNote = async (noteId: string) => {
    const { error } = await supabase
      .from('project_notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      toast({
        title: 'Error deleting note',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    setNotes(prev => prev.filter(n => n.id !== noteId));
    toast({ title: 'Note deleted' });
    return true;
  };

  return {
    notes,
    loading,
    createNote,
    updateNote,
    deleteNote,
  };
}
