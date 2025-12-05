import * as React from "react";
import { cn } from "@/lib/utils";

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Panel size variant */
  variant?: "default" | "subtle" | "strong";
  /** Whether to add hover elevation effect */
  hoverable?: boolean;
  /** Custom padding override */
  padding?: "none" | "sm" | "md" | "lg";
}

const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, variant = "default", hoverable = false, padding = "lg", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base glass styling
          "rounded-[28px] backdrop-blur-xl",
          "border transition-all duration-200",
          
          // Light mode
          "bg-white/75 border-white/20 shadow-glass-light",
          
          // Dark mode
          "dark:bg-zinc-900/55 dark:border-white/[0.08] dark:shadow-glass-dark",
          
          // Variant adjustments
          variant === "subtle" && "bg-white/50 dark:bg-zinc-900/40",
          variant === "strong" && "bg-white/90 dark:bg-zinc-900/70",
          
          // Padding variants
          padding === "none" && "p-0",
          padding === "sm" && "p-3",
          padding === "md" && "p-4",
          padding === "lg" && "p-6",
          
          // Hover effect
          hoverable && [
            "hover:shadow-glass-hover hover:-translate-y-0.5",
            "dark:hover:shadow-glass-dark-hover",
            "cursor-pointer"
          ],
          
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassPanel.displayName = "GlassPanel";

export interface GlassPanelHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  action?: React.ReactNode;
}

const GlassPanelHeader = React.forwardRef<HTMLDivElement, GlassPanelHeaderProps>(
  ({ className, title, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between mb-4",
          className
        )}
        {...props}
      >
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
    );
  }
);

GlassPanelHeader.displayName = "GlassPanelHeader";

export interface GlassSubcardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

const GlassSubcard = React.forwardRef<HTMLDivElement, GlassSubcardProps>(
  ({ className, hoverable = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl p-4 transition-all duration-150",
          "bg-white/50 dark:bg-white/[0.04]",
          "border border-white/30 dark:border-white/[0.06]",
          hoverable && "hover:bg-white/70 dark:hover:bg-white/[0.08] cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassSubcard.displayName = "GlassSubcard";

export { GlassPanel, GlassPanelHeader, GlassSubcard };
