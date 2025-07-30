import { FC, SVGProps } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MetricTileProps {
  label: string;
  value: number;
  color: string;
  icon?: FC<SVGProps<SVGSVGElement>>;
  size?: 'sm' | 'lg';
  selected?: boolean;
  onClick?: () => void;
}

export const MetricTile: FC<MetricTileProps> = ({
  label, 
  value, 
  color, 
  icon: Icon, 
  size = 'sm', 
  selected, 
  onClick,
}) => {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative flex flex-col justify-between glass-card p-3 transition-all duration-200 hover:scale-[1.02] cursor-pointer',
        size === 'lg' ? 'py-5' : 'py-3',
        selected && 'ring-2 ring-primary/70',
        'group'
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {Icon && (
        <Icon className={cn(
          'absolute top-2 right-2 transition-colors duration-200',
          size === 'lg' ? 'h-6 w-6' : 'h-4 w-4',
          `text-${color}-500`,
          'group-hover:opacity-80'
        )}/>
      )}

      <motion.div
        className={cn(
          'font-bold transition-colors duration-200',
          size === 'lg' ? 'text-4xl' : 'text-2xl',
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

      <span className={cn(
        'text-xs uppercase tracking-wide text-muted-foreground mt-1',
        size === 'lg' ? 'text-sm' : 'text-xs'
      )}>
        {label}
      </span>
    </motion.button>
  );
};