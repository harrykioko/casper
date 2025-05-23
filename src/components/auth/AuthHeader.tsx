
import { motion } from 'framer-motion';

export function AuthHeader() {
  return (
    <motion.div
      className="text-3xl md:text-4xl font-bold tracking-[0.3em] text-muted-foreground uppercase text-center mb-10"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      CASPER
    </motion.div>
  );
}
