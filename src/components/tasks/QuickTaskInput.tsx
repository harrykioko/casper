
import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface QuickTaskInputProps {
  onAddTask: (content: string) => void;
}

export function QuickTaskInput({ onAddTask }: QuickTaskInputProps) {
  const [newTask, setNewTask] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on component mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      onAddTask(newTask);
      setNewTask("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative flex items-center gap-3 p-3 rounded-xl bg-muted/20 backdrop-blur-md border border-muted/30 hover:ring-1 hover:ring-white/20 transition-all">
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          className="rounded-full h-8 w-8 flex-shrink-0 text-primary hover:bg-primary/10"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Input
          ref={inputRef}
          type="text"
          placeholder="Add a quick task… (press Tab to enrich)"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none text-base placeholder:text-muted-foreground"
        />
      </div>
    </form>
  );
}
