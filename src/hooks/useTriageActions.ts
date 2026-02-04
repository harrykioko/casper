import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkItemActions } from "./useWorkItemActions";
import { supabase } from "@/integrations/supabase/client";

/**
 * Wraps useWorkItemActions with a unified API for Triage.
 * Invalidates work_queue and triage_queue query keys.
 * 
 * TRIAGE INVARIANT: An item may only be cleared from Triage if at least one of:
 * 1. Classified: The item has a primary_link (linked to a company, project, etc.)
 * 2. Dismissed: User clicked "No Action" (explicitly marking as no action required)
 * 3. Trusted: User clicked "Trusted" (confirming it is correct as-is)
 */
export function useTriageActions() {
  const queryClient = useQueryClient();
  const actions = useWorkItemActions();

  const invalidateTriage = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["work_queue"] });
    queryClient.invalidateQueries({ queryKey: ["triage_queue"] });
    queryClient.invalidateQueries({ queryKey: ["commitments"] });
  }, [queryClient]);

  /** Mark item as trusted (judgment applied) - clears from triage */
  const markTrusted = useCallback(
    (workItemId: string) => {
      actions.markTrusted(workItemId);
      setTimeout(invalidateTriage, 100);
    },
    [actions, invalidateTriage]
  );

  /** Snooze item (defer judgment, review later) */
  const snooze = useCallback(
    (workItemId: string, until: Date) => {
      actions.snooze(workItemId, until);
      setTimeout(invalidateTriage, 100);
    },
    [actions, invalidateTriage]
  );

  /** Dismiss item (no action needed) - clears from triage */
  const noAction = useCallback(
    (workItemId: string) => {
      actions.noAction(workItemId);
      setTimeout(invalidateTriage, 100);
    },
    [actions, invalidateTriage]
  );

  const linkEntity = useCallback(
    (params: Parameters<typeof actions.linkEntity>[0]) => {
      actions.linkEntity(params);
      setTimeout(invalidateTriage, 100);
    },
    [actions, invalidateTriage]
  );

  const resolve = useCallback(
    (workItemId: string) => {
      markTrusted(workItemId);
    },
    [markTrusted]
  );

  // Commitment-specific triage actions
  const completeCommitment = useCallback(
    async (commitmentId: string, workItemId: string) => {
      const now = new Date().toISOString();
      await supabase
        .from("commitments")
        .update({ status: "completed", completed_at: now, resolved_at: now })
        .eq("id", commitmentId);
      actions.markTrusted(workItemId);
      setTimeout(invalidateTriage, 100);
    },
    [actions, invalidateTriage]
  );

  const delegateCommitment = useCallback(
    async (commitmentId: string, workItemId: string, toPersonId: string, toPersonName: string) => {
      const now = new Date().toISOString();
      await supabase
        .from("commitments")
        .update({
          status: "delegated",
          delegated_to_person_id: toPersonId,
          delegated_to_name: toPersonName,
          delegated_at: now,
          resolved_at: now,
        })
        .eq("id", commitmentId);
      actions.markTrusted(workItemId);
      setTimeout(invalidateTriage, 100);
    },
    [actions, invalidateTriage]
  );

  const markWaitingOn = useCallback(
    async (commitmentId: string) => {
      await supabase
        .from("commitments")
        .update({ status: "waiting_on" })
        .eq("id", commitmentId);
      setTimeout(invalidateTriage, 100);
    },
    [invalidateTriage]
  );

  const breakCommitment = useCallback(
    async (commitmentId: string, workItemId: string) => {
      const now = new Date().toISOString();
      await supabase
        .from("commitments")
        .update({ status: "broken", resolved_at: now })
        .eq("id", commitmentId);
      actions.markTrusted(workItemId);
      setTimeout(invalidateTriage, 100);
    },
    [actions, invalidateTriage]
  );

  const cancelCommitment = useCallback(
    async (commitmentId: string, workItemId: string) => {
      const now = new Date().toISOString();
      await supabase
        .from("commitments")
        .update({ status: "cancelled", resolved_at: now })
        .eq("id", commitmentId);
      actions.markTrusted(workItemId);
      setTimeout(invalidateTriage, 100);
    },
    [actions, invalidateTriage]
  );

  return {
    markTrusted,
    snooze,
    noAction,
    linkEntity,
    resolve,
    // Commitment-specific
    completeCommitment,
    delegateCommitment,
    markWaitingOn,
    breakCommitment,
    cancelCommitment,
    isLinking: actions.isLinking,
    isSnoozing: actions.isSnoozing,
  };
}
