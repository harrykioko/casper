
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface LinkInputFieldProps {
  url: string;
  onUrlChange: (value: string) => void;
  isLoading: boolean;
  fetchingMetadata: boolean;
}

export function LinkInputField({ url, onUrlChange, isLoading, fetchingMetadata }: LinkInputFieldProps) {
  return (
    <div className="relative">
      <Input
        placeholder="Enter URL (https://...)"
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        className="pr-10 focus-visible:ring-0 focus-visible:ring-offset-0 border-muted/30 focus-visible:border-muted/50 hover:border-muted/50 transition-colors"
        disabled={isLoading}
        autoFocus
      />
      {fetchingMetadata && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}
    </div>
  );
}
