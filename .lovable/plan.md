

# Add File Preview Capability to Pipeline Details Page

## Overview

Add inline preview functionality for files (images and PDFs) in the Pipeline Company Detail Files tab, matching the existing preview capability in the Inbox attachments system.

---

## Current State

The FilesTab component currently allows:
- File upload (with drag and drop)
- File download (opens in new tab)
- File deletion

Missing: **No inline preview capability for images or PDFs**

---

## Implementation

### Part 1: Add Helper Functions to Pipeline Attachments Hook

**File: `src/hooks/usePipelineAttachments.ts`**

Add the same helper functions used by Inbox attachments:

```typescript
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
```

---

### Part 2: Update FilesTab Component

**File: `src/components/pipeline-detail/tabs/FilesTab.tsx`**

#### A. Add preview state and handlers

```typescript
const [previewAttachmentId, setPreviewAttachmentId] = useState<string | null>(null);
const [previewUrl, setPreviewUrl] = useState<string | null>(null);

const handlePreview = async (attachment: PipelineAttachment) => {
  if (previewAttachmentId === attachment.id) {
    // Close preview
    setPreviewAttachmentId(null);
    setPreviewUrl(null);
  } else {
    // Open preview
    const url = await getSignedUrl(attachment.storage_path);
    if (url) {
      setPreviewAttachmentId(attachment.id);
      setPreviewUrl(url);
    }
  }
};
```

#### B. Add Eye/EyeOff button for previewable files

Add a preview toggle button before the download button:

```typescript
{canPreviewInline(attachment.file_type) && (
  <Button
    variant="ghost"
    size="icon"
    className="h-8 w-8"
    onClick={() => handlePreview(attachment)}
    title={isPreviewOpen ? "Hide preview" : "Preview"}
  >
    {isPreviewOpen ? (
      <EyeOff className="w-4 h-4" />
    ) : (
      <Eye className="w-4 h-4" />
    )}
  </Button>
)}
```

#### C. Add AttachmentPreview component

Create an inline preview component that renders below the file card when open:

```typescript
function AttachmentPreview({ 
  attachment, 
  signedUrl, 
  onClose 
}: { 
  attachment: PipelineAttachment; 
  signedUrl: string;
  onClose: () => void;
}) {
  const isImage = attachment.file_type?.startsWith("image/");
  const isPdf = attachment.file_type === "application/pdf";

  return (
    <div className="relative mt-2 rounded-lg border border-border overflow-hidden bg-muted/30">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 bg-background/80 hover:bg-background z-10"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>

      {isImage && (
        <img 
          src={signedUrl} 
          alt={attachment.file_name}
          className="max-w-full max-h-[400px] object-contain mx-auto p-4"
        />
      )}

      {isPdf && (
        <iframe
          src={signedUrl}
          title={attachment.file_name}
          className="w-full h-[500px] border-0"
        />
      )}
    </div>
  );
}
```

#### D. Render preview below file card

```typescript
{attachments.map((attachment) => {
  const FileIcon = getFileIcon(attachment.file_type);
  const isDownloading = downloadingId === attachment.id;
  const isDeleting = deletingId === attachment.id;
  const isPreviewOpen = previewAttachmentId === attachment.id;

  return (
    <div key={attachment.id}>
      <GlassSubcard className="p-3" hoverable={false}>
        {/* existing file card content */}
      </GlassSubcard>
      
      {isPreviewOpen && previewUrl && (
        <AttachmentPreview
          attachment={attachment}
          signedUrl={previewUrl}
          onClose={() => {
            setPreviewAttachmentId(null);
            setPreviewUrl(null);
          }}
        />
      )}
    </div>
  );
})}
```

---

## Visual Flow

```text
Before (current):
+--------------------------------------------------+
| [FileIcon] Upside Invest.pdf                     |
| 2.8 MB - Jan 29, 2026           [Download][Delete]|
+--------------------------------------------------+

After (with preview):
+--------------------------------------------------+
| [FileIcon] Upside Invest.pdf                     |
| 2.8 MB - Jan 29, 2026    [Preview][Download][Delete]|
+--------------------------------------------------+
                    |
                    v (when Preview clicked)
+--------------------------------------------------+
| [FileIcon] Upside Invest.pdf                     |
| 2.8 MB - Jan 29, 2026    [Hide][Download][Delete]|
+--------------------------------------------------+
| +----------------------------------------------+ |
| |                  [X close]                   | |
| |                                              | |
| |        [PDF rendered in iframe]              | |
| |          or                                  | |
| |        [Image displayed inline]              | |
| |                                              | |
| +----------------------------------------------+ |
+--------------------------------------------------+
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/usePipelineAttachments.ts` | Add `canPreviewInline()` helper function |
| `src/components/pipeline-detail/tabs/FilesTab.tsx` | Add preview state, handlers, Eye button, and AttachmentPreview component |

---

## Supported Preview Types

| File Type | Preview Method |
|-----------|----------------|
| PNG, JPEG, GIF, WebP | `<img>` tag |
| PDF | `<iframe>` embed |
| Other files | No preview (download only) |

---

## UX Notes

1. **Toggle behavior**: Clicking Eye opens preview, clicking EyeOff (or X button on preview) closes it
2. **Only one preview at a time**: Opening a new preview auto-closes any open one
3. **PDF height**: 500px iframe for comfortable reading
4. **Image sizing**: Max height 400px with object-contain for proper aspect ratio
5. **Consistent styling**: Matches Casper glassmorphic aesthetic with muted backgrounds and subtle borders

