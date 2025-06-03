
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

interface TaskInputProps {
  onAddTask: (task: string, isQuickTask?: boolean) => void;
}

export function TaskInput({ onAddTask }: TaskInputProps) {
  const [task, setTask] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (task.trim()) {
      // Always create quick tasks from Dashboard input
      onAddTask(task, true);
      setTask("");
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={cn(
        "w-full flex items-center gap-2 p-3 rounded-xl transition-all duration-300 glassmorphic",
        isFocused ? "ring-1 ring-zinc-300 dark:ring-white/20" : ""
      )}
    >
      <motion.div whileTap={{ scale: 0.9 }} whileHover={{ scale: 1.05 }}>
        <Button 
          type="submit" 
          size="icon" 
          variant={isFocused ? "default" : "ghost"} 
          className={cn(
            "rounded-full h-8 w-8 flex-shrink-0 transition-all",
            isFocused && "bg-gradient-to-r from-[#FF6A79] to-[#415AFF] hover:from-[#FF6A79] hover:to-[#415AFF]"
          )}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </motion.div>
      
      <Input
        type="text"
        placeholder="Add a new task..."
        className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none text-zinc-800 dark:text-white/90 text-base placeholder:text-zinc-400 dark:placeholder:text-white/50"
        value={task}
        onChange={(e) => setTask(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
    </form>
  );
}
