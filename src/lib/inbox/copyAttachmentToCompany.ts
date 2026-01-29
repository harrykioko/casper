import { supabase } from "@/integrations/supabase/client";
import type { InboxAttachment } from "@/hooks/useInboxAttachments";

interface CopyResult {
  success: boolean;
  error?: string;
  attachmentId?: string;
}

/**
 * Copies an inbox attachment to a pipeline company's files.
 * 
 * 1. Gets a signed URL for the source file from inbox-attachments bucket
 * 2. Downloads the file content
 * 3. Uploads to pipeline-attachments bucket under the company's folder
 * 4. Creates a pipeline_attachments record in the database
 */
export async function copyInboxAttachmentToPipeline(
  inboxAttachment: InboxAttachment,
  pipelineCompanyId: string,
  userId: string
): Promise<CopyResult> {
  try {
    // 1. Get signed URL for the source file
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("inbox-attachments")
      .createSignedUrl(inboxAttachment.storagePath, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("Error getting signed URL:", signedUrlError);
      return { success: false, error: "Failed to access source file" };
    }

    // 2. Download the file content
    const response = await fetch(signedUrlData.signedUrl);
    if (!response.ok) {
      return { success: false, error: "Failed to download source file" };
    }
    const blob = await response.blob();

    // 3. Create new path in pipeline-attachments bucket
    // Extract file extension from original filename
    const ext = inboxAttachment.filename.split('.').pop() || '';
    const newPath = `${pipelineCompanyId}/${crypto.randomUUID()}${ext ? `.${ext}` : ''}`;

    // Upload to pipeline-attachments bucket
    const { error: uploadError } = await supabase.storage
      .from("pipeline-attachments")
      .upload(newPath, blob, {
        contentType: inboxAttachment.mimeType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error uploading to pipeline-attachments:", uploadError);
      return { success: false, error: "Failed to upload file" };
    }

    // 4. Create pipeline_attachments record
    const { data: attachmentRecord, error: insertError } = await supabase
      .from("pipeline_attachments")
      .insert({
        pipeline_company_id: pipelineCompanyId,
        created_by: userId,
        file_name: inboxAttachment.filename,
        storage_path: newPath,
        file_type: inboxAttachment.mimeType,
        file_size: inboxAttachment.sizeBytes,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating attachment record:", insertError);
      // Try to clean up the uploaded file
      await supabase.storage.from("pipeline-attachments").remove([newPath]);
      return { success: false, error: "Failed to save attachment record" };
    }

    return { 
      success: true, 
      attachmentId: attachmentRecord.id 
    };
  } catch (error) {
    console.error("Error copying attachment:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

/**
 * Copies multiple inbox attachments to a pipeline company's files.
 */
export async function copyMultipleAttachmentsToPipeline(
  attachments: InboxAttachment[],
  pipelineCompanyId: string,
  userId: string
): Promise<{ successCount: number; failedCount: number; errors: string[] }> {
  const results = await Promise.all(
    attachments.map(attachment => 
      copyInboxAttachmentToPipeline(attachment, pipelineCompanyId, userId)
    )
  );

  const successCount = results.filter(r => r.success).length;
  const failedCount = results.filter(r => !r.success).length;
  const errors = results
    .filter(r => !r.success && r.error)
    .map(r => r.error as string);

  return { successCount, failedCount, errors };
}
