
import { Textarea } from "@/components/ui/textarea";

interface TaskContentInputProps {
  content: string;
  onContentChange: (content: string) => void;
}

export function TaskContentInput({ content, onContentChange }: TaskContentInputProps) {
  return (
    <div className="space-y-2">
      <label htmlFor="task-content" className="text-xs uppercase text-white/50 tracking-wide block">
        Task
      </label>
      <Textarea
        id="task-content"
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="Write your task..."
        className="min-h-[80px] resize-none w-full bg-white/5 border border-white/10 rounded-md text-sm px-3 py-2 placeholder-white/40 focus-visible:ring-1 focus-visible:ring-white/20 focus-visible:ring-offset-0 focus-visible:outline-none"
      />
    </div>
  );
}
