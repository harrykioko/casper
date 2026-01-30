import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassPanel } from '@/components/ui/glass-panel';

interface EmptyModeProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaDisabled?: boolean;
  onCtaClick?: () => void;
}

export function EmptyMode({ 
  icon: Icon, 
  title, 
  description, 
  ctaLabel, 
  ctaDisabled = true,
  onCtaClick 
}: EmptyModeProps) {
  return (
    <GlassPanel className="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      
      <h3 className="text-sm font-medium text-foreground mb-1">
        {title}
      </h3>
      
      <p className="text-xs text-muted-foreground max-w-[280px] mb-4">
        {description}
      </p>
      
      {ctaLabel && (
        <Button 
          variant="outline" 
          size="sm" 
          disabled={ctaDisabled}
          onClick={onCtaClick}
        >
          {ctaLabel}
        </Button>
      )}
    </GlassPanel>
  );
}
