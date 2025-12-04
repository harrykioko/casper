import { ExternalLink, Calendar, CheckSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CompanyWithStats, CompanyStatus } from '@/types/portfolio';
import { format, formatDistanceToNow } from 'date-fns';

interface PortfolioCompanyCardProps {
  company: CompanyWithStats;
  onClick: () => void;
}

const statusColors: Record<CompanyStatus, string> = {
  active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  watching: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  exited: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  archived: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
};

export function PortfolioCompanyCard({ company, onClick }: PortfolioCompanyCardProps) {
  const lastTouch = company.last_interaction_at
    ? `Last touch: ${formatDistanceToNow(new Date(company.last_interaction_at), { addSuffix: true })}`
    : 'No interactions yet';

  return (
    <Card 
      className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:ring-1 hover:ring-primary/10 bg-card/50 backdrop-blur-sm"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Logo */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
            {company.logo_url ? (
              <img 
                src={company.logo_url} 
                alt={company.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg font-semibold text-muted-foreground">
                {company.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-foreground truncate">
                {company.name}
              </h3>
              {company.website_url && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(company.website_url!, '_blank');
                  }}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Badge 
                variant="outline" 
                className={`text-xs capitalize ${statusColors[company.status]}`}
              >
                {company.status}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {lastTouch}
              </span>
              <span className="flex items-center gap-1">
                <CheckSquare className="h-3 w-3" />
                {company.open_task_count || 0} open tasks
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
