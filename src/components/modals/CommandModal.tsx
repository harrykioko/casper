
import { useState, useEffect, useRef } from "react";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { LayoutDashboard, FolderKanban, MessageSquareText, BookOpen, Settings, Link, Plus, CheckSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask?: (task: string) => void;
  onNavigate?: (path: string) => void;
  onAddLink?: () => void;
  onAddPrompt?: () => void;
}

export function CommandModal({ 
  isOpen, 
  onClose, 
  onAddTask, 
  onNavigate, 
  onAddLink,
  onAddPrompt 
}: CommandModalProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.classList.add("overflow-hidden");
      
      // Focus the input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    } else {
      document.body.classList.remove("overflow-hidden");
    }
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("overflow-hidden");
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  const handleInputChange = (value: string) => {
    setInputValue(value);
  };
  
  const handleSelect = (value: string) => {
    if (value.startsWith("navigate:")) {
      const path = value.replace("navigate:", "");
      onNavigate?.(path);
      onClose();
    } else if (value === "add-task" && inputValue) {
      onAddTask?.(inputValue);
      onClose();
    } else if (value === "add-link") {
      onAddLink?.();
      onClose();
    } else if (value === "add-prompt") {
      onAddPrompt?.();
      onClose();
    } else if (value === "quick-task") {
      onNavigate?.("/");
      setTimeout(() => {
        onAddTask?.("New task");
      }, 100);
      onClose();
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" 
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div 
            className="command-modal"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Command className="rounded-lg overflow-hidden">
              <CommandInput 
                placeholder="Type a command or search..." 
                ref={inputRef}
                value={inputValue}
                onValueChange={handleInputChange}
                className="text-zinc-800 dark:text-white/90"
              />
              <CommandList className="max-h-[300px] overflow-auto">
                <CommandEmpty className="text-zinc-500 dark:text-white/60">No results found.</CommandEmpty>
                
                {inputValue && (
                  <CommandGroup heading="Action">
                    <CommandItem value="add-task" onSelect={handleSelect} className="hover:bg-gray-100 dark:hover:bg-gray-700/50">
                      <CheckSquare className="mr-2 h-4 w-4" />
                      <span>Add task: {inputValue}</span>
                    </CommandItem>
                  </CommandGroup>
                )}
                
                <CommandGroup heading="Navigation">
                  <CommandItem value="navigate:/" onSelect={handleSelect} className="hover:bg-gray-100 dark:hover:bg-gray-700/50">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </CommandItem>
                  <CommandItem value="navigate:/projects" onSelect={handleSelect} className="hover:bg-gray-100 dark:hover:bg-gray-700/50">
                    <FolderKanban className="mr-2 h-4 w-4" />
                    <span>Projects</span>
                  </CommandItem>
                  <CommandItem value="navigate:/prompts" onSelect={handleSelect} className="hover:bg-gray-100 dark:hover:bg-gray-700/50">
                    <MessageSquareText className="mr-2 h-4 w-4" />
                    <span>Prompt Library</span>
                  </CommandItem>
                  <CommandItem value="navigate:/reading-list" onSelect={handleSelect} className="hover:bg-gray-100 dark:hover:bg-gray-700/50">
                    <BookOpen className="mr-2 h-4 w-4" />
                    <span>Reading List</span>
                  </CommandItem>
                  <CommandItem value="navigate:/settings" onSelect={handleSelect} className="hover:bg-gray-100 dark:hover:bg-gray-700/50">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </CommandItem>
                </CommandGroup>

                <CommandGroup heading="Quick Actions">
                  <CommandItem value="quick-task" onSelect={handleSelect} className="hover:bg-gray-100 dark:hover:bg-gray-700/50">
                    <Plus className="mr-2 h-4 w-4" />
                    <span>New Task</span>
                  </CommandItem>
                  <CommandItem value="add-prompt" onSelect={handleSelect} className="hover:bg-gray-100 dark:hover:bg-gray-700/50">
                    <MessageSquareText className="mr-2 h-4 w-4" />
                    <span>New Prompt</span>
                  </CommandItem>
                  <CommandItem value="add-link" onSelect={handleSelect} className="hover:bg-gray-100 dark:hover:bg-gray-700/50">
                    <Link className="mr-2 h-4 w-4" />
                    <span>Add Link to Reading List</span>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
