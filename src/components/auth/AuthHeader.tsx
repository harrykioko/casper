
import { motion } from 'framer-motion';
import casperWordmark from "/lovable-uploads/casper-wordmark.png";

export function AuthHeader() {
  return (
    <motion.div
      className="flex justify-center mb-10"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <img
        src={casperWordmark}
        alt="Casper"
        className="h-8 w-auto"
      />
    </motion.div>
  );
}
