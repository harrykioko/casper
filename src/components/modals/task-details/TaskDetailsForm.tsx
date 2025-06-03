
import { Task } from "@/hooks/useTasks";
import { TaskContentInput } from "./TaskContentInput";
import { ProjectSelector } from "./ProjectSelector";
import { CategorySelector } from "./CategorySelector";
import { DateSelector } from "./DateSelector";
import { PrioritySelector } from "./PrioritySelector";
import { StatusSelector } from "./StatusSelector";

interface TaskDetailsFormProps {
  content: string;
  setContent: (content: string) => void;
  status: "todo" | "inprogress" | "done";
  setStatus: (status: "todo" | "inprogress" | "done") => void;
  scheduledFor?: Date;
  setScheduledFor: (date?: Date) => void;
  selectedProject?: Task["project"];
  setSelectedProject: (project?: Task["project"]) => void;
  priority?: "low" | "medium" | "high";
  setPriority: (priority?: "low" | "medium" | "high") => void;
  category?: string;
  setCategory: (category?: string) => void;
}

export function TaskDetailsForm({
  content,
  setContent,
  status,
  setStatus,
  scheduledFor,
  setScheduledFor,
  selectedProject,
  setSelectedProject,
  priority,
  setPriority,
  category,
  setCategory
}: TaskDetailsFormProps) {
  return (
    <div className="space-y-4">
      {/* Task Name */}
      <TaskContentInput content={content} onContentChange={setContent} />

      {/* Project Selection */}
      <ProjectSelector selectedProject={selectedProject} setSelectedProject={setSelectedProject} />

      {/* Category Selection */}
      <CategorySelector selectedCategory={category} setSelectedCategory={setCategory} />

      {/* Due Date Selection */}
      <DateSelector scheduledFor={scheduledFor} onSelectDate={setScheduledFor} />

      {/* Priority Selection */}
      <PrioritySelector priority={priority} onSelectPriority={setPriority} />

      {/* Status Selection */}
      <StatusSelector status={status} onSelectStatus={setStatus} />
    </div>
  );
}
