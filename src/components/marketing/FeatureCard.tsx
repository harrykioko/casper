
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  index: number;
}

export default function FeatureCard({ title, description, icon: Icon, index }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      viewport={{ once: true }}
      className="min-w-[240px] max-w-[240px] snap-center"
    >
      <div className="glass-card p-6 h-64 flex flex-col items-center justify-center text-center">
        <div className="mb-2">
          <Icon className="h-6 w-6 text-accent-blue" />
        </div>
        
        <h3 className="font-heading text-lg mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
        
        {/* Animated loop placeholder */}
        <div className="mt-4 w-12 h-2 bg-gradient-to-r from-accent-blue to-accent-coral rounded-full opacity-60 animate-pulse" />
      </div>
    </motion.div>
  );
}
