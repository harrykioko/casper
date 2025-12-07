import { CompanyAttentionState } from '@/types/attention';
import { cn } from '@/lib/utils';

interface CompanyAttentionTileProps {
  company: CompanyAttentionState;
  onClick: (company: CompanyAttentionState) => void;
}

const statusRingColors: Record<string, string> = {
  red: 'ring-red-500',
  yellow: 'ring-amber-400',
  green: 'ring-emerald-500',
};

const statusBgColors: Record<string, string> = {
  red: 'bg-red-500/10',
  yellow: 'bg-amber-400/10',
  green: 'bg-emerald-500/10',
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
        "relative w-20 h-20 rounded-2xl",
        "ring-4 ring-offset-2 ring-offset-background",
        statusRingColors[company.status],
        "transition-all duration-200 ease-out",
        "hover:scale-105 hover:shadow-lg",
        "focus:outline-none focus-visible:ring-offset-4",
        "group"
      )}
    >
      {/* Inner container that clips content */}
      <div className={cn(
        "absolute inset-0 rounded-2xl overflow-hidden",
        "bg-white dark:bg-zinc-800"
      )}>
        {/* Status tint background */}
        <div className={cn(
          "absolute inset-0",
          statusBgColors[company.status]
        )} />
        
        {/* Logo container with padding */}
        {company.logoUrl ? (
          <div className="absolute inset-2 flex items-center justify-center">
            <img
              src={company.logoUrl}
              alt={company.name}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.parentElement?.nextElementSibling;
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
          </div>
        ) : null}
        
        {/* Initials fallback */}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center",
          "text-lg font-semibold text-foreground/80",
          company.logoUrl && "hidden"
        )}>
          {initials}
        </div>

        {/* Hover overlay */}
        <div className={cn(
          "absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5",
          "transition-colors duration-200"
        )} />
      </div>

      {/* Pipeline badge - outside clipped area */}
      {company.entityType === 'pipeline' && (
        <div className="absolute -bottom-1 -right-1 z-10 px-1.5 py-0.5 rounded text-[9px] font-medium bg-primary text-primary-foreground shadow-sm">
          P
        </div>
      )}
    </button>
  );
}
