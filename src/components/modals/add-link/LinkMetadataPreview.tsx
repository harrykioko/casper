
import { ExternalLink } from "lucide-react";

interface LinkMetadata {
  title: string;
  description?: string;
  image?: string;
  favicon?: string;
  hostname?: string;
  url: string;
}

interface LinkMetadataPreviewProps {
  metadata: LinkMetadata;
}

export function LinkMetadataPreview({ metadata }: LinkMetadataPreviewProps) {
  return (
    <div className="rounded-lg border border-muted/30 p-3 bg-muted/10">
      <div className="flex gap-3">
        {(metadata.image || metadata.favicon) && (
          <div className="flex-shrink-0">
            <img 
              src={metadata.image || metadata.favicon} 
              alt=""
              className="w-12 h-12 rounded object-cover"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                if (img.src === metadata.image && metadata.favicon) {
                  img.src = metadata.favicon;
                } else {
                  img.style.display = 'none';
                }
              }}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm line-clamp-2">
            {metadata.title}
          </h4>
          {metadata.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {metadata.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            {metadata.hostname}
          </p>
        </div>
      </div>
    </div>
  );
}
