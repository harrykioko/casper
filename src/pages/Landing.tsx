
import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Command, Calendar, ClipboardCheck, Sparkles, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LoginModal } from '@/components/landing/LoginModal';
import { FeatureCard } from '@/components/landing/FeatureCard';
import { PreviewCard } from '@/components/landing/PreviewCard';

export default function Landing() {
  const { theme, setTheme } = useTheme();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const features = [
    {
      icon: Command,
      title: "Capture",
      description: "Instant task entry with keyboard shortcuts and command palette."
    },
    {
      icon: ClipboardCheck,
      title: "Organize",
      description: "Link tasks to projects, save prompts, and manage your reading list."
    },
    {
      icon: Calendar,
      title: "Execute",
      description: "Calendar integration and prioritized task views to stay on track."
    }
  ];

  const previewItems = [
    {
      title: "Task Board",
      description: "Visualize your work with customizable views",
      image: "/placeholder.svg"
    },
    {
      title: "Prompt Library",
      description: "Store and retrieve your best prompts instantly",
      image: "/placeholder.svg"
    },
    {
      title: "Project Overview",
      description: "Connect tasks, prompts and resources",
      image: "/placeholder.svg"
    },
    {
      title: "Command Menu",
      description: "Navigate and create with just your keyboard",
      image: "/placeholder.svg"
    }
  ];

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
    <div className="min-h-screen w-full overflow-x-hidden">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 md:px-8 relative">
        <motion.div 
          className="text-center max-w-3xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={fadeUpVariants}
          custom={0}
        >
          <motion.h1 
            className="text-4xl md:text-6xl font-bold tracking-tighter mb-6"
            variants={fadeUpVariants}
            custom={1}
          >
            Your Personal Command Center
          </motion.h1>
          <motion.p 
            className="text-xl md:text-2xl text-muted-foreground mb-8"
            variants={fadeUpVariants}
            custom={2}
          >
            Tasks, prompts, priorities — captured, organized, executed.
          </motion.p>
          <motion.div variants={fadeUpVariants} custom={3}>
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 hover:scale-[1.02] transition-all"
              onClick={() => setIsLoginModalOpen(true)}
            >
              Get Started <ChevronRight className="ml-2" />
            </Button>
          </motion.div>
        </motion.div>
        
        {/* Command Line Preview */}
        <motion.div 
          className="w-full max-w-md mx-auto mt-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
        >
          <Card className="glassmorphic overflow-hidden">
            <CardContent className="p-4 font-mono text-sm">
              <div className="flex items-center text-muted-foreground mb-2">
                <span className="mr-2">$</span>
                <span className="text-foreground">add 'Finish project proposal'</span>
                <span className="ml-2 animate-pulse">⏎</span>
              </div>
              <div className="text-green-500 dark:text-green-400">
                ✓ Task added to 'Work' project
              </div>
              <div className="flex items-center text-muted-foreground mt-2">
                <span className="mr-2">$</span>
                <span className="animate-pulse">|</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Why Casper? Section */}
      <section className="py-24 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Why Casper?
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <FeatureCard 
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Product Preview Carousel */}
      <section className="py-24 px-4 md:px-8 bg-secondary/30 dark:bg-secondary/10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold tracking-tight text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            Built for productivity
          </motion.h2>
          
          <div className="flex overflow-x-auto pb-8 gap-6 snap-x">
            {previewItems.map((item, i) => (
              <PreviewCard 
                key={item.title}
                title={item.title}
                description={item.description}
                image={item.image}
                index={i}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-4 md:px-8 flex flex-col items-center justify-center">
        <motion.div 
          className="text-center max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-8">
            Start your command center today.
          </h2>
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 group relative hover:scale-[1.02] transition-all"
            onClick={() => setIsLoginModalOpen(true)}
          >
            Create Account
            <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-primary via-blue to-coral scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 md:px-8 border-t border-border/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              Casper is a fast, focused productivity tool. Built for clarity.
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <span className="text-xs text-muted-foreground">v0.1 © 2025</span>
          </div>
        </div>
      </footer>

      <LoginModal open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen} />
    </div>
  );
}
