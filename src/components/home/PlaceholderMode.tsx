import { motion } from "framer-motion";

interface PlaceholderModeProps {
  mode: "command" | "executive";
}

const labels = {
  command: "Command Stream",
  executive: "Executive Overview",
};

export function PlaceholderMode({ mode }: PlaceholderModeProps) {
  return (
    <motion.div
      className="flex items-center justify-center min-h-[60vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="rounded-2xl bg-muted/5 border border-border/30 px-12 py-10 text-center">
        <p className="text-lg text-muted-foreground/70 font-light">
          {labels[mode]} — coming soon
        </p>
      </div>
    </motion.div>
  );
}
