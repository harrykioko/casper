
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import { LoginModal } from '@/components/landing/LoginModal';

export default function Landing() {
  const { theme, setTheme } = useTheme();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: custom * 0.1,
        duration: 0.5
      }
    })
  };

  return (
    <div className="min-h-screen w-full overflow-hidden relative">
      {/* Theme Toggle - Fixed in top right */}
      <div className="fixed top-6 right-6 z-50">
        <Button 
          variant="ghost" 
          size="icon"
          className="glassmorphic"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>

      {/* Hero Section - Full viewport */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 md:px-8 relative">
        <motion.div 
          className="text-center max-w-5xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={fadeUpVariants}
          custom={0}
        >
          {/* Casper Logo/Wordmark */}
          <motion.div 
            className="text-2xl md:text-3xl font-bold tracking-widest text-primary uppercase mb-6"
            variants={fadeUpVariants}
            custom={1}
          >
            Casper
          </motion.div>

          {/* Main Headline */}
          <motion.h1 
            className="text-5xl md:text-6xl font-bold tracking-tighter text-center"
            variants={fadeUpVariants}
            custom={2}
          >
            Your Personal Command Center
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            className="text-xl md:text-2xl text-muted-foreground mt-4"
            variants={fadeUpVariants}
            custom={3}
          >
            Tasks, prompts, priorities — captured, organized, executed.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            className="flex gap-4 justify-center mt-8"
            variants={fadeUpVariants}
            custom={4}
          >
            <Button 
              className="glassmorphic text-lg px-6 py-4 font-semibold transition hover:scale-[1.03] bg-primary/90 hover:bg-primary text-primary-foreground"
              onClick={() => setIsLoginModalOpen(true)}
            >
              Create Account
            </Button>
            <Button 
              variant="outline"
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
            custom={5}
          >
            <div className="rounded-xl shadow-2xl ring-1 ring-white/10 dark:ring-white/5 backdrop-blur-md overflow-hidden">
              <img 
                src="/lovable-uploads/d31f963e-ec8c-497f-a00f-505ab514001b.png" 
                alt="Casper Dashboard Preview" 
                className="w-full h-auto object-cover"
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      <LoginModal open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
    </div>
  );
}
