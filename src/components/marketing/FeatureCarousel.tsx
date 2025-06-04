
import { motion } from 'framer-motion';
import { PlusCircle, Terminal, Sparkles, BookOpen } from 'lucide-react';
import FeatureCard from './FeatureCard';

export default function FeatureCarousel() {
  const features = [
    {
      title: 'Quick-Add Tasks',
      description: 'Capture thoughts instantly with our lightning-fast task entry system.',
      icon: PlusCircle,
    },
    {
      title: 'Command Palette',
      description: 'Navigate anywhere in seconds with keyboard-first commands.',
      icon: Terminal,
    },
    {
      title: 'AI Prompt Library',
      description: 'Store and organize your most powerful prompts for instant access.',
      icon: Sparkles,
    },
    {
      title: 'Reading List',
      description: 'Save articles and resources with auto-generated metadata.',
      icon: BookOpen,
    },
  ];

  return (
    <section className="py-24 overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-heading mb-4">
            Everything you need in one place
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Streamline your workflow with tools designed for modern productivity.
          </p>
        </motion.div>

        <div className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-4">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              {...feature}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
