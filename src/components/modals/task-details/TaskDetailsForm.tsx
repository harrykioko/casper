
import { Task } from "@/components/dashboard/TaskSection";
import { TaskContentInput } from "./TaskContentInput";
import { ProjectSelector } from "./ProjectSelector";
import { DateSelector } from "./DateSelector";
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
}

export function TaskDetailsForm({
  content,
  setContent,
  status,
  setStatus,
  scheduledFor,
  setScheduledFor,
  selectedProject,
  setSelectedProject
}: TaskDetailsFormProps) {
  return (
    <div className="space-y-4 py-2">
      {/* Task Content */}
      <TaskContentInput content={content} onContentChange={setContent} />

      {/* Project Selection */}
      <ProjectSelector selectedProject={selectedProject} onSelectProject={setSelectedProject} />

      {/* Due Date Selection */}
      <DateSelector scheduledFor={scheduledFor} onSelectDate={setScheduledFor} />

      {/* Status Selection */}
      <StatusSelector status={status} onSelectStatus={setStatus} />
    </div>
  );
}
