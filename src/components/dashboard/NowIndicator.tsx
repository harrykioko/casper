import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function NowIndicator() {
  return (
    <motion.div 
      className="flex items-center gap-2 py-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Gradient line */}
      <div className="flex-1 h-px bg-gradient-to-r from-coral via-coral/50 to-transparent" />
      
      {/* "Now" pill */}
      <span className={cn(
        "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full",
        "bg-coral/10 text-coral border border-coral/20",
        "dark:bg-coral/20 dark:border-coral/30"
      )}>
        Now
      </span>
      
      {/* Gradient line (mirrored) */}
      <div className="flex-1 h-px bg-gradient-to-l from-coral via-coral/50 to-transparent" />
    </motion.div>
  );
}
