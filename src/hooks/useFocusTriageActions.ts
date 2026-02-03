import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkItemActions } from "./useWorkItemActions";
import { supabase } from "@/integrations/supabase/client";

/**
 * Wraps useWorkItemActions with a unified API for Focus triage.
 * Invalidates both work_queue and focus_queue query keys.
 */
export function useFocusTriageActions() {
  const queryClient = useQueryClient();
  const actions = useWorkItemActions();

  const invalidateFocus = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["work_queue"] });
    queryClient.invalidateQueries({ queryKey: ["focus_queue"] });
    queryClient.invalidateQueries({ queryKey: ["commitments"] });
  }, [queryClient]);

  const markTrusted = useCallback(
    (workItemId: string) => {
      actions.markTrusted(workItemId);
      setTimeout(invalidateFocus, 100);
    },
    [actions, invalidateFocus]
  );

  const snooze = useCallback(
    (workItemId: string, until: Date) => {
      actions.snooze(workItemId, until);
      setTimeout(invalidateFocus, 100);
    },
    [actions, invalidateFocus]
  );

  const noAction = useCallback(
    (workItemId: string) => {
      actions.noAction(workItemId);
      setTimeout(invalidateFocus, 100);
    },
    [actions, invalidateFocus]
  );

  const linkEntity = useCallback(
    (params: Parameters<typeof actions.linkEntity>[0]) => {
      actions.linkEntity(params);
      setTimeout(invalidateFocus, 100);
    },
    [actions, invalidateFocus]
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
      setTimeout(invalidateFocus, 100);
    },
    [actions, invalidateFocus]
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
      setTimeout(invalidateFocus, 100);
    },
    [actions, invalidateFocus]
  );

  const markWaitingOn = useCallback(
    async (commitmentId: string) => {
      await supabase
        .from("commitments")
        .update({ status: "waiting_on" })
        .eq("id", commitmentId);
      setTimeout(invalidateFocus, 100);
    },
    [invalidateFocus]
  );

  const breakCommitment = useCallback(
    async (commitmentId: string, workItemId: string) => {
      const now = new Date().toISOString();
      await supabase
        .from("commitments")
        .update({ status: "broken", resolved_at: now })
        .eq("id", commitmentId);
      actions.markTrusted(workItemId);
      setTimeout(invalidateFocus, 100);
    },
    [actions, invalidateFocus]
  );

  const cancelCommitment = useCallback(
    async (commitmentId: string, workItemId: string) => {
      const now = new Date().toISOString();
      await supabase
        .from("commitments")
        .update({ status: "cancelled", resolved_at: now })
        .eq("id", commitmentId);
      actions.markTrusted(workItemId);
      setTimeout(invalidateFocus, 100);
    },
    [actions, invalidateFocus]
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
