
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';

export default function HeroSection() {
  const { theme } = useTheme();

  const backgroundImage = theme === 'light' 
    ? '/lovable-uploads/a0bc704e-d639-40e2-ab50-7e92619df1f8.png'
    : '/lovable-uploads/cc17065c-ceb5-4257-8e5e-a393f4523c87.png';

  const overlayClasses = theme === 'light'
    ? 'bg-white/60 backdrop-blur-sm'
    : 'bg-gradient-to-b from-black/50 to-black/80';

  return (
    <section 
      className="relative min-h-screen flex flex-col items-center justify-center text-center bg-cover bg-center"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {/* Overlay */}
      <div className={`absolute inset-0 ${overlayClasses}`} />
      
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6">
        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-heading tracking-tight text-white mb-6"
        >
          Command your productivity.
        </motion.h1>

        {/* Subheading */}
        <motion.h3
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
          className="mt-4 max-w-xl mx-auto text-lg md:text-2xl text-white/80"
        >
          One cockpit for tasks, prompts, and priorities — built for flow.
        </motion.h3>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
          className="mt-8 flex gap-4 justify-center flex-wrap"
        >
          <Button 
            size="lg" 
            className="bg-accent-blue hover:bg-accent-blue/90 text-white px-8"
          >
            Get Early Access
          </Button>
          <Button 
            size="lg" 
            variant="ghost" 
            className="text-white border border-white/20 hover:bg-white/10"
          >
            Watch 60-sec demo
          </Button>
        </motion.div>
      </div>

      {/* Parallax glow layers */}
      <div 
        className="absolute inset-0 pointer-events-none"
        data-depth="0.1"
      >
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-blue/20 rounded-full blur-3xl" />
      </div>
      <div 
        className="absolute inset-0 pointer-events-none"
        data-depth="0.2"
      >
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent-coral/20 rounded-full blur-3xl" />
      </div>
    </section>
  );
}
