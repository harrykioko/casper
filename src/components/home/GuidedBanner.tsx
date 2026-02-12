import { X, Compass } from "lucide-react";

interface GuidedBannerProps {
  moveLabel: string;
  remainingCount: number;
  onDismiss: () => void;
}

export function GuidedBanner({ moveLabel, remainingCount, onDismiss }: GuidedBannerProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 mb-4">
      <div className="flex items-center gap-2 min-w-0">
        <Compass className="h-3.5 w-3.5 text-violet-400 shrink-0" />
        <span className="text-xs font-medium text-violet-300 truncate">
          Guided: {moveLabel}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-400 tabular-nums shrink-0">
          {remainingCount} remaining
        </span>
      </div>
      <button
        onClick={onDismiss}
        className="shrink-0 p-1 rounded-md hover:bg-violet-500/20 transition-colors"
      >
        <X className="h-3.5 w-3.5 text-violet-400" />
      </button>
    </div>
  );
}
