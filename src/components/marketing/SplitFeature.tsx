
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface SplitFeatureProps {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  reverse?: boolean;
  index: number;
}

export default function SplitFeature({ 
  title, 
  description, 
  imageSrc, 
  imageAlt, 
  reverse = false,
  index 
}: SplitFeatureProps) {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: reverse ? 20 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
            viewport={{ once: true }}
            className={reverse ? 'md:order-2' : 'md:order-1'}
          >
            <h3 className="text-3xl font-heading mb-6">{title}</h3>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              {description}
            </p>
            <Button variant="ghost" size="sm" className="mt-4">
              Explore project views →
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: reverse ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + 0.2, duration: 0.6 }}
            viewport={{ once: true }}
            className={reverse ? 'md:order-1' : 'md:order-2'}
          >
            <div className="glass-card p-8 rounded-2xl">
              <div className="aspect-video bg-gradient-to-br from-accent-blue/20 to-accent-coral/20 rounded-xl flex items-center justify-center">
                <span className="text-4xl opacity-60">📊</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
