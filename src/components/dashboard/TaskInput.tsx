
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

export function TaskInput({ onAddTask }: { onAddTask: (task: string) => void }) {
  const [task, setTask] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task.trim()) {
      onAddTask(task);
      setTask("");
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={cn(
        "w-full flex items-center gap-2 p-3 rounded-lg transition-all duration-200",
        isFocused ? "glassmorphic" : "bg-transparent"
      )}
    >
      <Button 
        type="submit" 
        size="icon" 
        variant={isFocused ? "default" : "ghost"} 
        className={cn(
          "rounded-full h-8 w-8 flex-shrink-0",
          isFocused && "bg-gradient-primary hover:bg-gradient-primary"
        )}
      >
        <Plus className="h-4 w-4" />
      </Button>
      <Input
        type="text"
        placeholder="Add a new task..."
        className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
        value={task}
        onChange={(e) => setTask(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </form>
  );
}
