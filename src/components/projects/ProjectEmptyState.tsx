import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface ProjectEmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function ProjectEmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: ProjectEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex flex-col items-center justify-center py-10 px-6",
        "rounded-xl",
        "bg-gradient-to-br from-white/40 to-white/20 dark:from-white/[0.04] dark:to-white/[0.02]",
        "border border-dashed border-white/30 dark:border-white/10",
        className
      )}
    >
      {/* Icon with glow effect */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center mb-4",
          "bg-gradient-to-br from-muted/60 to-muted/30",
          "shadow-[0_0_20px_rgba(99,102,241,0.1)]",
          "dark:shadow-[0_0_24px_rgba(99,102,241,0.15)]"
        )}
      >
        <div className="text-muted-foreground/60">{icon}</div>
      </motion.div>

      <motion.h4
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-sm font-medium text-foreground/80 mb-1"
      >
        {title}
      </motion.h4>

      <motion.p
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xs text-muted-foreground text-center max-w-[240px] leading-relaxed"
      >
        {description}
      </motion.p>

      {actionLabel && onAction && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Button
            size="sm"
            variant="outline"
            className={cn(
              "mt-4 h-8 px-3 text-xs gap-1.5",
              "bg-white/50 dark:bg-white/5",
              "border-white/40 dark:border-white/10",
              "hover:bg-white/80 dark:hover:bg-white/10",
              "hover:border-primary/30",
              "transition-all duration-200"
            )}
            onClick={onAction}
          >
            <Plus className="w-3.5 h-3.5" />
            {actionLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
