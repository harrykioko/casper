
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import { LoginModal } from '@/components/landing/LoginModal';

export default function Landing() {
  const { theme } = useTheme();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: custom * 0.2,
        duration: 0.8,
        ease: "easeOut"
      }
    })
  };

  return (
    <div className="min-h-screen w-full overflow-hidden relative">
      {/* Background with subtle blur overlay */}
      <div className="absolute inset-0 z-[-1] bg-background"></div>
      <div className="absolute inset-0 z-[-1] bg-gradient-to-br from-background via-background/95 to-background/90"></div>
      
      {/* Hero Section - Full Viewport */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 md:px-8 relative">
        <motion.div 
          className="text-center max-w-6xl mx-auto"
          initial="hidden"
          animate="visible"
        >
          {/* Casper Logo/Wordmark */}
          <motion.div 
            className="text-2xl md:text-3xl font-bold tracking-widest text-primary uppercase mb-6"
            variants={fadeUpVariants}
            custom={0}
          >
            CASPER
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            className="text-5xl md:text-6xl font-bold tracking-tighter text-center mb-4"
            variants={fadeUpVariants}
            custom={1}
          >
            Your Personal Command Center
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            className="text-xl md:text-2xl text-muted-foreground mt-4 mb-8"
            variants={fadeUpVariants}
            custom={2}
          >
            Tasks, prompts, priorities — captured, organized, executed.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            className="flex gap-4 justify-center mt-8 mb-12"
            variants={fadeUpVariants}
            custom={3}
          >
            <Button 
              size="lg" 
              className="glassmorphic text-lg px-6 py-4 font-semibold transition hover:scale-[1.03] bg-primary hover:bg-primary/90"
              onClick={() => setIsLoginModalOpen(true)}
            >
              Create Account
            </Button>
            <Button 
              variant="outline"
              size="lg" 
              className="glassmorphic text-lg px-6 py-4 font-semibold transition hover:scale-[1.03] bg-background/50 hover:bg-background/70"
              onClick={() => setIsLoginModalOpen(true)}
            >
              Log In
            </Button>
          </motion.div>

          {/* Dashboard Preview Image */}
          <motion.div 
            className="max-w-4xl mt-12 mx-auto"
            variants={fadeUpVariants}
            custom={4}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
          >
            <div className="relative">
              <img 
                src="/lovable-uploads/b10e4c17-6c58-4c6d-8399-51098459811e.png"
                alt="Casper Dashboard Preview"
                className="w-full rounded-xl shadow-2xl ring-1 ring-white/10 dark:ring-white/5 backdrop-blur-md"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-background/20 to-transparent pointer-events-none"></div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <LoginModal open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
    </div>
  );
}
