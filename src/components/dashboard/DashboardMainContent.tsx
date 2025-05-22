
import { useState } from "react";
import { Task } from "@/components/dashboard/TaskList";
import { ReadingItem } from "@/components/dashboard/ReadingList";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TaskSection } from "@/components/dashboard/TaskSection";
import { ReadingListSection } from "@/components/dashboard/ReadingListSection";

interface DashboardMainContentProps {
  tasks: Task[];
  readingItems: ReadingItem[];
  openCommandModal: () => void;
  onAddTask: (content: string) => void;
  onTaskComplete: (id: string) => void;
  onTaskDelete: (id: string) => void;
  onMarkRead: (id: string) => void;
  onDeleteReadingItem: (id: string) => void;
}

export function DashboardMainContent({
  tasks,
  readingItems,
  openCommandModal,
  onAddTask,
  onTaskComplete,
  onTaskDelete,
  onMarkRead,
  onDeleteReadingItem
}: DashboardMainContentProps) {
  return (
    <div className="flex-1 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header with Command Button */}
        <DashboardHeader openCommandModal={openCommandModal} />

        {/* Task Section */}
        <TaskSection
          tasks={tasks}
          onAddTask={onAddTask}
          onTaskComplete={onTaskComplete}
          onTaskDelete={onTaskDelete}
        />

        {/* Reading List Section */}
        <ReadingListSection
          readingItems={readingItems}
          onMarkRead={onMarkRead}
          onDeleteReadingItem={onDeleteReadingItem}
        />
      </div>
    </div>
  );
}
