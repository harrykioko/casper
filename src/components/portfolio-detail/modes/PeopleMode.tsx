import { Mail, Copy, Star, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassPanel, GlassPanelHeader } from '@/components/ui/glass-panel';
import { CompanyContact } from '@/types/portfolio';
import { toast } from 'sonner';

interface PeopleModeProps {
  founders: CompanyContact[];
}

export function PeopleMode({ founders }: PeopleModeProps) {
  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success('Email copied to clipboard');
  };

  if (founders.length === 0) {
    return (
      <GlassPanel className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Users className="w-6 h-6 text-muted-foreground" />
        </div>
        
        <h3 className="text-sm font-medium text-foreground mb-1">
          No contacts yet
        </h3>
        
        <p className="text-xs text-muted-foreground max-w-[280px]">
          Add founders and key contacts to track your relationships with this company.
        </p>
      </GlassPanel>
    );
  }

  return (
    <div className="space-y-4">
      <GlassPanel>
        <GlassPanelHeader title="Founders & Contacts" />
        
        <div className="space-y-3">
          {founders.map((founder) => (
            <div
              key={founder.id}
              className={`p-4 rounded-xl transition-colors ${
                founder.is_primary
                  ? 'bg-primary/5 border border-primary/20'
                  : 'bg-muted/30 hover:bg-muted/50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {founder.name}
                    </span>
                    {founder.is_primary && (
                      <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                    )}
                    {founder.is_founder && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground uppercase tracking-wider">
                        Founder
                      </span>
                    )}
                  </div>
                  {founder.role && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {founder.role}
                    </p>
                  )}
                  {founder.email && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {founder.email}
                    </p>
                  )}
                </div>

                {founder.email && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => window.open(`mailto:${founder.email}`, '_blank')}
                      title="Send email"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => copyEmail(founder.email!)}
                      title="Copy email"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </div>
  );
}
