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
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Founders</h4>
      <div className="space-y-2">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/50"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">{contact.name}</p>
              {contact.role && (
                <p className="text-xs text-muted-foreground truncate">{contact.role}</p>
              )}
            </div>
            
            {contact.email && (
              <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  asChild
                >
                  <a href={`mailto:${contact.email}`}>
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => copyEmail(contact.email!, contact.id)}
                >
                  {copiedId === contact.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
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
