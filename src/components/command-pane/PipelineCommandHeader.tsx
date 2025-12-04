import { Link } from 'react-router-dom';
import { ExternalLink, X, ArrowUpRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PipelineCompanyDetail } from '@/types/pipelineExtended';

interface PipelineCommandHeaderProps {
  company: PipelineCompanyDetail;
  onClose: () => void;
  onToggleTopOfMind?: () => void;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  passed: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400',
  to_share: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  interesting: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  pearls: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
};

export function PipelineCommandHeader({ company, onClose, onToggleTopOfMind }: PipelineCommandHeaderProps) {
  return (
    <div className="px-4 py-3 flex items-center gap-3">
      {/* Logo */}
      <div className="w-11 h-11 rounded-lg bg-white dark:bg-zinc-800 border flex items-center justify-center overflow-hidden p-1.5 flex-shrink-0">
        {company.logo_url ? (
          <img
            src={company.logo_url}
            alt={company.company_name}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <span className="text-lg font-semibold text-muted-foreground">
            {company.company_name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground truncate">{company.company_name}</h2>
          <Badge variant="secondary" className={`text-[10px] px-2 py-0 rounded-full ${statusColors[company.status] || ''}`}>
            {company.status.replace('_', ' ')}
          </Badge>
          {company.is_top_of_mind && (
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          )}
        </div>
        
        <div className="flex items-center gap-2.5 mt-0.5 flex-wrap">
          <span className="text-xs text-muted-foreground">{company.current_round}</span>
          {company.sector && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{company.sector}</span>
            </>
          )}
          {company.website && (
            <>
              <span className="text-muted-foreground">·</span>
              <a
                href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Website
              </a>
            </>
          )}
          <Link
            to="/pipeline"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowUpRight className="w-3 h-3" />
            Full page
          </Link>
        </div>
      </div>

      {/* Toggle Top of Mind */}
      {onToggleTopOfMind && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0"
          onClick={onToggleTopOfMind}
          title={company.is_top_of_mind ? 'Remove from focus' : 'Add to focus'}
        >
          <Star className={`w-4 h-4 ${company.is_top_of_mind ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
        </Button>
      )}

      {/* Close button */}
      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={onClose}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
