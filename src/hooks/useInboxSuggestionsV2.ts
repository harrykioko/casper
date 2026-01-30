// useInboxSuggestionsV2 - VC-Intent Aware Suggestions Hook

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  EmailIntent,
  StructuredSuggestion,
  CandidateCompany,
  InboxSuggestionsResponse,
} from "@/types/inboxSuggestions";

interface UseInboxSuggestionsV2Return {
  suggestions: StructuredSuggestion[];
  intent: EmailIntent | null;
  intentConfidence: "low" | "medium" | "high" | null;
  candidateCompanies: CandidateCompany[];
  isLoading: boolean;
  isGenerating: boolean;
  isAI: boolean;
  generatedAt: string | null;
  generateSuggestions: (force?: boolean) => void;
  dismissSuggestion: (suggestionId: string) => void;
}

export function useInboxSuggestionsV2(
  inboxItemId: string | undefined
): UseInboxSuggestionsV2Return {
  const queryClient = useQueryClient();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const autoGenRef = useRef<string | null>(null);

  // Fetch cached suggestions from database
  const { data: cachedData, isLoading } = useQuery({
    queryKey: ["inbox-suggestions-v2", inboxItemId],
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

  // Parse cached data
  const parsedData = useMemo(() => {
    if (!cachedData) return null;

    // Check if this is V2 data
    const rawData = cachedData as {
      version?: number;
      suggestions?: unknown;
      intent?: string;
      candidate_companies?: unknown;
      dismissed_ids?: unknown;
      generated_at?: string;
    };

    if (rawData.version !== 2) return null;

    const suggestions = (rawData.suggestions || []) as StructuredSuggestion[];
    const intent = rawData.intent as EmailIntent | undefined;
    const candidateCompanies = (rawData.candidate_companies || []) as CandidateCompany[];
    const dismissedFromDb = (rawData.dismissed_ids || []) as string[];

    return {
      suggestions,
      intent: intent || null,
      candidateCompanies,
      generatedAt: rawData.generated_at || null,
      dismissedFromDb: new Set(dismissedFromDb),
    };
  }, [cachedData]);

  // Filter out dismissed suggestions
  const visibleSuggestions = useMemo(() => {
    if (!parsedData) return [];

    const allDismissed = new Set([
      ...parsedData.dismissedFromDb,
      ...dismissedIds,
    ]);

    return parsedData.suggestions.filter((s) => !allDismissed.has(s.id));
  }, [parsedData, dismissedIds]);

  // Mutation to generate suggestions
  const generateMutation = useMutation({
    mutationFn: async (force: boolean = false) => {
      if (!inboxItemId) throw new Error("No inbox item ID");

      const { data, error } = await supabase.functions.invoke("inbox-suggest-v2", {
        body: {
          inbox_item_id: inboxItemId,
          force,
        },
      });

      if (error) throw error;
      return data as InboxSuggestionsResponse;
    },
    onSuccess: () => {
      setDismissedIds(new Set()); // Reset local dismissals
      queryClient.invalidateQueries({ queryKey: ["inbox-suggestions-v2", inboxItemId] });
    },
    onSettled: () => {
      setIsGenerating(false);
    },
  });

  // Auto-generate suggestions when an item is opened and none exist yet
  useEffect(() => {
    if (
      !isLoading &&
      inboxItemId &&
      !parsedData &&
      !cachedData &&
      !isGenerating &&
      autoGenRef.current !== inboxItemId
    ) {
      autoGenRef.current = inboxItemId;
      setIsGenerating(true);
      generateMutation.mutate(false);
    }
  }, [isLoading, inboxItemId, parsedData, cachedData, isGenerating, generateMutation]);

  const generateSuggestions = useCallback(
    (force: boolean = false) => {
      setIsGenerating(true);
      generateMutation.mutate(force);
    },
    [generateMutation]
  );

  // Dismiss a suggestion (local state + persist to DB)
  const dismissSuggestion = useCallback(
    async (suggestionId: string) => {
      setDismissedIds((prev) => new Set([...prev, suggestionId]));

      // Persist to database
      if (inboxItemId && parsedData) {
        const allDismissed = [
          ...parsedData.dismissedFromDb,
          ...dismissedIds,
          suggestionId,
        ];

        await supabase
          .from("inbox_suggestions")
          .update({ dismissed_ids: allDismissed })
          .eq("inbox_item_id", inboxItemId);
      }
    },
    [inboxItemId, parsedData, dismissedIds]
  );

  return {
    suggestions: visibleSuggestions,
    intent: parsedData?.intent || null,
    intentConfidence: parsedData ? "high" : null,
    candidateCompanies: parsedData?.candidateCompanies || [],
    isLoading,
    isGenerating,
    isAI: !!parsedData && visibleSuggestions.length > 0,
    generatedAt: parsedData?.generatedAt || null,
    generateSuggestions,
    dismissSuggestion,
  };
}
