import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkItemActions } from "./useWorkItemActions";

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
  }, [queryClient]);

  const markTrusted = useCallback(
    (workItemId: string) => {
      actions.markTrusted(workItemId);
      // invalidation happens inside useWorkItemActions, but also invalidate focus_queue
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
      // For now, resolve is equivalent to markTrusted
      markTrusted(workItemId);
    },
    [markTrusted]
  );

  return {
    markTrusted,
    snooze,
    noAction,
    linkEntity,
    resolve,
    isLinking: actions.isLinking,
    isSnoozing: actions.isSnoozing,
  };
}
