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
    <div className="p-5 pb-4 flex items-start gap-4">
      {/* Logo */}
      <div className="w-14 h-14 rounded-xl bg-white dark:bg-zinc-800 border flex items-center justify-center overflow-hidden p-2 flex-shrink-0">
        {company.logo_url ? (
          <img
            src={company.logo_url}
            alt={company.name}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <span className="text-2xl font-semibold text-muted-foreground">
            {company.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xl font-semibold text-foreground truncate">{company.name}</h2>
          <Badge variant="secondary" className={`text-xs px-2.5 py-0.5 rounded-full ${statusColors[company.status] || ''}`}>
            {company.status}
          </Badge>
        </div>
        
        <div className="flex items-center gap-3 mt-1.5">
          {company.website_url && (
            <a
              href={company.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Website
            </a>
          )}
          <Link
            to={`/portfolio/${company.id}`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            Full page
          </Link>
        </div>
      </div>

      {/* Close button */}
      <Button variant="ghost" size="icon" className="h-9 w-9 flex-shrink-0" onClick={onClose}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
