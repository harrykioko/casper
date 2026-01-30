import { ExternalLink, Pencil, Plus, Clock, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Company, CompanyStatus } from '@/types/portfolio';
import { formatDistanceToNow } from 'date-fns';

interface PortfolioCompanyHeroProps {
  company: Company & { open_task_count?: number };
  onEdit: () => void;
  onAddTask: () => void;
  onAddNote: () => void;
}

const statusConfig: Record<CompanyStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  active: { label: 'Active', variant: 'default' },
  watching: { label: 'Watching', variant: 'secondary' },
  exited: { label: 'Exited', variant: 'outline' },
  archived: { label: 'Archived', variant: 'outline' },
};

export function PortfolioCompanyHero({ company, onEdit, onAddTask, onAddNote }: PortfolioCompanyHeroProps) {
  const status = statusConfig[company.status] || statusConfig.active;
  const initials = company.name.slice(0, 2).toUpperCase();
  
  const lastInteraction = company.last_interaction_at 
    ? formatDistanceToNow(new Date(company.last_interaction_at), { addSuffix: true })
    : null;

  return (
    <div className="relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--hero-gradient-start))] via-[hsl(var(--hero-gradient-mid))] to-[hsl(var(--hero-gradient-end))] opacity-30" />
      
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-background/15 backdrop-blur-sm" />
      
      {/* Content */}
      <div className="relative max-w-[1800px] mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          {/* Left cluster */}
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 border-2 border-background/50 shadow-md">
              <AvatarImage src={company.logo_url || undefined} alt={company.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-foreground">{company.name}</h1>
                <Badge variant={status.variant} className="text-xs">
                  {status.label}
                </Badge>
              </div>
              
              {/* Metadata row */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {company.website_url && (
                  <a 
                    href={company.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-foreground transition-colors flex items-center gap-1"
                  >
                    {new URL(company.website_url).hostname.replace('www.', '')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                
                {lastInteraction && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{lastInteraction}</span>
                  </div>
                )}
                
                {typeof company.open_task_count === 'number' && (
                  <div className="flex items-center gap-1.5">
                    <CheckSquare className="h-3.5 w-3.5" />
                    <span>{company.open_task_count} open tasks</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Right cluster (actions) */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onAddNote}>
              <Plus className="h-4 w-4 mr-1" />
              Note
            </Button>
            <Button variant="outline" size="sm" onClick={onAddTask}>
              <Plus className="h-4 w-4 mr-1" />
              Task
            </Button>
            <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
              <Pencil className="h-4 w-4" />
            </Button>
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
        </div>
      </div>
    </div>
  );
}
