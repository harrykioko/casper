import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Note, NoteLink, NoteContext, NoteTargetType, CreateNotePayload, UpdateNotePayload, NotesFilter } from '@/types/notes';

// Transform database row to Note type
function transformNote(row: any): Note {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    noteType: row.note_type,
    projectId: row.project_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    links: row.note_links?.map((link: any) => ({
      id: link.id,
      noteId: link.note_id,
      targetType: link.target_type as NoteTargetType,
      targetId: link.target_id,
      isPrimary: link.is_primary,
      createdAt: link.created_at,
    })) || [],
  };
}

// Hook to fetch notes for a specific target (task, company, project, reading_item)
export function useNotesForTarget({ targetType, targetId }: { targetType: NoteTargetType; targetId: string }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!targetId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch note_links for this target, then get the associated notes
      const { data: links, error: linksError } = await supabase
        .from('note_links')
        .select('note_id')
        .eq('target_type', targetType as any)
        .eq('target_id', targetId);

      if (linksError) throw linksError;

      if (!links || links.length === 0) {
        setNotes([]);
        setLoading(false);
        return;
      }

      const noteIds = links.map(l => l.note_id);

      // Fetch the actual notes with all their links
      const { data: notesData, error: notesError } = await supabase
        .from('project_notes')
        .select(`
          *,
          note_links (*)
        `)
        .in('id', noteIds)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      setNotes((notesData || []).map(transformNote));
    } catch (err) {
      console.error('Error fetching notes for target:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [targetType, targetId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return { notes, loading, error, refetch: fetchNotes };
}

// Hook to fetch all notes for the current user with optional filtering
export function useAllUserNotes(filter?: NotesFilter) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all notes for the user with their links
      let query = supabase
        .from('project_notes')
        .select(`
          *,
          note_links (*)
        `)
        .eq('created_by', user.id)
        .order('updated_at', { ascending: false });

      const { data: notesData, error: notesError } = await query;

      if (notesError) throw notesError;

      let transformedNotes = (notesData || []).map(transformNote);

      // Apply client-side filtering
      if (filter?.targetType && filter.targetType !== 'all') {
        transformedNotes = transformedNotes.filter(note =>
          note.links?.some(link => link.targetType === filter.targetType)
        );
      }

      if (filter?.search) {
        const searchLower = filter.search.toLowerCase();
        transformedNotes = transformedNotes.filter(note =>
          note.content.toLowerCase().includes(searchLower) ||
          (note.title && note.title.toLowerCase().includes(searchLower))
        );
      }

      setNotes(transformedNotes);
    } catch (err) {
      console.error('Error fetching all notes:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user, filter?.targetType, filter?.search]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return { notes, loading, error, refetch: fetchNotes };
}

// Create a new note with polymorphic linking
export async function createNote(payload: CreateNotePayload): Promise<Note | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    toast.error('You must be logged in to create notes');
    return null;
  }

  try {
    // Determine project_id if the primary context is a project
    const projectId = payload.primaryContext.targetType === 'project' 
      ? payload.primaryContext.targetId 
      : null;

    // Insert the note into project_notes
    const { data: noteData, error: noteError } = await supabase
      .from('project_notes')
      .insert({
        title: payload.title || null,
        content: payload.content,
        note_type: payload.noteType || null,
        project_id: projectId,
        created_by: user.id,
      })
      .select()
      .single();

    if (noteError) throw noteError;

    // Create the primary link
    const linksToInsert = [
      {
        note_id: noteData.id,
        target_type: payload.primaryContext.targetType,
        target_id: payload.primaryContext.targetId,
        is_primary: true,
      }
    ];

    // Add secondary context links
    if (payload.secondaryContexts) {
      payload.secondaryContexts.forEach(ctx => {
        linksToInsert.push({
          note_id: noteData.id,
          target_type: ctx.targetType,
          target_id: ctx.targetId,
          is_primary: false,
        });
      });
    }

    const { error: linksError } = await supabase
      .from('note_links')
      .insert(linksToInsert as any);

    if (linksError) throw linksError;

    toast.success('Note created');
    return transformNote({ ...noteData, note_links: linksToInsert });
  } catch (err) {
    console.error('Error creating note:', err);
    toast.error('Failed to create note');
    return null;
  }
}

// Update an existing note
export async function updateNote(noteId: string, updates: UpdateNotePayload): Promise<Note | null> {
  try {
    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.noteType !== undefined) updateData.note_type = updates.noteType;

    const { data, error } = await supabase
      .from('project_notes')
      .update(updateData)
      .eq('id', noteId)
      .select(`
        *,
        note_links (*)
      `)
      .single();

    if (error) throw error;

    toast.success('Note updated');
    return transformNote(data);
  } catch (err) {
    console.error('Error updating note:', err);
    toast.error('Failed to update note');
    return null;
  }
}

// Delete a note (cascades to note_links)
export async function deleteNote(noteId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('project_notes')
      .delete()
      .eq('id', noteId);

    if (error) throw error;

    toast.success('Note deleted');
    return true;
  } catch (err) {
    console.error('Error deleting note:', err);
    toast.error('Failed to delete note');
    return false;
  }
}
