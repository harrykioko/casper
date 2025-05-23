import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import { LoginModal } from '@/components/landing/LoginModal';
import { FeatureCard } from '@/components/landing/FeatureCard';
import { PreviewCard } from '@/components/landing/PreviewCard';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle, Target, Zap, Globe, Calendar, BookOpen, Lightbulb, Settings } from 'lucide-react';

export default function Landing() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { user, loading } = useAuth();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

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
          onClick={() => navigate('/auth')}
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
            className="text-3xl md:text-4xl font-bold tracking-tight text-center"
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

          {/* UI Preview Panel - Enhanced with animations */}
          <motion.div 
            className="mt-16 max-w-5xl mx-auto rounded-2xl shadow-2xl overflow-hidden bg-white/5 backdrop-blur-xl ring-1 ring-white/10"
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
            whileHover={{ scale: 1.01 }}
          >
            <motion.img 
              src="/lovable-uploads/b10e4c17-6c58-4c6d-8399-51098459811e.png"
              alt="Casper Dashboard Preview"
              className="rounded-2xl w-full"
              animate={{ 
                rotate: [0, 0.3, -0.3, 0], 
                y: [0, -1.5, 1.5, 0] 
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 12, 
                ease: "easeInOut" 
              }}
            />
          </motion.div>
        </motion.div>
      </section>
    </div>
  );
}
