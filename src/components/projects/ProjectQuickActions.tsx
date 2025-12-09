import { useState } from "react";
import { Plus, FileText, CheckSquare, BookOpen, Link, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  color: string;
}

interface ProjectQuickActionsProps {
  onAddNote: () => void;
  onAddTask: () => void;
  onAddReading: () => void;
  onAddAsset: () => void;
}

export function ProjectQuickActions({
  onAddNote,
  onAddTask,
  onAddReading,
  onAddAsset,
}: ProjectQuickActionsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions: QuickAction[] = [
    {
      id: "note",
      label: "Note",
      icon: FileText,
      onClick: onAddNote,
      color: "text-indigo-500 bg-indigo-500/10 hover:bg-indigo-500/20",
    },
    {
      id: "task",
      label: "Task",
      icon: CheckSquare,
      onClick: onAddTask,
      color: "text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20",
    },
    {
      id: "reading",
      label: "Reading",
      icon: BookOpen,
      onClick: onAddReading,
      color: "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20",
    },
    {
      id: "asset",
      label: "Asset",
      icon: Link,
      onClick: onAddAsset,
      color: "text-pink-500 bg-pink-500/10 hover:bg-pink-500/20",
    },
  ];

  const handleActionClick = (action: QuickAction) => {
    action.onClick();
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-2">
      {/* Action buttons */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    y: 0,
                    transition: { delay: index * 0.05 }
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: 0.8, 
                    y: 20,
                    transition: { delay: (actions.length - index - 1) * 0.03 }
                  }}
                  className="flex items-center gap-2"
                >
                  <span className={cn(
                    "text-xs font-medium px-2.5 py-1 rounded-lg",
                    "bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md",
                    "shadow-lg border border-white/20 dark:border-white/10",
                    "text-foreground"
                  )}>
                    {action.label}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "h-10 w-10 rounded-xl shadow-lg",
                      "backdrop-blur-xl border border-white/20 dark:border-white/10",
                      action.color,
                      "transition-all duration-200"
                    )}
                    onClick={() => handleActionClick(action)}
                  >
                    <Icon className="w-4 h-4" />
                  </Button>
                </motion.div>
              );
            })}
          </>
        )}
      </AnimatePresence>

      {/* Main FAB button */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          size="icon"
          className={cn(
            "h-12 w-12 rounded-2xl shadow-xl",
            "bg-gradient-to-br from-primary to-primary/80",
            "hover:from-primary/90 hover:to-primary/70",
            "backdrop-blur-xl border border-white/20",
            "transition-all duration-300",
            isExpanded && "rotate-45"
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <X className="w-5 h-5 text-primary-foreground" />
          ) : (
            <Plus className="w-5 h-5 text-primary-foreground" />
          )}
        </Button>
      </motion.div>

      {/* Backdrop when expanded */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/10 dark:bg-black/30 -z-10"
            onClick={() => setIsExpanded(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
