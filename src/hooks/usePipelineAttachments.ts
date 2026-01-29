import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface PipelineAttachment {
  id: string;
  pipeline_company_id: string;
  created_by: string;
  file_name: string;
  storage_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export function usePipelineAttachments(companyId: string | undefined) {
  const { user } = useAuth();
  const [attachments, setAttachments] = useState<PipelineAttachment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttachments = useCallback(async () => {
    if (!user || !companyId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pipeline_attachments')
        .select('*')
        .eq('pipeline_company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAttachments((data as PipelineAttachment[]) || []);
    } catch (err) {
      console.error('Error fetching attachments:', err);
    } finally {
      setLoading(false);
    }
  }, [user, companyId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const uploadAttachment = async (file: File) => {
    if (!user || !companyId) return null;

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const storagePath = `${companyId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('pipeline-attachments')
        .upload(storagePath, file);

      if (uploadError) throw uploadError;

      // Create attachment record
      const { data, error: insertError } = await supabase
        .from('pipeline_attachments')
        .insert({
          pipeline_company_id: companyId,
          created_by: user.id,
          file_name: file.name,
          storage_path: storagePath,
          file_type: file.type || null,
          file_size: file.size,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setAttachments(prev => [data as PipelineAttachment, ...prev]);
      toast.success('File uploaded');
      return data as PipelineAttachment;
    } catch (err) {
      console.error('Error uploading attachment:', err);
      toast.error('Failed to upload file');
      return null;
    }
  };

  const deleteAttachment = async (attachment: PipelineAttachment) => {
    if (!user) return false;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('pipeline-attachments')
        .remove([attachment.storage_path]);

      if (storageError) throw storageError;

      // Delete record
      const { error: deleteError } = await supabase
        .from('pipeline_attachments')
        .delete()
        .eq('id', attachment.id);

      if (deleteError) throw deleteError;

      setAttachments(prev => prev.filter(a => a.id !== attachment.id));
      toast.success('File deleted');
      return true;
    } catch (err) {
      console.error('Error deleting attachment:', err);
      toast.error('Failed to delete file');
      return false;
    }
  };

  const getSignedUrl = async (storagePath: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from('pipeline-attachments')
        .createSignedUrl(storagePath, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (err) {
      console.error('Error getting signed URL:', err);
      return null;
    }
  };

  return {
    attachments,
    loading,
    uploadAttachment,
    deleteAttachment,
    getSignedUrl,
    refetch: fetchAttachments,
  };
}

// Helper to check if attachment can be previewed inline
export function canPreviewInline(fileType: string | null): boolean {
  if (!fileType) return false;
  const previewable = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp",
    "application/pdf",
  ];
  return previewable.includes(fileType);
}
