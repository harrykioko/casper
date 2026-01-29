import { FC, SVGProps } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface MetricTileProps {
  label: string;
  value: number;
  color: string;
  icon?: FC<SVGProps<SVGSVGElement>>;
  size?: 'sm' | 'lg';
  selected?: boolean;
  onClick?: () => void;
  sublabel?: string;
}

export const MetricTile: FC<MetricTileProps> = ({
  label, 
  value, 
  color, 
  icon: Icon, 
  size = 'sm', 
  selected, 
  onClick,
  sublabel,
}) => {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'flex flex-col justify-center items-center glass-card transition-all duration-200 hover:scale-[1.02] cursor-pointer',
        size === 'lg' ? 'p-6 h-20 w-full' : 'p-3 h-auto min-h-16 w-full',
        selected && 'ring-2 ring-primary/70',
        'group'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-2">
        <motion.div
          className={cn(
            'font-bold transition-colors duration-200',
            size === 'lg' ? 'text-3xl' : 'text-xl',
            `text-${color}-500`
          )}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: 'spring',
            stiffness: 120,
            damping: 14,
            delay: 0.1
          }}
        >
          {value}
        </motion.div>
        
        {Icon && (
          <Icon className={cn(
            'transition-colors duration-200',
            size === 'lg' ? 'h-5 w-5' : 'h-4 w-4',
            `text-${color}-500`,
            'group-hover:opacity-80'
          )}/>
        )}
      </div>

      <span className={cn(
        'text-xs uppercase tracking-wide text-muted-foreground mt-1 text-center',
        size === 'lg' ? 'text-sm' : 'text-xs'
      )}>
        {label}
      </span>

      {sublabel && (
        <span className="text-[10px] text-muted-foreground/70 mt-0.5 text-center">
          {sublabel}
        </span>
      )}
    </motion.button>
  );
};