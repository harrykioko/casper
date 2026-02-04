import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

export function TriageEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
        <CheckCircle2 className="h-10 w-10 text-emerald-400" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">
        All clear
      </h3>
      <p className="text-sm text-muted-foreground max-w-sm">
        All items have been triaged. New items will appear here as they arrive.
      </p>
    </motion.div>
  );
}
