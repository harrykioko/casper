import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { extractHeuristicSuggestions, SuggestedAction } from "@/lib/inboxSuggestions";
import { cleanEmailContent } from "@/lib/emailCleaners";

interface UseInboxSuggestionsReturn {
  suggestions: SuggestedAction[];
  isLoading: boolean;
  isAI: boolean;
  isGenerating: boolean;
  generateAISuggestions: () => void;
  refreshSuggestions: () => void;
}

export function useInboxSuggestions(
  inboxItemId: string | undefined,
  subject: string,
  textBody: string | null,
  htmlBody: string | null
): UseInboxSuggestionsReturn {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  // Clean the email content for analysis
  const { cleanedText } = useMemo(() => {
    return cleanEmailContent(textBody, htmlBody);
  }, [textBody, htmlBody]);

  // Fetch cached AI suggestions from database
  const { data: cachedSuggestions, isLoading: isLoadingCached } = useQuery({
    queryKey: ["inbox-suggestions", inboxItemId],
    queryFn: async () => {
      if (!inboxItemId) return null;

      const { data, error } = await supabase
        .from("inbox_suggestions")
        .select("*")
        .eq("inbox_item_id", inboxItemId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!inboxItemId,
  });

  // Generate heuristic suggestions as fallback
  const heuristicSuggestions = useMemo(() => {
    if (!cleanedText && !subject) return [];
    return extractHeuristicSuggestions(subject, cleanedText);
  }, [subject, cleanedText]);

  // Determine which suggestions to use
  const suggestions = useMemo(() => {
    if (cachedSuggestions?.suggestions) {
      // Parse cached AI suggestions - handle JSON type from Supabase
      const rawData = cachedSuggestions.suggestions;
      if (Array.isArray(rawData) && rawData.length > 0) {
        return rawData as unknown as SuggestedAction[];
      }
    }
    return heuristicSuggestions;
  }, [cachedSuggestions, heuristicSuggestions]);

  const isAI = !!(cachedSuggestions?.suggestions && 
    Array.isArray(cachedSuggestions.suggestions) && 
    cachedSuggestions.suggestions.length > 0);

  // Mutation to generate AI suggestions
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!inboxItemId) throw new Error("No inbox item ID");

      const { data, error } = await supabase.functions.invoke("inbox-suggest", {
        body: {
          inbox_item_id: inboxItemId,
          subject,
          cleaned_text: cleanedText,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox-suggestions", inboxItemId] });
    },
    onSettled: () => {
      setIsGenerating(false);
    },
  });

  const generateAISuggestions = () => {
    setIsGenerating(true);
    generateMutation.mutate();
  };

  const refreshSuggestions = () => {
    queryClient.invalidateQueries({ queryKey: ["inbox-suggestions", inboxItemId] });
  };

  return {
    suggestions,
    isLoading: isLoadingCached,
    isAI,
    isGenerating,
    generateAISuggestions,
    refreshSuggestions,
  };
}
