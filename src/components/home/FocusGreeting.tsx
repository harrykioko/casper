import { motion } from "framer-motion";
import { format } from "date-fns";

interface FocusGreetingProps {
  firstName: string;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function FocusGreeting({ firstName }: FocusGreetingProps) {
  const now = new Date();
  const greeting = getGreeting();
  const dateStr = format(now, "EEEE, MMMM d, yyyy");

  return (
    <motion.div
      className="text-center py-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <p className="text-sm text-muted-foreground mb-1">{dateStr}</p>
      <h1 className="text-3xl font-light tracking-tight text-foreground">
        {greeting}, {firstName}.
      </h1>
    </motion.div>
  );
}
