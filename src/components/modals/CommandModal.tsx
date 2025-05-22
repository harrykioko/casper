
import { useState, useEffect, useRef } from "react";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { LayoutDashboard, FolderKanban, MessageSquareText, BookOpen, Settings } from "lucide-react";

interface CommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask?: (task: string) => void;
  onNavigate?: (path: string) => void;
}

export function CommandModal({ isOpen, onClose, onAddTask, onNavigate }: CommandModalProps) {
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
    }
  };
  
  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="command-modal">
        <Command>
          <CommandInput 
            placeholder="Type a command or search..." 
            ref={inputRef}
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            
            {inputValue && (
              <CommandGroup heading="Action">
                <CommandItem value="add-task" onSelect={handleSelect}>
                  Add task: {inputValue}
                </CommandItem>
              </CommandGroup>
            )}
            
            <CommandGroup heading="Navigation">
              <CommandItem value="navigate:/" onSelect={handleSelect}>
                <LayoutDashboard className="mr-2 h-4 w-4" />
                <span>Dashboard</span>
              </CommandItem>
              <CommandItem value="navigate:/projects" onSelect={handleSelect}>
                <FolderKanban className="mr-2 h-4 w-4" />
                <span>Projects</span>
              </CommandItem>
              <CommandItem value="navigate:/prompts" onSelect={handleSelect}>
                <MessageSquareText className="mr-2 h-4 w-4" />
                <span>Prompt Library</span>
              </CommandItem>
              <CommandItem value="navigate:/reading-list" onSelect={handleSelect}>
                <BookOpen className="mr-2 h-4 w-4" />
                <span>Reading List</span>
              </CommandItem>
              <CommandItem value="navigate:/settings" onSelect={handleSelect}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
    </>
  );
}
