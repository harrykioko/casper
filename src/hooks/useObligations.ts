/**
 * useObligations Hook
 *
 * Filtered query hook for the Obligations page with direction, status,
 * person, and company filters.
 */

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Commitment,
  CommitmentDirection,
  CommitmentStatus,
  transformCommitment,
} from "@/types/commitment";

export interface ObligationFilters {
  direction?: CommitmentDirection | "all";
  status?: CommitmentStatus | "all";
  search?: string;
  personId?: string;
  companyId?: string;
}

export function useObligations(filters: ObligationFilters = {}) {
  const { user } = useAuth();

  const queryKey = ["obligations", user?.id, filters];

  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user?.id) return { items: [], counts: { total: 0, owedByMe: 0, owedToMe: 0 } };

      let query = supabase
        .from("commitments")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      // Direction filter
      if (filters.direction && filters.direction !== "all") {
        query = query.eq("direction", filters.direction);
      }

      // Status filter
      if (filters.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      } else {
        // Default: show active obligations
        query = query.in("status", ["open", "waiting_on"]);
      }

      // Person filter
      if (filters.personId) {
        query = query.eq("person_id", filters.personId);
      }

      // Company filter
      if (filters.companyId) {
        query = query.eq("company_id", filters.companyId);
      }

      const { data: rows, error } = await query;

      if (error) {
        console.error("[useObligations] Error:", error);
        throw error;
      }

      let items = (rows || []).map(transformCommitment);

      // Search filter (client-side)
      if (filters.search?.trim()) {
        const searchLower = filters.search.toLowerCase();
        items = items.filter(
          (c) =>
            (c.title?.toLowerCase().includes(searchLower)) ||
            c.content.toLowerCase().includes(searchLower) ||
            c.personName?.toLowerCase().includes(searchLower) ||
            c.companyName?.toLowerCase().includes(searchLower)
        );
      }

      // Counts
      const counts = {
        total: items.length,
        owedByMe: items.filter((c) => c.direction === "owed_by_me").length,
        owedToMe: items.filter((c) => c.direction === "owed_to_me").length,
      };

      return { items, counts };
    },
    enabled: !!user?.id,
  });

  return {
    obligations: data?.items || [],
    counts: data?.counts || { total: 0, owedByMe: 0, owedToMe: 0 },
    isLoading,
    refetch,
  };
}
