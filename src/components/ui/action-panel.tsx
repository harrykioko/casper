import * as React from "react";
import { cn } from "@/lib/utils";

type AccentColor = "amber" | "sky" | "emerald";

const gradientColors: Record<AccentColor, string> = {
  amber: "rgba(251,191,36,0.65)",
  sky: "rgba(56,189,248,0.65)",
  emerald: "rgba(52,211,153,0.65)",
};

// ============ ActionPanel (Container) ============
interface ActionPanelProps {
  children: React.ReactNode;
  accentColor: AccentColor;
  className?: string;
}

export function ActionPanel({ children, accentColor, className }: ActionPanelProps) {
  return (
    <div
      className={cn(
        "relative rounded-[24px] overflow-hidden",
        "bg-white/80 dark:bg-slate-900/70",
        "backdrop-blur-xl",
        "shadow-[0_18px_45px_rgba(15,23,42,0.08)] dark:shadow-[0_22px_60px_rgba(15,23,42,0.8)]",
        "border border-white/70 dark:border-white/10",
        className
      )}
    >
      {/* Radial gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-[24px] opacity-[0.08] dark:opacity-[0.06]"
        style={{
          background: `radial-gradient(circle at top left, ${gradientColors[accentColor]}, transparent 55%)`,
        }}
      />
      {/* Content */}
      <div className="relative z-10 p-5 md:p-6 flex flex-col h-full">
        {children}
      </div>
    </div>
  );
}

// ============ ActionPanelHeader ============
interface ActionPanelHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  accentColor: AccentColor;
}

const iconChipStyles: Record<AccentColor, string> = {
  amber: "bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-300",
  sky: "bg-sky-50 text-sky-500 dark:bg-sky-500/10 dark:text-sky-300",
  emerald: "bg-emerald-50 text-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-300",
};

export function ActionPanelHeader({
  icon,
  title,
  subtitle,
  badge,
  accentColor,
}: ActionPanelHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <div className="flex items-center gap-3">
        {/* Icon chip */}
        <div
          className={cn(
            "h-8 w-8 rounded-2xl flex items-center justify-center flex-shrink-0",
            iconChipStyles[accentColor]
          )}
        >
          {icon}
        </div>

        {/* Title + Subtitle */}
        <div>
          <div className="text-xs font-semibold tracking-[0.14em] uppercase text-slate-500 dark:text-slate-400">
            {title}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            {subtitle}
          </div>
        </div>
      </div>

      {/* Right-side badge */}
      {badge}
    </div>
  );
}

// ============ ActionPanelListArea ============
interface ActionPanelListAreaProps {
  children: React.ReactNode;
  accentColor: AccentColor;
  className?: string;
}

const listAreaTints: Record<AccentColor, string> = {
  amber: "bg-amber-50/20 dark:bg-amber-950/10",
  sky: "bg-sky-50/20 dark:bg-sky-950/10",
  emerald: "bg-emerald-50/16 dark:bg-emerald-950/10",
};

export function ActionPanelListArea({
  children,
  accentColor,
  className,
}: ActionPanelListAreaProps) {
  return (
    <div
      className={cn(
        "mt-2 rounded-2xl px-3 py-2 flex-1 overflow-hidden",
        "bg-white/60 dark:bg-slate-900/60",
        "border border-white/60 dark:border-slate-800/80",
        listAreaTints[accentColor],
        className
      )}
    >
      {children}
    </div>
  );
}

// ============ ActionPanelRow ============
interface ActionPanelRowProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  isLast?: boolean;
}

export function ActionPanelRow({
  children,
  onClick,
  className,
  isLast = false,
}: ActionPanelRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between gap-2",
        "py-2 px-0.5 rounded-xl",
        "hover:bg-slate-50/80 dark:hover:bg-slate-800/60",
        !isLast && "border-b border-slate-100/70 dark:border-slate-800/80",
        "transition group text-left",
        className
      )}
    >
      {children}
    </button>
  );
}

// ============ ActionPanelFooter ============
interface ActionPanelFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ActionPanelFooter({ children, className }: ActionPanelFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between mt-4 pt-3",
        "border-t border-slate-100/70 dark:border-slate-800/80",
        "text-[11px]",
        className
      )}
    >
      {children}
    </div>
  );
}

// ============ Badge Components ============
interface LiveBadgeProps {
  accentColor?: AccentColor;
}

const badgeDotColors: Record<AccentColor, string> = {
  amber: "bg-amber-500",
  sky: "bg-sky-500",
  emerald: "bg-emerald-500",
};

export function LiveBadge({ accentColor = "amber" }: LiveBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/5 dark:bg-slate-50/5 px-3 py-1">
      <span className={cn("h-1.5 w-1.5 rounded-full animate-pulse", badgeDotColors[accentColor])} />
      <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Live
      </span>
    </div>
  );
}

interface CountBadgeProps {
  count: number;
  label?: string;
  accentColor?: AccentColor;
}

export function CountBadge({ count, label, accentColor = "sky" }: CountBadgeProps) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/5 dark:bg-slate-50/5 px-3 py-1">
      <span className={cn("h-1.5 w-1.5 rounded-full", badgeDotColors[accentColor])} />
      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
        {count} {label}
      </span>
    </div>
  );
}
