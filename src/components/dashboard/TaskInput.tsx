import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

interface TaskInputProps {
  onAddTask: (task: string, isQuickTask?: boolean) => void;
  variant?: 'default' | 'glass';
}

export function TaskInput({ onAddTask, variant = 'default' }: TaskInputProps) {
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

  const isGlass = variant === 'glass';

  return (
    <form 
      onSubmit={handleSubmit} 
      className={cn(
        "w-full flex items-center gap-2 transition-all duration-300",
        isGlass 
          ? "p-2 rounded-xl bg-white/40 dark:bg-white/[0.04] border border-white/30 dark:border-white/[0.06]"
          : "p-3 rounded-xl glassmorphic",
        isFocused && (isGlass 
          ? "ring-1 ring-primary/30 bg-white/60 dark:bg-white/[0.08]"
          : "ring-1 ring-zinc-300 dark:ring-white/20"
        )
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
