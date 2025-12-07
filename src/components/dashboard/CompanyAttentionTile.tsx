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
        "relative w-20 h-20 rounded-2xl overflow-hidden",
        "ring-4 ring-offset-2 ring-offset-background",
        statusRingColors[company.status],
        "transition-all duration-200 ease-out",
        "hover:scale-105 hover:shadow-lg",
        "focus:outline-none focus-visible:ring-offset-4",
        "group"
      )}
    >
      {/* Background */}
      <div className={cn(
        "absolute inset-0",
        statusBgColors[company.status],
        "bg-muted/50"
      )} />
      
      {/* Logo or initials */}
      {company.logoUrl ? (
        <img
          src={company.logoUrl}
          alt={company.name}
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
      ) : null}
      
      {/* Initials fallback */}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center",
        "text-lg font-semibold text-foreground/80",
        company.logoUrl && "hidden"
      )}>
        {initials}
      </div>

      {/* Pipeline badge */}
      {company.entityType === 'pipeline' && (
        <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded text-[9px] font-medium bg-primary/80 text-primary-foreground">
          P
        </div>
      )}
      
      {/* Hover overlay */}
      <div className={cn(
        "absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5",
        "transition-colors duration-200"
      )} />
    </button>
  );
}
