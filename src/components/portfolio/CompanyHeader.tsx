import { ExternalLink, Edit, CheckSquare, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CompanyWithStats, CompanyStatus } from '@/types/portfolio';
import { formatDistanceToNow } from 'date-fns';

interface CompanyHeaderProps {
  company: CompanyWithStats;
  onEdit: () => void;
}

const statusColors: Record<CompanyStatus, string> = {
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  watching: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  exited: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  archived: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
};

export function CompanyHeader({ company, onEdit }: CompanyHeaderProps) {
  const lastTouch = company.last_interaction_at
    ? formatDistanceToNow(new Date(company.last_interaction_at), { addSuffix: true })
    : 'No interactions yet';

  return (
    <div className="flex items-start gap-4 p-6 rounded-xl bg-card/50 backdrop-blur-sm border">
      {/* Logo */}
      <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-white dark:bg-zinc-800 border flex items-center justify-center overflow-hidden p-2">
        {company.logo_url ? (
          <img
            src={company.logo_url}
            alt={company.name}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <span className="text-3xl font-bold text-muted-foreground">
            {company.name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-semibold text-foreground truncate">
            {company.name}
          </h1>
          <Badge
            variant="outline"
            className={`capitalize ${statusColors[company.status]}`}
          >
            {company.status}
          </Badge>
          {company.website_url && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => window.open(company.website_url!, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            Last interaction: {lastTouch}
          </span>
          <span className="flex items-center gap-1.5">
            <CheckSquare className="h-4 w-4" />
            {company.open_task_count || 0} open tasks
          </span>
        </div>
      </div>

      {/* Actions */}
      <Button variant="outline" size="sm" onClick={onEdit}>
        <Edit className="h-4 w-4 mr-2" />
        Edit
      </Button>
    </div>
  );
}
