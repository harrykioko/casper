
import { Input } from "@/components/ui/input";

interface TaskContentInputProps {
  content: string;
  onContentChange: (content: string) => void;
}

export function TaskContentInput({ content, onContentChange }: TaskContentInputProps) {
  return (
    <div className="space-y-1">
      <label htmlFor="task-content" className="text-sm text-muted-foreground mb-1 block">
        Task
      </label>
      <Input
        id="task-content"
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="Enter task name..."
        className="w-full bg-muted/20 border border-muted/40 rounded-md text-base"
      />
    </div>
  );
}
