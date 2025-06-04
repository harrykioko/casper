
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/use-theme';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';

export default function NavBar() {
  const { theme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Changelog', href: '#changelog' },
    { label: 'Log in', href: '/auth' },
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed top-0 left-0 right-0 z-50 h-18"
    >
      <div className="glass-surface h-18 border-b border-white/10">
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center"
          >
            <img 
              src="/lovable-uploads/90a8f6b4-a090-4ae5-99fa-ec4f27894ebf.png"
              alt="Casper"
              className={`h-8 w-auto transition-all duration-300 ${
                theme === 'dark' 
                  ? 'brightness-0 invert' 
                  : 'brightness-0'
              }`}
            />
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link, index) => (
              <motion.a
                key={link.label}
                href={link.href}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-sm font-medium hover:text-accent-blue transition-colors duration-200"
              >
                {link.label}
              </motion.a>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="glass-surface border-white/20"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            
            <Button size="sm" className="bg-accent-blue hover:bg-accent-blue/90 text-white">
              Get Early Access
            </Button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
