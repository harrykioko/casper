
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
      {/* Custom background for landing page */}
      <div 
        className="absolute inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/lovable-uploads/6b1600fa-ac63-4959-a5f9-335e57be0781.png')`
        }}
      ></div>
      
      {/* Top Navigation */}
      <nav className="absolute top-0 right-0 p-6 z-10">
        <Button
          variant="ghost"
          className="text-sm text-muted-foreground hover:text-foreground transition px-4 py-2"
          onClick={() => setIsLoginModalOpen(true)}
        >
          Log In
        </Button>
      </nav>

      {/* Hero Section - Full Viewport */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 md:px-8 relative">
        <motion.div 
          className="text-center max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
        >
          {/* Casper Wordmark */}
          <motion.div 
            className="text-sm md:text-base font-semibold tracking-[0.25em] text-muted-foreground uppercase mb-4"
            variants={fadeUpVariants}
            custom={0}
          >
            Casper
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            className="text-5xl md:text-6xl font-bold tracking-tight text-center"
            variants={fadeUpVariants}
            custom={1}
          >
            Command your productivity.
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            className="text-xl md:text-2xl text-muted-foreground mt-4 text-center"
            variants={fadeUpVariants}
            custom={2}
          >
            One place for your tasks, prompts, and priorities. Built for flow.
          </motion.p>

          {/* CTA Button */}
          <motion.div 
            className="mt-8"
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
          </motion.div>

          {/* UI Preview Panel */}
          <motion.div 
            className="relative mt-12 max-w-5xl mx-auto rounded-2xl shadow-2xl overflow-hidden bg-white/5 backdrop-blur-xl ring-1 ring-white/10"
            variants={fadeUpVariants}
            custom={4}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
            whileHover={{ scale: 1.02, transition: { duration: 0.3 } }}
          >
            <img 
              src="/lovable-uploads/b10e4c17-6c58-4c6d-8399-51098459811e.png"
              alt="Casper Dashboard Preview"
              className="rounded-2xl w-full"
            />
          </motion.div>
        </motion.div>
      </section>

      <LoginModal open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
    </div>
  );
}
