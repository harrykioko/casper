import { Link } from 'react-router-dom';
import { ExternalLink, X, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CompanyWithStats } from '@/types/portfolio';

interface CompanyCommandHeaderProps {
  company: CompanyWithStats;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  watching: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  exited: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  archived: 'bg-muted text-muted-foreground',
};

export function CompanyCommandHeader({ company, onClose }: CompanyCommandHeaderProps) {
  return (
    <div className="p-4 flex items-start gap-3">
      {/* Logo */}
      <div className="w-12 h-12 rounded-lg bg-white dark:bg-zinc-800 border flex items-center justify-center overflow-hidden p-1.5 flex-shrink-0">
        {company.logo_url ? (
          <img
            src={company.logo_url}
            alt={company.name}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <span className="text-xl font-semibold text-muted-foreground">
            {company.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-foreground truncate">{company.name}</h2>
          <Badge variant="secondary" className={`text-[10px] ${statusColors[company.status] || ''}`}>
            {company.status}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 mt-1">
          {company.website_url && (
            <a
              href={company.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Website
            </a>
          )}
          <Link
            to={`/portfolio/${company.id}`}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowUpRight className="w-3 h-3" />
            Full page
          </Link>
        </div>
      </div>

      {/* Close button */}
      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={onClose}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
