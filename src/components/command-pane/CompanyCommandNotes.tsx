import { useState } from 'react';
import { Send, MessageSquare, Phone, Users, Mail, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompanyInteraction, InteractionType } from '@/types/portfolio';
import { formatDistanceToNow } from 'date-fns';

interface CompanyCommandNotesProps {
  interactions: CompanyInteraction[];
  companyId: string;
  onCreateInteraction: (data: {
    interaction_type: InteractionType;
    content: string;
    occurred_at?: string;
  }) => Promise<unknown>;
}

const interactionIcons: Record<InteractionType, typeof MessageSquare> = {
  note: MessageSquare,
  call: Phone,
  meeting: Users,
  email: Mail,
  update: Bell,
};

export function CompanyCommandNotes({ interactions, companyId, onCreateInteraction }: CompanyCommandNotesProps) {
  const [content, setContent] = useState('');
  const [type, setType] = useState<InteractionType>('note');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreateInteraction({
        interaction_type: type,
        content: content.trim(),
        occurred_at: new Date().toISOString(),
      });
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-card/60 border border-border/40 rounded-xl p-4 backdrop-blur-sm space-y-4">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Notes & Interactions</h4>

      {/* Quick add form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <Select value={type} onValueChange={(v) => setType(v as InteractionType)}>
            <SelectTrigger className="w-[110px] h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="note">Note</SelectItem>
              <SelectItem value="call">Call</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="update">Update</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" size="sm" className="h-9" disabled={isSubmitting || !content.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <Textarea
          placeholder="Add a note..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[80px] text-sm resize-none bg-muted/30 rounded-lg px-3 py-2.5"
          disabled={isSubmitting}
        />
      </form>

      {/* Recent interactions */}
      {interactions.length > 0 && (
        <div className="space-y-2">
          {interactions.map((interaction) => {
            const Icon = interactionIcons[interaction.interaction_type] || MessageSquare;
            return (
              <div
                key={interaction.id}
                className="p-3 rounded-lg bg-muted/30 border border-border/30"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground capitalize">
                    {interaction.interaction_type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(interaction.occurred_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-foreground line-clamp-2">{interaction.content}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
