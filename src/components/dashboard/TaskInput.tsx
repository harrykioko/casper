
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus, Calendar, Tag, Folder } from "lucide-react";
import { motion } from "framer-motion";

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
        "w-full flex items-center gap-2 p-3 rounded-xl transition-all duration-300 glassmorphic",
        isFocused ? "ring-1 ring-white/20" : ""
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
        className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none text-zinc-800 dark:text-white/90 text-base"
        value={task}
        onChange={(e) => setTask(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      
      {isFocused && (
        <div className="flex gap-1">
          <Button 
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full text-zinc-500 dark:text-white/60 hover:text-[#FF6A79] dark:hover:text-[#FF6A79]"
          >
            <Folder className="h-4 w-4" />
          </Button>
          <Button 
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full text-zinc-500 dark:text-white/60 hover:text-[#415AFF] dark:hover:text-[#415AFF]"
          >
            <Tag className="h-4 w-4" />
          </Button>
          <Button 
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-full text-zinc-500 dark:text-white/60 hover:text-[#FF6A79] dark:hover:text-[#FF6A79]"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>
      )}
    </form>
  );
}
