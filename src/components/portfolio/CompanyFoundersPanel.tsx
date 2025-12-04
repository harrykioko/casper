import { Mail, Copy, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CompanyContact } from '@/types/portfolio';
import { toast } from 'sonner';

interface CompanyFoundersPanelProps {
  founders: CompanyContact[];
}

export function CompanyFoundersPanel({ founders }: CompanyFoundersPanelProps) {
  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    toast.success('Email copied to clipboard');
  };

  if (founders.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">Founders</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No founders added yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Founders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {founders.map((founder) => (
          <div
            key={founder.id}
            className={`p-3 rounded-lg border ${
              founder.is_primary
                ? 'bg-primary/5 border-primary/20'
                : 'bg-muted/30'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {founder.name}
                  </span>
                  {founder.is_primary && (
                    <Star className="h-3 w-3 fill-primary text-primary" />
                  )}
                </div>
                {founder.role && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {founder.role}
                  </p>
                )}
              </div>

              {founder.email && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => window.open(`mailto:${founder.email}`, '_blank')}
                    title="Send email"
                  >
                    <Mail className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => copyEmail(founder.email!)}
                    title="Copy email"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {founder.email && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {founder.email}
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
