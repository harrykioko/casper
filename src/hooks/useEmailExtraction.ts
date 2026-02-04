import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ExtractionResult {
  summary: string;
  keyPoints: string[];
  nextStep: { label: string; isActionRequired: boolean };
  categories: string[];
  entities: Array<{ name: string; type: string; confidence: number }>;
  people: Array<{ name: string; email?: string | null; confidence: number }>;
}

export function useEmailExtraction() {
  const queryClient = useQueryClient();

  const extractMutation = useMutation({
    mutationFn: async (inboxItemId: string): Promise<ExtractionResult> => {
      const { data, error } = await supabase.functions.invoke("email-extract-structured", {
        body: { inbox_item_id: inboxItemId },
      });

      if (error) {
        console.error("Extraction error:", error);
        throw new Error(error.message || "Extraction failed");
      }

      if (!data?.success || !data?.extraction) {
        throw new Error(data?.error || "Invalid extraction response");
      }

      return data.extraction as ExtractionResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox_items"] });
      queryClient.invalidateQueries({ queryKey: ["inbox_items_archived"] });
      toast.success("Summary generated");
    },
    onError: (error) => {
      console.error("Extraction failed:", error);
      toast.error("Failed to generate summary. Try again.");
    },
  });

  return {
    extract: extractMutation.mutate,
    extractAsync: extractMutation.mutateAsync,
    isExtracting: extractMutation.isPending,
    error: extractMutation.error,
    lastResult: extractMutation.data,
  };
}
