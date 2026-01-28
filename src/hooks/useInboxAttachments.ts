import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InboxAttachment {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
  createdAt: string;
}

interface UseInboxAttachmentsReturn {
  attachments: InboxAttachment[];
  isLoading: boolean;
  error: Error | null;
  getSignedUrl: (storagePath: string) => Promise<string | null>;
}

export function useInboxAttachments(inboxItemId: string | undefined): UseInboxAttachmentsReturn {
  const { data: attachments = [], isLoading, error } = useQuery({
    queryKey: ["inbox-attachments", inboxItemId],
    queryFn: async () => {
      if (!inboxItemId) return [];

      const { data, error } = await supabase
        .from("inbox_attachments")
        .select("*")
        .eq("inbox_item_id", inboxItemId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      return (data || []).map((row) => ({
        id: row.id,
        filename: row.filename,
        mimeType: row.mime_type,
        sizeBytes: row.size_bytes,
        storagePath: row.storage_path,
        createdAt: row.created_at,
      }));
    },
    enabled: !!inboxItemId,
  });

  const getSignedUrl = async (storagePath: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from("inbox-attachments")
      .createSignedUrl(storagePath, 3600); // 1 hour expiry

    if (error) {
      console.error("Error creating signed URL:", error);
      return null;
    }

    return data?.signedUrl || null;
  };

  return {
    attachments,
    isLoading,
    error: error as Error | null,
    getSignedUrl,
  };
}

// Helper to format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// Helper to get icon name by mime type
export function getFileIcon(mimeType: string): "file" | "image" | "file-text" | "file-video" | "file-audio" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "file-video";
  if (mimeType.startsWith("audio/")) return "file-audio";
  if (mimeType === "application/pdf" || mimeType.includes("text")) return "file-text";
  return "file";
}

// Helper to check if attachment can be previewed inline
export function canPreviewInline(mimeType: string): boolean {
  const previewable = [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
    "image/webp",
    "application/pdf",
  ];
  return previewable.includes(mimeType);
}
