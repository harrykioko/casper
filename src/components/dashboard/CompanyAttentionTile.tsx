import { CompanyAttentionState } from '@/types/attention';
import { cn } from '@/lib/utils';

interface CompanyAttentionTileProps {
  company: CompanyAttentionState;
  onClick: (company: CompanyAttentionState) => void;
}

const statusGlowColors: Record<string, string> = {
  red: 'shadow-[0_0_0_3px_rgba(248,113,113,0.6)]',
  yellow: 'shadow-[0_0_0_3px_rgba(251,191,36,0.6)]',
  green: 'shadow-[0_0_0_3px_rgba(52,211,153,0.6)]',
};

const statusDotColors: Record<string, string> = {
  red: 'bg-rose-400',
  yellow: 'bg-amber-300',
  green: 'bg-emerald-400',
};

export function CompanyAttentionTile({ company, onClick }: CompanyAttentionTileProps) {
  const initials = company.name
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <button
      onClick={() => onClick(company)}
      className={cn(
        // Size & shape
        "relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl",
        // Glass background
        "bg-white/5 dark:bg-white/10",
        "backdrop-blur-md",
        "border border-white/10 dark:border-white/5",
        // Status glow ring
        statusGlowColors[company.status],
        // Hover effects
        "hover:scale-[1.04] hover:shadow-lg hover:border-white/20",
        // Transitions
        "transition-all duration-150 ease-out",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        "group"
      )}
    >
      {/* Status dot indicator */}
      <div
        className={cn(
          "absolute top-1 left-1 z-10",
          "w-2 h-2 rounded-full",
          statusDotColors[company.status],
          "shadow-[0_0_0_2px_rgba(255,255,255,0.3)]"
        )}
      />

      {/* Logo container */}
      <div className="absolute inset-0 flex items-center justify-center p-2">
        <div className={cn(
          "w-8 h-8 sm:w-10 sm:h-10 rounded-xl",
          "flex items-center justify-center",
          "bg-black/5 dark:bg-white/5",
          "overflow-hidden"
        )}>
          {company.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={company.name}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.parentElement?.querySelector('[data-initials]');
                if (fallback) (fallback as HTMLElement).style.display = 'flex';
              }}
            />
          ) : null}
          
          {/* Initials fallback */}
          <span
            data-initials
            className={cn(
              "text-sm sm:text-base font-semibold",
              "text-slate-800 dark:text-slate-100",
              company.logoUrl ? "hidden" : "flex"
            )}
            style={{ display: company.logoUrl ? 'none' : 'flex' }}
          >
            {initials}
          </span>
        </div>
      </div>

      {/* Hover overlay */}
      <div className={cn(
        "absolute inset-0 rounded-2xl",
        "bg-white/0 group-hover:bg-white/5",
        "transition-colors duration-150"
      )} />

      {/* Pipeline badge */}
      {company.entityType === 'pipeline' && (
        <div className={cn(
          "absolute -bottom-1 -right-1 z-10",
          "px-1.5 py-0.5 rounded text-[9px] font-medium",
          "bg-primary text-primary-foreground shadow-sm"
        )}>
          P
        </div>
      )}
    </button>
  );
}
