import * as React from "react";
import { useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface GlassModuleCardProps {
  icon: React.ReactNode;
  title: string;
  count?: number;
  onAdd?: () => void;
  addLabel?: string;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  accentColor?: string;
}

export function GlassModuleCard({
  icon,
  title,
  count,
  onAdd,
  addLabel = "Add",
  children,
  className,
  collapsible = false,
  defaultExpanded = true,
  accentColor,
}: GlassModuleCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "relative rounded-2xl overflow-hidden transition-all duration-200",
        "bg-white/60 dark:bg-zinc-900/50 backdrop-blur-xl",
        "border border-white/30 dark:border-white/[0.08]",
        "shadow-[0_4px_20px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.3)]",
        "hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_36px_rgba(0,0,0,0.4)]",
        "hover:translate-y-[-2px]",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Subtle accent gradient at top */}
      {accentColor && (
        <div 
          className="absolute top-0 left-0 right-0 h-0.5 opacity-60"
          style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          {collapsible && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-0.5 -ml-1 rounded hover:bg-white/20 dark:hover:bg-white/10 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="text-muted-foreground">{icon}</div>
            <h3 className="font-semibold text-sm tracking-tight text-foreground">
              {title}
            </h3>
            {count !== undefined && (
              <span className="text-xs text-muted-foreground font-medium bg-muted/50 px-1.5 py-0.5 rounded-md">
                {count}
              </span>
            )}
          </div>
        </div>

        {onAdd && (
          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-7 px-2.5 text-xs gap-1.5 transition-all duration-200",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-white/40 dark:hover:bg-white/10",
              isHovered ? "opacity-100" : "opacity-0"
            )}
            onClick={onAdd}
          >
            <Plus className="w-3.5 h-3.5" />
            {addLabel}
          </Button>
        )}
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {(!collapsible || isExpanded) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className="p-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
