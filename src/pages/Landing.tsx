
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import NavBar from '@/components/marketing/NavBar';
import HeroSection from '@/components/marketing/HeroSection';
import FeatureCarousel from '@/components/marketing/FeatureCarousel';
import SplitFeature from '@/components/marketing/SplitFeature';
import SocialProof from '@/components/marketing/SocialProof';
import PricingTeaser from '@/components/marketing/PricingTeaser';
import FinalCTA from '@/components/marketing/FinalCTA';
import Footer from '@/components/marketing/Footer';

export default function Landing() {
  const navigate = useNavigate();
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

  const splitFeatures = [
    {
      title: 'Projects Hub',
      description: 'Organize everything in one place. Link tasks, store assets, and manage prompts within project contexts. See the bigger picture while staying focused on what matters.',
      imageSrc: '/placeholder-projects.jpg',
      imageAlt: 'Projects Hub Interface',
      reverse: false,
    },
    {
      title: 'Flow Board',
      description: 'Visualize your workflow with Kanban boards, integrated calendar view, and focus mode. Switch seamlessly between planning and execution without losing context.',
      imageSrc: '/placeholder-kanban.jpg',
      imageAlt: 'Flow Board Interface',
      reverse: true,
    },
    {
      title: 'Adaptive Themes',
      description: 'Switch between light and dark modes instantly. Each theme is carefully crafted for optimal contrast and reduced eye strain during long work sessions.',
      imageSrc: '/placeholder-themes.jpg',
      imageAlt: 'Theme Comparison',
      reverse: false,
    },
  ];

  return (
    <div className="min-h-screen">
      <NavBar />
      <HeroSection />
      <FeatureCarousel />
      
      {splitFeatures.map((feature, index) => (
        <SplitFeature
          key={feature.title}
          {...feature}
          index={index}
        />
      ))}
      
      <SocialProof />
      <PricingTeaser />
      <FinalCTA />
      <Footer />
    </div>
  );
}
