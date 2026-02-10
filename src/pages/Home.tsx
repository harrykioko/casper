import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { ModeToggle, type HomeMode } from "@/components/home/ModeToggle";
import { FocusGreeting } from "@/components/home/FocusGreeting";
import { FocusModeLayout } from "@/components/home/FocusModeLayout";
import { FocusSpotlight } from "@/components/home/FocusSpotlight";
import { FocusUpNext } from "@/components/home/FocusUpNext";
import { TodayRail } from "@/components/home/TodayRail";
import { TimeRail } from "@/components/home/TimeRail";
import { PlaceholderMode } from "@/components/home/PlaceholderMode";
import { useTasks } from "@/hooks/useTasks";
import { useEnrichedTasks, type EnrichedTask } from "@/hooks/useEnrichedTasks";
import { useOutlookCalendar } from "@/hooks/useOutlookCalendar";
import { useNonnegotiables } from "@/hooks/useNonnegotiables";
import { useCommitments } from "@/hooks/useCommitments";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { isPast, isToday, isTomorrow, parseISO, startOfDay } from "date-fns";

export default function Home() {
  const [mode, setMode] = useState<HomeMode>("focus");
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { tasks, updateTask, snoozeTask, getNonInboxTasks } = useTasks();
  const enrichedTasks = useEnrichedTasks(tasks);
  const { events } = useOutlookCalendar();
  const { nonnegotiables } = useNonnegotiables();
  const { commitments } = useCommitments({ status: "open" });

  const firstName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  // Select focus tasks: overdue > today > high-priority tomorrow, exclude completed/snoozed/archived
  const focusTasks = useMemo(() => {
    const now = new Date();
    const active = enrichedTasks.filter(
      (t) =>
        !t.completed &&
        !t.archived_at &&
        (!t.snoozed_until || new Date(t.snoozed_until) <= now)
    );

    const scored = active.map((t) => {
      let score = 0;
      if (t.scheduledFor) {
        const d = parseISO(t.scheduledFor);
        if (isPast(d) && !isToday(d)) score = 100;
        else if (isToday(d)) score = 50;
        else if (isTomorrow(d)) score = 20;
      }
      if (t.priority === "high") score += 10;
      if (t.is_top_priority) score += 15;
      return { task: t, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .map((s) => s.task);
  }, [enrichedTasks]);

  const spotlightTask = focusTasks[0] as EnrichedTask | undefined;
  const upNextTasks = focusTasks.slice(1, 6);

  const handleComplete = useCallback(
    async (id: string) => {
      try {
        await updateTask(id, {
          completed: true,
          completed_at: new Date().toISOString(),
          status: "done",
        } as any);
        toast.success("Task completed");
      } catch {
        toast.error("Failed to complete task");
      }
    },
    [updateTask]
  );

  const handleSnooze = useCallback(
    async (id: string) => {
      try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        await snoozeTask(id, tomorrow);
        toast.success("Snoozed until tomorrow");
      } catch {
        toast.error("Failed to snooze");
      }
    },
    [snoozeTask]
  );

  const handleToggleTask = useCallback(
    async (id: string) => {
      const task = enrichedTasks.find((t) => t.id === id);
      if (!task) return;
      try {
        await updateTask(id, {
          completed: !task.completed,
          completed_at: !task.completed ? new Date().toISOString() : null,
          status: !task.completed ? "done" : "todo",
        } as any);
      } catch {
        toast.error("Failed to update task");
      }
    },
    [enrichedTasks, updateTask]
  );

  const handleClickItem = useCallback(
    (id: string, type: "task" | "commitment") => {
      // Future: open TaskDetailsDialog or commitment detail
    },
    []
  );

  const nnItems = nonnegotiables
    .filter((n) => n.is_active !== false)
    .map((n) => ({
      id: n.id,
      label: n.title,
    }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="px-8 py-6 max-w-[1280px] mx-auto">
        {/* Mode Toggle */}
        <div className="flex justify-center mb-2">
          <ModeToggle mode={mode} onChange={setMode} />
        </div>

        {mode === "focus" ? (
          <motion.div
            key="focus"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Greeting */}
            <FocusGreeting firstName={firstName} />

            {/* Three-column layout */}
            <FocusModeLayout
              leftRail={
                <TodayRail linkedEntity={spotlightTask?.linkedEntity} />
              }
              center={
                <>
                  {spotlightTask ? (
                    <FocusSpotlight
                      task={spotlightTask}
                      onComplete={handleComplete}
                      onSnooze={handleSnooze}
                    />
                  ) : (
                    <div className="rounded-2xl bg-card/50 border border-border/30 p-8 text-center">
                      <p className="text-muted-foreground font-light text-lg">
                        All clear — nothing to focus on.
                      </p>
                    </div>
                  )}
                  <FocusUpNext
                    tasks={upNextTasks}
                    commitments={commitments}
                    onToggleTask={handleToggleTask}
                    onClickItem={handleClickItem}
                  />
                </>
              }
              rightRail={
                <TimeRail events={events} nonnegotiables={nnItems} />
              }
            />
          </motion.div>
        ) : (
          <PlaceholderMode mode={mode} />
        )}
      </div>
    </div>
  );
}
