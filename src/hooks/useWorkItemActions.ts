import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { createNote } from "@/hooks/useNotes";
import type { NoteTargetType } from "@/types/notes";

export function useWorkItemActions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const invalidateQueue = () => {
    queryClient.invalidateQueries({ queryKey: ["work_queue"] });
  };

  const linkEntityMutation = useMutation({
    mutationFn: async ({
      workItemId,
      sourceType,
      sourceId,
      targetType,
      targetId,
    }: {
      workItemId: string;
      sourceType: string;
      sourceId: string;
      targetType: 'company' | 'project';
      targetId: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Insert entity link
      const { error: linkError } = await supabase
        .from("entity_links")
        .upsert({
          created_by: user.id,
          source_type: sourceType,
          source_id: sourceId,
          target_type: targetType,
          target_id: targetId,
          link_reason: 'manual',
        }, { onConflict: 'source_type,source_id,target_type,target_id,created_by' });

      if (linkError) throw linkError;

      // Remove 'unlinked_company' from reason_codes
      const { data: item } = await supabase
        .from("work_items")
        .select("reason_codes")
        .eq("id", workItemId)
        .single();

      if (item) {
        const newReasons = (item.reason_codes || []).filter((r: string) => r !== 'unlinked_company');
        const { error: updateError } = await supabase
          .from("work_items")
          .update({
            reason_codes: newReasons,
            last_touched_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", workItemId);

        if (updateError) throw updateError;
      }
    },
    onSuccess: () => {
      invalidateQueue();
      toast.success("Entity linked");
    },
    onError: (error) => {
      console.error("Error linking entity:", error);
      toast.error("Failed to link entity");
    },
  });

  const snoozeMutation = useMutation({
    mutationFn: async ({ workItemId, until }: { workItemId: string; until: Date }) => {
      const { error } = await supabase
        .from("work_items")
        .update({
          status: 'snoozed',
          snooze_until: until.toISOString(),
          last_touched_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", workItemId);

      if (error) throw error;
    },
    onSuccess: () => {
      invalidateQueue();
      toast.success("Snoozed");
    },
    onError: (error) => {
      console.error("Error snoozing:", error);
      toast.error("Failed to snooze");
    },
  });

  const noActionMutation = useMutation({
    mutationFn: async (workItemId: string) => {
      // Fetch source info to promote tasks
      const { data: item } = await supabase
        .from("work_items")
        .select("source_type, source_id")
        .eq("id", workItemId)
        .single();

      const { error } = await supabase
        .from("work_items")
        .update({
          status: 'ignored',
          reviewed_at: new Date().toISOString(),
          last_touched_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", workItemId);

      if (error) throw error;

      // If the source is a task, promote it out of inbox so it appears on the Tasks page
      if (item?.source_type === 'task') {
        await supabase
          .from("tasks")
          .update({ is_quick_task: false })
          .eq("id", item.source_id);
      }
    },
    onSuccess: () => {
      invalidateQueue();
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Marked as no action");
    },
    onError: (error) => {
      console.error("Error marking no action:", error);
      toast.error("Failed to update");
    },
  });

  const markTrustedMutation = useMutation({
    mutationFn: async (workItemId: string) => {
      // Check if item qualifies for trusted
      const { data: item } = await supabase
        .from("work_items")
        .select("source_type, source_id, reason_codes, status")
        .eq("id", workItemId)
        .single();

      if (!item) throw new Error("Work item not found");

      const { error } = await supabase
        .from("work_items")
        .update({
          status: 'trusted',
          trusted_at: new Date().toISOString(),
          reviewed_at: new Date().toISOString(),
          last_touched_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", workItemId);

      if (error) throw error;

      // If the source is a task, promote it out of inbox so it appears on the Tasks page
      if (item.source_type === 'task') {
        await supabase
          .from("tasks")
          .update({ is_quick_task: false })
          .eq("id", item.source_id);
      }
    },
    onSuccess: () => {
      invalidateQueue();
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Marked as trusted");
    },
    onError: (error: Error) => {
      console.error("Error marking trusted:", error);
      toast.error(error.message || "Failed to mark as trusted");
    },
  });

  const saveAsNoteMutation = useMutation({
    mutationFn: async ({
      workItemId,
      content,
      title,
      targetType,
      targetId,
    }: {
      workItemId: string;
      content: string;
      title?: string;
      targetType?: NoteTargetType;
      targetId?: string;
    }) => {
      const primaryContext = targetType && targetId
        ? { targetType, targetId }
        : { targetType: 'project' as NoteTargetType, targetId: workItemId };

      const note = await createNote({
        title,
        content,
        primaryContext,
      });

      if (!note) throw new Error("Failed to create note");

      // Update work item
      const { error } = await supabase
        .from("work_items")
        .update({
          last_touched_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", workItemId);

      if (error) throw error;

      return note;
    },
    onSuccess: () => {
      invalidateQueue();
      toast.success("Saved as note");
    },
    onError: (error) => {
      console.error("Error saving as note:", error);
      toast.error("Failed to save as note");
    },
  });

  const createTaskFromSuggestionMutation = useMutation({
    mutationFn: async ({
      workItemId,
      sourceType,
      sourceId,
      taskContent,
      taskPriority,
      taskProjectId,
    }: {
      workItemId: string;
      sourceType: string;
      sourceId: string;
      taskContent: string;
      taskPriority?: string;
      taskProjectId?: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Create the task
      const { data: task, error: taskError } = await supabase
        .from("tasks")
        .insert({
          content: taskContent,
          priority: taskPriority || 'medium',
          project_id: taskProjectId || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (taskError) throw taskError;

      // Create entity link back to source
      await supabase
        .from("entity_links")
        .upsert({
          created_by: user.id,
          source_type: sourceType,
          source_id: sourceId,
          target_type: 'project',
          target_id: task.id,
          link_reason: 'task_created',
        }, { onConflict: 'source_type,source_id,target_type,target_id,created_by' });

      // Remove 'no_next_action' from reason_codes
      const { data: item } = await supabase
        .from("work_items")
        .select("reason_codes")
        .eq("id", workItemId)
        .single();

      if (item) {
        const newReasons = (item.reason_codes || []).filter((r: string) => r !== 'no_next_action');
        await supabase
          .from("work_items")
          .update({
            reason_codes: newReasons,
            last_touched_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", workItemId);
      }

      return task;
    },
    onSuccess: () => {
      invalidateQueue();
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Task created");
    },
    onError: (error) => {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
    },
  });

  return {
    linkEntity: (params: Parameters<typeof linkEntityMutation.mutate>[0]) => linkEntityMutation.mutate(params),
    snooze: (workItemId: string, until: Date) => snoozeMutation.mutate({ workItemId, until }),
    noAction: (workItemId: string) => noActionMutation.mutate(workItemId),
    markTrusted: (workItemId: string) => markTrustedMutation.mutate(workItemId),
    saveAsNote: (params: Parameters<typeof saveAsNoteMutation.mutate>[0]) => saveAsNoteMutation.mutate(params),
    createTaskFromSuggestion: (params: Parameters<typeof createTaskFromSuggestionMutation.mutate>[0]) =>
      createTaskFromSuggestionMutation.mutate(params),
    isLinking: linkEntityMutation.isPending,
    isSnoozing: snoozeMutation.isPending,
  };
}
