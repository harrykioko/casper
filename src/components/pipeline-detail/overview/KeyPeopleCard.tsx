import { User, Linkedin, Plus } from 'lucide-react';
import { GlassPanel } from '@/components/ui/glass-panel';
import { Button } from '@/components/ui/button';
import { KeyPerson } from '@/types/enrichment';

interface KeyPeopleCardProps {
  people: KeyPerson[];
  companyId: string;
  onAddNote?: (personName: string) => void;
}

export function KeyPeopleCard({ people, onAddNote }: KeyPeopleCardProps) {
  if (!people || people.length === 0) {
    return null;
  }

  return (
    <GlassPanel variant="subtle" padding="md">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Key people</span>
        </div>

        <div className="space-y-2">
          {people.map((person, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{person.name}</p>
                  {person.title && (
                    <p className="text-xs text-muted-foreground truncate">{person.title}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {person.linkedin_url && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    asChild
                  >
                    <a 
                      href={person.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="View LinkedIn profile"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                    </a>
                  </Button>
                )}
                {onAddNote && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => onAddNote(person.name)}
                    title="Add relationship note"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlassPanel>
  );
}
