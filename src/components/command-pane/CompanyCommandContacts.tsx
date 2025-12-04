import { Mail, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompanyContact } from '@/types/portfolio';
import { useState } from 'react';
import { toast } from 'sonner';

interface CompanyCommandContactsProps {
  contacts: CompanyContact[];
}

export function CompanyCommandContacts({ contacts }: CompanyCommandContactsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyEmail = async (email: string, contactId: string) => {
    await navigator.clipboard.writeText(email);
    setCopiedId(contactId);
    toast.success('Email copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-card/50 border border-border/30 rounded-xl p-4 backdrop-blur-sm space-y-4">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Founders</h4>
      <div className="space-y-2">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30 hover:bg-muted/50 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium text-foreground truncate">{contact.name}</p>
              {contact.role && (
                <p className="text-sm text-muted-foreground truncate">{contact.role}</p>
              )}
            </div>
            
            {contact.email && (
              <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  asChild
                >
                  <a href={`mailto:${contact.email}`}>
                    <Mail className="w-4 h-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => copyEmail(contact.email!, contact.id)}
                >
                  {copiedId === contact.id ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
